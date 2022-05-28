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

	async performAction(combatantId, data = { actionName: "", newInitiative: null, newRemainingActions: null }) {
		if (data.newInitiative === null && data.newRemainingActions == null) return;
		const combatant = this.combatants.get(combatantId, { strict: true });
		const oldInitiative = combatant.data.initiative;
		const oldRemainingActions = combatant.getFlag("metalsaviors", "remainingActions");
		const newInitiative = data.newInitiative ?? oldInitiative;
		const newRemainingActions = data.newRemainingActions ?? oldRemainingActions;

		if (data.newInitiative !== null) {
			combatant.update({ initiative: newInitiative });
		}

		if (data.newRemainingActions !== null) {
			combatant.setFlag("metalsaviors", "remainingActions", newRemainingActions);
		}

		return this._pushHistory({
			type: "action",
			actionName: data.actionName,
			combatantId,
			oldInitiative,
			newInitiative,
			oldRemainingActions,
			newRemainingActions,
		});
	}

	async undoAction(actionData) {
		if (actionData.type !== "action") return;

		const combatantId = actionData.combatantId;
		const oldInitiative = actionData.oldInitiative;
		const newInitiative = actionData.newInitiative;
		const oldRemainingActions = actionData.oldRemainingActions;
		const newRemainingActions = actionData.newRemainingActions;

		const combatant = this.combatants.get(combatantId, { strict: true });
		if (!combatant) return;

		if (oldInitiative !== newInitiative) {
			await combatant.update({ initiative: oldInitiative });
		}

		if (oldRemainingActions !== newRemainingActions) {
			await combatant.setFlag("metalsaviors", "remainingActions", oldRemainingActions);
		}

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
			console.log(combatant);
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
		while (true) {
			const prevAction = await this._peekHistory();
			if (!prevAction || prevAction.type === "endRound") {
				return this.previousRound();
			}
			if (prevAction.type === "endTurn") {
				await this._popHistory();
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
