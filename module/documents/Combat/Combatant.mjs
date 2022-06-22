import { rollInitiative } from "../../helpers/roll.mjs";
import { MetalSaviorsCombatantRollDialog } from "./Dialogs/CombatantRollDialog.mjs";

export class MetalSaviorsCombatant extends Combatant {
	_onCreate(data, options, userID) {
		super._onCreate(data, options, userID);
		if (this.isOwner) {
			this.setFlag("metalsaviors", "remainingActions", this.actor.getActionsPerRound());
			this.setFlag("metalsaviors", "turnDone", false);
			this.setFlag("metalsaviors", "curMovementSpeed", 0);
			this.setFlag("metalsaviors", "cumExcessInitIncrease", 0);
			this.setFlag("metalsaviors", "extraMovementMomentum", 0);
		}
	}

	static getMovementSpeedString(movementSpeed) {
		switch (movementSpeed) {
			case 0:
				return "Halt";
			case 1:
				return "Walking";
			case 2:
				return "Pacing";
			case 3:
				return "Galloping";
			case 4:
				return "Sprinting";
			default:
				return null;
		}
	}

	static getMovementSpeedKey(movementSpeed) {
		switch (movementSpeed) {
			case 0:
				return "halt";
			case 1:
				return "walk";
			case 2:
				return "pace";
			case 3:
				return "gallop";
			case 4:
				return "sprint";
			default:
				return null;
		}
	}

	getCurMovementSpeedKey() {
		const curMovementSpeed = this.getCurMovementSpeed();
		return MetalSaviorsCombatant.getMovementSpeedKey(curMovementSpeed);
	}

	async changeMovementSpeed(dSpeed) {
		const curSpeed = this.getFlag("metalsaviors", "curMovementSpeed");
		const newSpeed = Math.clamped(curSpeed + dSpeed, 0, 4);
		return await this.setMovementSpeed(newSpeed);
	}

	async setMovementSpeed(newMovementSpeed) {
		const newSpeed = Math.clamped(newMovementSpeed, 0, 4);
		await this.setFlag("metalsaviors", "curMovementSpeed", newSpeed);
		this.updateActor();
		return newSpeed;
	}

	updateActor() {
		if (this.actor && this.actor?.sheet?.rendered) {
			this.actor.render();
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

	getFinesse() {
		try {
			return this.actor.data.data.attributes.fin.value;
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

	async performAction({ actionName = "", actionCost = 0, dInit = 0, dSpeed = 0, dExtraMomentum = 0 } = {}) {
		if (this.getFlag("metalsaviors", "remainingActions") < actionCost) {
			ui.notifications.warn(
				`Combatant [${this.name}] does not have the remaining combat actions ` +
					`this round to perform the "${actionName}" action`
			);
			return;
		}

		const asyncTasks = [];

		if (dInit !== 0) {
			const curInitiative = this.data.initiative;
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

		if (actionName === "Spend Excess Actions") {
			await this.changeCumExcessInitIncrease(dInit);
		}

		const data = {
			type: "action",
			combatantId: this.id,
			actionName,
			actionCost,
			dInit,
			dSpeed,
			dExtraMomentum,
		};
		if (game.user.isGM) {
			this.combat._pushHistory(data);
		} else {
			game.socket.emit("system.metalsaviors", {
				class: "Combat",
				action: "pushHistory",
				payload: {
					targetId: this.combat.id,
					data: data,
				},
			});
		}

		await Promise.all(asyncTasks);
		this.updateActor();
	}

	async undoAction({ actionName = "", actionCost = 0, dInit = 0, dSpeed = 0, dExtraMomentum = 0 } = {}) {
		const asyncTasks = [];

		if (dInit !== 0) {
			const curInitiative = this.data.initiative;
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
		};

		const roll = await rollInitiative(this, {
			...initiativeOptions,
			createMessage: true,
			messageData,
		});

		this.update({ initiative: roll.total });
		if (initiativeOptions.combatSpeed !== undefined) {
			await this.setMovementSpeed(initiativeOptions.combatSpeed);
		}
		this.updateActor();
	}
}
