import MetalSaviorsCombatant from "./Combatant.mjs";
import { MetalSaviorsCombatDetailsDialog } from "./CombatDetailsDialog.mjs";

export class MetalSaviorsCombatTracker extends CombatTracker {
	get template() {
		return "systems/metalsaviors/templates/combat/combat-tracker.hbs";
	}

	async _onCombatantControl(event) {
		event.preventDefault();
		event.stopPropagation();
		const btn = event.currentTarget;
		const li = btn.closest(".combatant");
		const combat = this.viewed;
		const c = combat.combatants.get(li.dataset.combatantId);

		// Switch control action
		switch (btn.dataset.control) {
			// Toggle combatant visibility
			case "toggleHidden":
				return c.update({ hidden: !c.hidden });

			// Toggle combatant defeated flag
			case "toggleDefeated":
				return this._onToggleDefeatedStatus(c);

			// Roll combatant initiative
			case "rollInitiative":
				return combat.rollInitiative([c.id]);

			// Perform an action
			case "performAction":
				return this._onPerformAction(c);
		}
	}

	async _onPerformAction(combatant) {
		if (!combatant.combat) return;
		if (!combatant.combat.started) {
			ui.notifications.warn("Cannot perform an action until combat has started.");
			return;
		}
		const details = await MetalSaviorsCombatDetailsDialog.getActionDetails(combatant);
		await combatant.performAction(details);
	}

	async getData(options) {
		const context = await super.getData(options);
		const combat = this.viewed;
		let roundDone = true;

		for (const turn of context.turns) {
			const combatantId = turn.id;
			const combatant = combat.combatants.get(combatantId, { strict: true });
			turn.remainingActions = combatant.getFlag("metalsaviors", "remainingActions");
			turn.turnDone = combatant.getFlag("metalsaviors", "turnDone");
			if (!turn.turnDone) {
				roundDone = false;
			}
			turn.curMovementSpeed = MetalSaviorsCombatant.getMovementSpeedString(
				combatant.getFlag("metalsaviors", "curMovementSpeed")
			);
			turn.isOwner = combatant.isOwner;
		}
		context.roundDone = roundDone;

		return context;
	}
}
