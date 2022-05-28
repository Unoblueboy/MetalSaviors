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
		if (!combatant.combat.started) return;
		const details = await GetActionDetails();
		console.log(details);
		await combatant.combat.performAction(combatant.id, details);
	}
}

async function GetActionDetails() {
	return new Promise((resolve) => {
		new MetalSaviorsCombatDetailsDialog(
			{
				normalCallback: (html) => resolve(_processActionDetails(html[0].querySelector("form"))),
				cancelCallback: (html) => resolve({ cancelled: true }),
			},
			null
		).render(true);
	});
}

function _processActionDetails(form) {
	return {
		actionName: form.actionName.value,
		newInitiative: Number.isNumeric(form.newInitiative.value) ? parseInt(form.newInitiative.value) : null,
		newRemainingActions: Number.isNumeric(form.newRemainingActions.value)
			? parseInt(form.newRemainingActions.value)
			: null,
	};
}
