import { CalculateSkillValue } from "./Calculators.mjs";

export class SkillHelper {
	/**
	 * @param {MetalSaviorsItem} [item] an item representing a skill
	 */
	static prepareDerivedLearnedSkillData(item) {
		if (item.type !== "learnedSkill") return;

		const skill = item;
		const actor = item.actor ?? {};
		item.data.data.value = CalculateSkillValue(skill, actor);
	}

	/**
	 * @param {MetalSaviorsItem} [item] an item representing a skill
	 */
	static async roll(item) {
		if (item.type !== "learnedSkill") return;

		if (!item.actor) return;

		const rollData = item.getRollData();

		// Invoke the roll and submit it to chat.
		const roll = new Roll(`1d100cs<=${item.data.data.value}`, rollData);
		// If you need to store the value first, uncomment the next line.
		// let result = await roll.roll({async: true});
		roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			rollMode: game.settings.get("core", "rollMode"),
			flavor: `[Skill] ${item.name}`,
		});
	}
}
