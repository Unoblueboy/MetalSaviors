import { rollInitiative } from "../../helpers/roll.mjs";
import { CombatSpeedHelper } from "../../helpers/CombatSpeedHelper.mjs";
import { MetalSaviorsCombatantRollDialog } from "./Dialogs/CombatantRollDialog.mjs";
import { ActionType } from "../../types/Combat/Enums.js";

export class MetalSaviorsCombatant extends Combatant {
	CombatSpeeds = {
		0: game.i18n.localize(CONFIG.METALSAVIORS.combatSpeeds["halt"]),
		1: game.i18n.localize(CONFIG.METALSAVIORS.combatSpeeds["walk"]),
		2: game.i18n.localize(CONFIG.METALSAVIORS.combatSpeeds["pace"]),
		3: game.i18n.localize(CONFIG.METALSAVIORS.combatSpeeds["gallop"]),
		4: game.i18n.localize(CONFIG.METALSAVIORS.combatSpeeds["sprint"]),
	};

	_preCreate(data, options, user) {
		super._preCreate(data, options, user);

		this.updateSource({
			flags: {
				metalsaviors: {
					remainingActions: this.actor.getActionsPerRound(),
					turnDone: false,
					curMovementSpeed: 0,
					cumExcessInitIncrease: 0,
					extraMovementMomentum: 0,
				},
			},
		});
	}

	get isMechanical() {
		return ["cav", "vehicle", "pike"].includes(this.actor.type);
	}

	getMaxSpeed() {
		switch (this.actor?.type) {
			case "cav":
			case "vehicle":
				return CombatSpeedHelper.getMovementSpeedIntFromKey("sprint");
			case "pike":
				return CombatSpeedHelper.getMovementSpeedIntFromKey("pace");
			default:
				return -1;
		}
	}

	getCombatSpeedOptions() {
		const entries = Object.entries(this.CombatSpeeds).filter(([index]) => index <= this.getMaxSpeed());
		return Object.fromEntries(entries);
	}

	getCurMovementSpeedKey() {
		const curMovementSpeed = this.getCurMovementSpeed();
		return CombatSpeedHelper.getMovementSpeedKey(curMovementSpeed);
	}

	async changeMovementSpeed(dSpeed) {
		const curSpeed = this.getFlag("metalsaviors", "curMovementSpeed");
		const newSpeed = Math.clamped(curSpeed + dSpeed, 0, this.getMaxSpeed());
		return await this.setMovementSpeed(newSpeed);
	}

	async setMovementSpeed(newMovementSpeed) {
		const newSpeed = Math.clamped(newMovementSpeed, 0, this.getMaxSpeed());
		await this.setFlag("metalsaviors", "curMovementSpeed", newSpeed);
		this.updateActor();
		return newSpeed;
	}

	hasDerivedInitiativeBonuses() {
		if (!this.actor) {
			return false;
		}

		if (!["character", "cav"].includes(this.actor.type)) {
			return false;
		}

		if (
			this.actor.type == "character" &&
			!["character", "majorCharacter"].includes(this.actor.getCharacterType())
		) {
			return false;
		}

		if (this.actor.type == "cav" && !this.actor.hasPilot) {
			return false;
		}

		return true;
	}

	updateActor() {
		if (this.actor) {
			this.actor.render(false);
		}
	}

	getCurMovementSpeed() {
		return this.getFlag("metalsaviors", "curMovementSpeed");
	}

	getRemainingActions() {
		return this.getFlag("metalsaviors", "remainingActions");
	}

	getCumExcessInitIncrease() {
		return this.getFlag("metalsaviors", "cumExcessInitIncrease");
	}

	async changeCumExcessInitIncrease(dInit) {
		const curCumInitIncrease = this.getCumExcessInitIncrease();
		return await this.setFlag("metalsaviors", "cumExcessInitIncrease", curCumInitIncrease + dInit);
	}

	getExtraMovementMomentum() {
		return this.getFlag("metalsaviors", "extraMovementMomentum");
	}

	async changeExtraMovementMomentum(dExtraMomentum) {
		const baseExtraMovementMomentum = this.getExtraMovementMomentum();
		const newExtraMomentum = baseExtraMovementMomentum + dExtraMomentum;
		await this.setFlag("metalsaviors", "extraMovementMomentum", newExtraMomentum);
		this.updateActor();
		return newExtraMomentum;
	}

