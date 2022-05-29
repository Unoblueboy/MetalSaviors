import { isExecutingGm } from "../helpers/SocketsHelper.mjs";

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
		socket.on("system.metalsaviors", this._socketEventHandler.bind(this));
	}

	_socketEventHandler({ location = "", action = "", payload = {} }) {
		console.log("Spcket Event Handler", location, action, payload);

		if (location !== "Combat") return;
		if (payload.targetId !== this.id) return;
		if (!isExecutingGm()) return;

		console.log("Handling Socket Event");

		switch (action) {
			case "pushHistory":
				this._pushHistory(payload.data);
				break;
			case "nextTurn":
				this.nextTurn();
				break;
			case "previousTurn":
				this.previousTurn();
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
		let advanceTime = CONFIG.time.roundTime;
		const asyncTasks = [];
		for (const combatant of this.turns) {
			asyncTasks.push(combatant.setFlag("metalsaviors", "turnDone", false));
		}
		await Promise.all(asyncTasks);
		await this._pushHistory({
			type: "endRound",
			// Note: May need to have a note of all excess actions here
		});
		return this.update({ round: this.round + 1, turn: 0 }, { advanceTime });
	}

	async nextTurn() {
		if (!isExecutingGm()) {
			console.log("Emitting Signal");
			game.socket.emit("system.metalsaviors", {
				location: "Combat",
				action: "nextTurn",
				payload: {
					targetId: this.id,
				},
			});
			return this;
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
				return this.previousTurn();
			}
			if (prevAction.type === "action") {
				await this.undoAction(prevAction);
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
		}
	}
}

function _checkNumeric(value) {
	return Number.isNumeric(value) ? value : -9999;
}
