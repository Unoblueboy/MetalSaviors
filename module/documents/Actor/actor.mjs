import { attributeCalculator, derivedAttributeCalculator } from "../helpers/Calculators.mjs";

import { generateSkillKey } from "../../helpers/KeyGenerator.mjs";

import { METALSAVIORS } from "../../helpers/config.mjs";
import { rollAttributeCheck, rollAttributeOrSkill, rollSkill } from "../../helpers/roll.mjs";
import { MetalSaviorsAttributeRollDialog } from "./Dialogs/attributeOrSkillDialog.mjs";

export const CharacterType = {
	character: "Player Character",
	minorCharacter: "Minor Character",
	majorCharacter: "Major Character",
};

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MetalSaviorsActor extends Actor {
	static EnforceItemUniqueness(actor, sheet, data) {
		if (data.type !== "Item") return;

		const item = game.items.get(data.id);

		if (!item) return;

		if (!["learnedSkill", "weaponProficiency", "pilotLicense"].includes(item.type)) return;

		const sameNameTypeItems = actor.items.filter((x) => x.name === item.name && x.type === item.type);

		// When a new item is added
		if (sameNameTypeItems.length === 0) {
			item.data.update({ "data.lvlAcquired": actor.data.data.level.value });
			return;
		}

		if (sameNameTypeItems.length > 1) {
			console.log(
				`Expected there to be at most 1 ${item.type} with same name but ${sameNameTypeItems.length} found`
			);
		}

		const origItem = sameNameTypeItems[0];
		const origItemData = origItem.data;
		switch (item.type) {
			case "learnedSkill":
				const newNumAcquisitions = origItemData.data.numAcquisitions + 1;
				ui.notifications.info(
					`The skill ${origItem.name} has been updated, it now has ${newNumAcquisitions} acquisition`
				);
				origItem.update({
					"data.numAcquisitions": newNumAcquisitions,
				});
				break;
			case "weaponProficiency":
				ui.notifications.info(`The actor ${this.name} already has the Weapon Proficiency ${origItem.name}`);
				break;
			case "pilotLicense":
				ui.notifications.info(`The actor ${this.name} already has the Pilot License ${origItem.name}`);
				break;
			default:
				break;
		}

		return false;
	}

	static EnforceStrictItemUniqueness(actor, sheet, data) {
		if (data.type !== "Item") return;

		const item = game.items.get(data.id);

		if (!item) return;

		if (!["combatTraining"].includes(item.type)) return;

		const sameTypeItems = actor.items.filter((x) => x.type === item.type);

		if (sameTypeItems.length === 0) {
			ui.notifications.info(
				`The actor ${this.name} has added Combat Training,` +
					` changing the Actions Per Round to ${item.data.data.actionsPerRound}`
			);
			return;
		}

		if (sameTypeItems.length > 1) {
			console.log(`Expected there to be at most 1 ${item.type} with same name but ${sameTypeItems.length} found`);
		}

		const origItem = sameTypeItems[0];
		ui.notifications.info(
			`The actor ${this.name} has updated their Combat Training,` +
				` changing the Actions Per Round to ${item.data.data.actionsPerRound}`
		);
		origItem.update({
			name: item.name,
			"data.actionsPerRound": item.data.data.actionsPerRound,
			"data.description": item.data.data.description,
		});

		return false;
	}

	_initialize() {
		super._initialize();

		if (!this.isOwner) return;
		if (this.type !== "character") return;
		if (this.getFlag("metalsaviors", "characterType")) return;

		this.setCharacterType("character");
	}

	async setCharacterType(charType) {
		await this.setFlag("metalsaviors", "characterType", charType);
	}

	/** @override */
	prepareData() {
		super.prepareData();
	}

	/**
	 * @override
	 */
	prepareDerivedData() {
		if (this.type === "blank") {
			return;
		}
		const actorData = this.data;
		const data = actorData.data;
		const flags = actorData.flags.metalsaviors || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._prepareCharacterData(actorData);
		this._prepareInfantryData(actorData);
		// this._prepareNpcData(actorData);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		if (actorData.type !== "character") return;

		const data = actorData.data;

		attributeCalculator(actorData, data);
		derivedAttributeCalculator(actorData, data);
		data.nsr.value = (data.nsr.baseValue || 0) + (data.nsr.otherBonuses || 0);

		// Learned skills values need to be recalculated to take into account the derived attribute
		this._calculateLearnedSkillsValue();
	}

	_calculateLearnedSkillsValue() {
		for (const item of this.items.filter((x) => x.type === "learnedSkill")) {
			item.prepareDerivedLearnedSkillData();
		}
	}

	/**
	 * Prepare NPC type specific data.
	 */
	_prepareInfantryData(actorData) {
		if (actorData.type !== "infantry") return;

		// Make modifications to data here. For example:
		const data = actorData.data;
		data.squadMembers = Math.ceil(data.health.value / data.healthPerSquadMember);
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		// Deep Copy data so it doesn't get imported into the character
		const data = foundry.utils.deepClone(super.getRollData());

		// Prepare character roll data.
		this._getCharacterRollData(data);
		this._getNpcRollData(data);

		return data;
	}

	/**
	 * Prepare character roll data.
	 */
	_getCharacterRollData(data) {
		if (this.data.type !== "character") return;

		if (data.derivedSkills) {
			delete data.skills;
			data.skills = {};
			for (let [k, v] of Object.entries(data.derivedSkills)) {
				let newKey = generateSkillKey(k); // .replace(" ", "_")
				data.skills[newKey] = foundry.utils.deepClone(v);
			}
		}

		// Add level for easier access, or fall back to 0.
		if (data.attributes.level) {
			data.lvl = data.attributes.level.value ?? 0;
		}
	}

	/**
	 * Prepare NPC roll data.
	 */
	_getNpcRollData(data) {
		if (this.data.type !== "npc") return;

		// Process additional NPC data here.
	}

	getActionsPerRound() {
		const combatTraining = this.items.filter((x) => x.type === "combatTraining");
		if (combatTraining.length === 0) {
			return METALSAVIORS.combat.defaultActionsPerRound;
		}
		return combatTraining[0].data.data.actionsPerRound || METALSAVIORS.combat.defaultActionsPerRound;
	}

	getInitiativeRoll({ inCav = false } = {}) {
		switch (this.type) {
			case "character":
				if (!inCav) {
					return "d20 + @derivedAttributes.initiativeModifier.value";
				}
				return "d20 + @derivedAttributes.cavInitiativeModifier.value";
			default:
				return "d20";
		}
	}

	getCavs() {
		return this.itemTypes.cav;
	}

	async rollAttribute(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;

		const key = dataset.key;
		const label = game.i18n.localize(CONFIG.METALSAVIORS.attributes[key]);
		const cavId = dataset?.cavId;
		const value = cavId ? this.data.data.cavAttributes[cavId][key].origValue : this.data.data.attributes[key].value;
		const cavBane = cavId && this.data.data.cavAttributes[cavId][key].bane;

		let skillValue = cavBane ? value - 15 : value;
		let attributeValue = cavBane ? value - 2 : value;

		const getOptions = event.shiftKey;
		let rollAsSkill = event.ctrlKey;

		rollAttributeOrSkill(this, {
			name: label,
			skillValue,
			attributeValue,
			getOptions,
			rollAsSkill,
		});
	}
}