	getMaxInitIncrease() {
		try {
			// Use Finesse Stat for player/ major characters
			switch (this.actor.type) {
				case "character":
					if (this.actor.getCharacterType() !== "minorCharacter") {
						return this.actor.system.attributes.fin.value;
					} else {
						return Math.min(this.actor.itemTypes.concept.map((x) => parseInt(x.system.value)));
					}
				case "cav":
					if (!this.actor.hasPilot) return Infinity;
					return this.actor.pilot.system.attributes.fin.value;
				default:
					return Infinity;
			}

			// TODO: Figure out what to do for non characters and minor characters
		} catch {
			return 0;
		}
	}

	async setRemainingActions(remActions) {
		const result = await this.setFlag("metalsaviors", "remainingActions", remActions);
		this.updateActor();
		return result;
	}

	async resetForNewRound() {
		await Promise.all([
			this.setFlag("metalsaviors", "remainingActions", this.actor.getActionsPerRound()),
			this.setFlag("metalsaviors", "turnDone", false),
		]);
	}

	async performAction(combatAction) {
		var actionType = combatAction.type;
		var actionCost = combatAction.actionCost;
		var dInit = combatAction.dInit;
		var dSpeed = combatAction.dSpeed;
		var dExtraMomentum = combatAction.dExtraMomentum;

		if (this.getRemainingActions() < actionCost) {
			ui.notifications.warn(
				`Combatant [${this.name}] does not have the remaining combat actions ` +
					`this round to perform the "${actionType}" action`
			);
			return;
		}

		const asyncTasks = [];

		if (dInit !== 0) {
			const curInitiative = this.initiative;
			asyncTasks.push(this.update({ initiative: curInitiative + dInit }));
		}

		if (actionCost !== 0) {
			const curRemainingActions = this.getFlag("metalsaviors", "remainingActions");
			asyncTasks.push(this.setFlag("metalsaviors", "remainingActions", curRemainingActions - actionCost));
		}

		if (dSpeed !== 0) {
			asyncTasks.push(this.changeMovementSpeed(dSpeed));
		}

		if (dExtraMomentum !== 0) {
			asyncTasks.push(this.changeExtraMovementMomentum(dExtraMomentum));
		}

		if (actionType === ActionType.SpendExcessActions) {
			await this.changeCumExcessInitIncrease(dInit);
		}

		const data = {
			type: "action",
			combatantId: this.id,
			actionName: actionType.value,
			actionCost,
			dInit,
			dSpeed,
			dExtraMomentum,
		};
		if (game.user.isGM) {
			this.combat._pushHistory(data);
		} else {
			globalThis.socket.executeAsGM("Combat.pushHistory", this.combat.id, data);
		}

		await Promise.all(asyncTasks);
		this.updateActor();
	}

	async undoAction({ actionName = "", actionCost = 0, dInit = 0, dSpeed = 0, dExtraMomentum = 0 } = {}) {
		const asyncTasks = [];

		if (dInit !== 0) {
			const curInitiative = this.initiative;
			asyncTasks.push(this.update({ initiative: curInitiative - dInit }));
		}

		if (actionName === "Spend Excess Actions") {
			this.changeCumExcessInitIncrease(-dInit);
		}

		if (actionCost !== 0) {
			const curRemainingActions = this.getFlag("metalsaviors", "remainingActions");
			asyncTasks.push(this.setFlag("metalsaviors", "remainingActions", curRemainingActions + actionCost));
		}

		if (dExtraMomentum !== 0) {
			asyncTasks.push(this.changeExtraMovementMomentum(-dExtraMomentum));
		}

		if (dSpeed !== 0) {
			asyncTasks.push(this.changeMovementSpeed(-dSpeed));
		}

		await Promise.all(asyncTasks);
		this.updateActor();
	}

	async rollInitiative() {
		const initiativeOptions = await MetalSaviorsCombatantRollDialog.getInitiativeOptions(this);

		if (initiativeOptions.cancelled) {
			return;
		}

		const messageData = {
			speaker: ChatMessage.getSpeaker({
				actor: this.actor,
				token: this.token,
				alias: this.name,
			}),
			flavor: game.i18n.format("COMBAT.RollsInitiative", { name: this.name }),
			flags: { "core.initiativeRoll": true },
		};

		const roll = await rollInitiative(this, {
			...initiativeOptions,
			messageData,
		});

		this.update({ initiative: roll.total });
		if (initiativeOptions.combatSpeed !== undefined) {
			await this.setMovementSpeed(initiativeOptions.combatSpeed);
		}
		this.updateActor();
	}
}
