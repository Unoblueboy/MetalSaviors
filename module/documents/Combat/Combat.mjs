import { rollInitiative } from "../../helpers/roll.mjs";
import { isExecutingGm } from "../helpers/SocketsHelper.mjs";
import { MetalSaviorsCombatantMultiRollDialog } from "./Dialogs/CombatantRollDialog.mjs";
import { MetalSaviorsCombatExcessActionsDialog } from "./Dialogs/CombatExcessActionsDialog.mjs";

export class MetalSaviorsCombat extends Combat {
	/* Some notes on Combat
     - Initiative ties are resloved as follows 
       1 - Highest Finesse
       2 - Highest Speed
       3 - Player Order
     - Should keep track of Actions Used in a round
     - Should also keep track of current speed for CAV combat
     - Excess Actions can be:
       - Converted to Movement Momentum
       - Increase Initiative
    */
	constructor(data, context) {
		super(data, context);
		socket.on("system.metalsaviors", (arg) => this._socketEventHandler(arg));
	}

	async _socketEventHandler(data) {
		const { location = "", action = "", payload = {} } = data;

		if (location !== "Combat") return;
		if (payload.targetId !== this.id) return;
		console.log("Handling Combat Socket Event", data);

		switch (action) {
			case "pushHistory":
				if (!isExecutingGm()) return;
				await this._pushHistory(payload.data);
				break;
			case "nextTurn":
				if (!isExecutingGm()) return;
				await this.nextTurn();
				break;
			case "previousTurn":
				if (!isExecutingGm()) return;
				await this.previousTurn();
				break;
			case "playerEndRound":
				if (game.user.id !== payload.userId) return;
				await this._endPlayerRound(payload.combatantId);
				break;
			case "spendExcessActions":
				if (!isExecutingGm()) return;
				await this.spendExcessActions(payload.details);
				break;
			default:
				break;
		}
	}

	_sortCombatants(a, b) {
		const initA = _checkNumeric(a.initiative);
		const initB = _checkNumeric(b.initiative);

		// First Check inititatives
		const initDifference = initB - initA;
		if (initDifference != 0) {
			return initDifference;
		}

		if (a.actor.type !== "character" || b.actor.type !== "character") {
			return a.tokenId - b.tokenId;
		}

		// On initiative ties, check finesse
		const finA = _checkNumeric(a.actor.data.data.attributes.fin.value);
		const finB = _checkNumeric(b.actor.data.data.attributes.fin.value);

		const finDifference = finB - finA;
		if (finDifference != 0) {
			return finDifference;
		}

		// On finesse ties, check speed
		const spdA = _checkNumeric(a.actor.data.data.attributes.spd.value);
		const spdB = _checkNumeric(b.actor.data.data.attributes.spd.value);

		const spdDifference = spdB - spdA;
		if (spdDifference != 0) {
			return spdDifference;
		}

		// Otherwise use arbritrary value
		return a.tokenId - b.tokenId;
	}

	async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
		// Structure input data
		ids = typeof ids === "string" ? [ids] : ids;

		if (!ids.length) return this;

		const combatants = ids.map((id) => this.combatants.get(id, { strict: true }));
		const allInitiativeOptions = await MetalSaviorsCombatantMultiRollDialog.getInitiativeOptions(combatants);

		if (allInitiativeOptions.cancelled) {
			return this;
		}

		// Iterate over Combatants, performing an initiative roll for each
		const updates = [];
		let firstIter = true;
		for (const [id, initiativeOptions] of Object.entries(allInitiativeOptions)) {
			const combatant = this.combatants.get(id, { strict: true });
			const messageData = {
				speaker: ChatMessage.getSpeaker({
					actor: combatant.actor,
					token: combatant.token,
					alias: combatant.name,
				}),
				flavor: game.i18n.format("COMBAT.RollsInitiative", { name: combatant.name }),
				flags: { "core.initiativeRoll": true },
			};

			const roll = await rollInitiative(combatant, {
				...initiativeOptions,
				messageData,
				makeSound: firstIter,
			});

			if (initiativeOptions.combatSpeed !== undefined) {
				await combatant.setMovementSpeed(initiativeOptions.combatSpeed);
			}

			updates.push({ _id: id, initiative: roll.total });

			if (firstIter) {
				firstIter = false;
			}
		}

		if (!updates.length) return this;

		// Update multiple combatants
		await this.updateEmbeddedDocuments("Combatant", updates);

