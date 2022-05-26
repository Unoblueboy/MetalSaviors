import { CalculateSkillValue } from "../helpers/Calculators.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MetalSaviorsSkill extends Item {
	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData() {
		// As with the actor class, items are documents that can have their data
		// preparation methods overridden (such as prepareBaseData()).
		super.prepareData();
	}

	prepareDerivedData() {
		this.prepareDerivedLearnedSkillData();
	}

	prepareDerivedLearnedSkillData() {
		if (this.type !== "learnedSkill") return;

		const actor = this.actor ?? {};
		const { value, cavValue } = CalculateSkillValue(this, actor);
		this.data.data.value = value;
		this.data.data.cavValue = cavValue;
	}

	/**
	 * Prepare a data object which is passed to any Roll formulas which are created related to this Item
	 * @private
	 */
	getRollData() {
		// If present, return the actor's roll data.
		if (!this.actor) return null;
		const rollData = this.actor.getRollData();
		rollData.item = foundry.utils.deepClone(this.data.data);

		return rollData;
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async roll(dataset) {
		const cavId = dataset?.cavId;
		if (this.type === "learnedSkill") {
			if (this.type !== "learnedSkill") return;

			if (!this.actor) return;

			const rollData = this.getRollData();

			const cavValue = this.data.data.cavValue[cavId];

			let rollString = `1d100cs<=${this.data.data.value}`;

			if (cavValue) {
				rollString = `1d100cs<=${cavValue}`;
			}

			// Invoke the roll and submit it to chat.
			const roll = new Roll(rollString, rollData);
			// If you need to store the value first, uncomment the next line.
			// let result = await roll.roll({async: true});
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				rollMode: game.settings.get("core", "rollMode"),
				flavor: `[Skill] ${this.name}`,
			});
			return roll;
		}
	}
}
