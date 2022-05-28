export default class MetalSaviorsCombatant extends Combatant {
	_onCreate(data, options, userID) {
		super._onCreate(data, options, userID);
		this.setFlag("metalsaviors", "remainingActions", this.actor.getActionsPerRound());
		this.setFlag("metalsaviors", "turnDone", false);
		this.setFlag("metalsaviors", "curMovementSpeed", 0);
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

	async changeMovementSpeed(dSpeed) {
		const curSpeed = this.getFlag("metalsaviors", "curMovementSpeed");
		const newSpeed = Math.clamped(curSpeed + dSpeed, 0, 4);
		this.setFlag("metalsaviors", "curMovementSpeed", newSpeed);
		return newSpeed;
	}

	getCurMovementSpeed() {
		return this.getFlag("metalsaviors", "curMovementSpeed");
	}

	async performAction({ actionName = "", actionCost = 0, dInit = 0, dSpeed = 0 } = {}) {
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

		asyncTasks.push(
			this.combat._pushHistory({
				type: "action",
				combatantId: this.id,
				actionName,
				actionCost,
				dInit,
				dSpeed,
			})
		);

		await Promise.all(asyncTasks);
	}

	async undoAction({ actionCost = 0, dInit = 0, dSpeed = 0 } = {}) {
		const asyncTasks = [];

		if (dInit !== 0) {
			const curInitiative = this.data.initiative;
			asyncTasks.push(this.update({ initiative: curInitiative - dInit }));
		}

		if (actionCost !== 0) {
			const curRemainingActions = this.getFlag("metalsaviors", "remainingActions");
			asyncTasks.push(this.setFlag("metalsaviors", "remainingActions", curRemainingActions + actionCost));
		}

		if (dSpeed !== 0) {
			asyncTasks.push(this.changeMovementSpeed(-dSpeed));
		}

		await Promise.all(asyncTasks);
	}
}