		return this;
	}

	async startCombat() {
		if (this.combatants.some((x) => !Number.isInteger(x.initiative))) {
			ui.notifications.warn("Combat cannot start until everyone has rolled thier initiative");
			return;
		}
		await this.setupTurns();
		await this.setFlag("metalsaviors", "actionHistory", []);
		return super.startCombat();
	}

	async _pushHistory(data) {
		const newActionHistory = this.getFlag("metalsaviors", "actionHistory").slice();
		newActionHistory.push(data);
		console.log("Action History Push", newActionHistory);
		return this.setFlag("metalsaviors", "actionHistory", newActionHistory);
	}

	async _popHistory() {
		const newActionHistory = this.getFlag("metalsaviors", "actionHistory").slice();
		const result = newActionHistory.pop();
		await this.setFlag("metalsaviors", "actionHistory", newActionHistory);
		console.log("Action History Pop", newActionHistory);
		return result;
	}

	async _peekHistory() {
		const newActionHistory = this.getFlag("metalsaviors", "actionHistory").slice();
		const result = newActionHistory.pop();
		console.log("Action History Peek", newActionHistory);
		return result;
	}

	async undoAction(actionData) {
		if (actionData.type !== "action") return;

		const combatantId = actionData.combatantId;
		const combatant = this.combatants.get(combatantId, { strict: true });

		await combatant.undoAction(actionData);

		return this;
	}

	async setInitiative(id, value) {
		const combatant = this.combatants.get(id, { strict: true });
		await combatant.update({ initiative: value });
	}

	async nextRound() {
		await this._pushHistory({
			type: "endRound",
			// Note: May need to have a note of all excess actions here
		});

		const endRoundObject = Object.fromEntries(this.combatants.map((x) => [x.id, null]));

		await this.setFlag("metalsaviors", "endRoundObject", endRoundObject);

		const playerCombatantsId = [];
		for (const user of game.users) {
			if (!user.active) continue;
			if (isExecutingGm(user)) continue;
			const actor = user.character;
			if (!actor) continue;
			const combatant = this.getCombatantByActor(actor.id);
			if (!combatant) continue;

			playerCombatantsId.push(combatant.id);

			game.socket.emit("system.metalsaviors", {
				location: "Combat",
				action: "playerEndRound",
				payload: {
					targetId: this.id,
					userId: user.id,
					combatantId: combatant.id,
				},
			});
		}

		const gmCombatants = this.combatants.filter((x) => !playerCombatantsId.includes(x.id));

		this._endNpcRounds(gmCombatants);
	}

	async _endNpcRounds(combatants) {
		const [closeCallback, spentActionDetailsTask] =
			MetalSaviorsCombatExcessActionsDialog.getExcessActionsDetails(combatants);
		this.closeCombatExcessActionsDialog = closeCallback;
		const spentActionDetails = await spentActionDetailsTask;
		for (const detail of spentActionDetails) {
			await this.spendExcessActions(detail);
		}
	}

	async _endPlayerRound(combatantId) {
		const combatant = this.combatants.get(combatantId, { strict: true });
		const [closeCallback, spentActionDetailsTask] = MetalSaviorsCombatExcessActionsDialog.getExcessActionsDetails([
			combatant,
		]);
		this.closeCombatExcessActionsDialog = closeCallback;
		const spentActionDetails = await spentActionDetailsTask;
		this.spendExcessActions(spentActionDetails[0]);
	}

	async spendExcessActions(details) {
		if (!isExecutingGm()) {
			game.socket.emit("system.metalsaviors", {
				location: "Combat",
				action: "spendExcessActions",
				payload: {
					targetId: this.id,
					details: details,
				},
			});
			return;
		}

		let endRoundObject = this.getFlag("metalsaviors", "endRoundObject");
		if (!endRoundObject) {
			return;
		}

		const combatant = this.combatants.get(details.combatantId, { strict: true });
		await combatant.performAction({
			actionName: "Spend Excess Actions",
			dInit: details.dInit,
			dExtraMomentum: details.dExtraMomentum,
			actionCost: details.actionCost,
		});

		await this.setFlag("metalsaviors", "endRoundObject", { [details.combatantId]: true });
		endRoundObject = this.getFlag("metalsaviors", "endRoundObject");
		if (Object.values(endRoundObject).every((x) => x)) {
			this.beginNewRound();
		}
	}

	async beginNewRound() {
		const asyncTasks = [];

		const endRoundSummary = Object.fromEntries(this.combatants.map((x) => [x.id, x.getRemainingActions()]));
		asyncTasks.push(
			this._pushHistory({
				type: "endRoundSummary",
				data: endRoundSummary,
			})
		);

		asyncTasks.push(this.unsetFlag("metalsaviors", "endRoundObject"));

		await Promise.all(asyncTasks);

		await this._pushHistory({
			type: "beginRound",
		});

		await Promise.all([...this.combatants].map((x) => x.resetForNewRound()));

		game.socket.emit("system.metalsaviors", {
			location: "CombatExcessActionsDialog",
			action: "newRound",
		});

		if (this.closeCombatExcessActionsDialog) {
			this.closeCombatExcessActionsDialog();
		}

		let advanceTime = CONFIG.time.roundTime;
		return this.update({ round: this.round + 1, turn: 0 }, { advanceTime });
	}

	async nextTurn() {
		if (!isExecutingGm()) {
			game.socket.emit("system.metalsaviors", {
				location: "Combat",
				action: "nextTurn",
				payload: {
					targetId: this.id,
				},
			});
			return this;
		}

		var endRoundObject = this.getFlag("metalsaviors", "endRoundObject");
		if (endRoundObject) {
			return this.beginNewRound();
		}

		await this.combatant.setFlag("metalsaviors", "turnDone", true);

		const skip = this.settings.skipDefeated;

		let next = null;
		for (const [index, combatant] of this.turns.entries()) {
			if (combatant.getFlag("metalsaviors", "turnDone")) continue;
			if (skip && combatant.isDefeated) continue;
			next = index;
			break;
		}

		await this._pushHistory({
			type: "endTurn",
			combatantId: this.combatant.id,
			turn: this.turn,
		});

		if (this.combatant.getExtraMovementMomentum() !== 0) {
			this.combatant.changeExtraMovementMomentum(-this.combatant.getExtraMovementMomentum());
			await this._pushHistory({
				type: "action",
				actionName: "Zero Extra Movement Momentum",
				combatantId: this.combatant.id,
				dExtraMomentum: -this.combatant.getExtraMovementMomentum(),
			});
		}

		if (this.round === 0 || next === null) {
			return this.nextRound();
		}

		const advanceTime = CONFIG.time.turnTime;
		return this.update({ turn: next }, { advanceTime });
	}

	async previousRound() {
		const round = Math.max(this.round - 1, 0);

		while (round > 0) {
			const prevAction = await this._popHistory();
			// If there are no previous actions, we are back at the beginning of combat
			if (!prevAction) break;
			if (prevAction.type === "endTurn") {
				await this.update({ turn: prevAction.turn }, { advanceTime: -CONFIG.time.turnTime });
			}
			if (prevAction.type === "endRound") {
				await this.update({ round: round });
				for (const combatant of this.combatants) {
					await combatant.setFlag("metalsaviors", "turnDone", true);
				}
				return this.previousTurn();
			}
			if (prevAction.type === "action") {
				await this.undoAction(prevAction);
			}
			if (prevAction.type === "endRoundSummary") {
				await this.undoEndRoundSummary(prevAction.data);
			}
		}

		return this.update({ round: round });
	}

	async previousTurn() {
		if (!isExecutingGm()) {
			game.socket.emit("system.metalsaviors", {
				location: "Combat",
				action: "previousTurn",
				payload: {
					targetId: this.id,
				},
			});
			return this;
		}

		while (true) {
			const prevAction = await this._peekHistory();
			if (!prevAction || prevAction.type === "endRound") {
				return this.previousRound();
			}
			if (prevAction.type === "beginRound") {
				await this._popHistory();
				return this;
			}
			if (prevAction.type === "endTurn") {
				await this._popHistory();
				const combatantId = prevAction.combatantId;
				const combatant = this.combatants.get(combatantId, { strict: true });
				combatant.setFlag("metalsaviors", "turnDone", false);
				return this.update({ turn: prevAction.turn }, { advanceTime: -CONFIG.time.turnTime });
			}
			if (prevAction.type === "action") {
				await Promise.all([this._popHistory(), this.undoAction(prevAction)]);
			}
			if (prevAction.type === "endRoundSummary") {
				await Promise.all([this._popHistory(), this.undoEndRoundSummary(prevAction.data)]);
			}
		}
	}

	async undoEndRoundSummary(data) {
		const asyncTasks = [];
		for (const [combatantId, prevRemainingActions] of Object.entries(data)) {
			const combatant = this.combatants.get(combatantId, { strict: true });
			asyncTasks.push(combatant.setRemainingActions(prevRemainingActions));
		}

		await Promise.all(asyncTasks);
	}
}

function _checkNumeric(value) {
	return Number.isNumeric(value) ? value : -9999;
}
