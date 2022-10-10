import { rollSkill } from "../../helpers/roll.mjs";
import { CalculateSkillValue } from "../helpers/Calculators.mjs";
import { MetalSaviorsSkillRollDialog } from "./Dialogs/skillRollDialog.mjs";
import { MetalSaviorsAbstractItem } from "./abstractItem.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MetalSaviorsSkill extends MetalSaviorsAbstractItem {
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
		const value = CalculateSkillValue(this, actor);
		this.system.value = value;
	}

	_preCreate(data, options, userId) {
		super._preCreate(data, options, userId);
		if (this.type !== "learnedSkill") return;
		if (!this.actor) return null;

		this.updateSource({ "system.lvlAcquired": this.actor.system.level.value });
	}

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
		const element = event.currentTarget;
		const dataset = element.dataset;
		const cavId = dataset?.cavId;
		const showOptions = event.shiftKey;

		if (this.type !== "learnedSkill") return;

		if (!this.actor) return;

		const cav = game.actors.get(cavId);
		const roller = cav ? cav : this.actor;

		let value = this._getRolledSkillValue(roller);

		let data = {
			name: this.name,
			value: value,
		};
		if (showOptions) {
			data = await MetalSaviorsSkillRollDialog.getSkillOptions({
				name: this.name,
				value: value,
			});

			if (data.cancelled) {
				return;
			}
		}

		await rollSkill(roller, data);
	}

	_getRolledSkillValue(roller) {
		if (roller.type === "cav") {
			return roller.system.learnedSkills[this.id].value;
		}

		return this.system.value;
	}
}
