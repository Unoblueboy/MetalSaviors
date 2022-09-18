import { rollAttributeOrSkill, rollSkill } from "../../helpers/roll.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MetalSaviorsConcept extends Item {
	/**
	 * Prepare a data object which is passed to any Roll formulas which are created related to this Item
	 * @private
	 */
	getRollData() {
		// If present, return the actor's roll data.
		if (!this.actor) return null;
		const rollData = this.actor.getRollData();
		rollData.item = foundry.utils.deepClone(this.system);

		return rollData;
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async roll(event) {
		const value = this.system.value;

		const skillValue = 10 * value;
		const attributeValue = value;

		const getOptions = event.shiftKey;
		const rollAsSkill = event.ctrlKey;

		rollAttributeOrSkill(this.actor, {
			name: this.name,
			skillValue,
			attributeValue,
			getOptions,
			rollAsSkill,
		});
	}
}
