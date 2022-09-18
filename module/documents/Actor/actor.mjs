import { attributeCalculator, derivedAttributeCalculator } from "../helpers/Calculators.mjs";

import { generateSkillKey } from "../../helpers/KeyGenerator.mjs";

import { METALSAVIORS } from "../../helpers/config.mjs";
import { rollAttributeOrSkill } from "../../helpers/roll.mjs";

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

		const item = game.items.filter((x) => x.uuid == data.uuid)[0];

		if (!item) return;

		if (!["learnedSkill", "weaponProficiency", "pilotLicense"].includes(item.type)) return;

		const sameNameTypeItems = actor.items.filter((x) => x.name === item.name && x.type === item.type);

		// When a new item is added
		if (sameNameTypeItems.length === 0) {
			return;
		}

		if (sameNameTypeItems.length > 1) {
			console.log(
				`Expected there to be at most 1 ${item.type} with same name but ${sameNameTypeItems.length} found`
			);
			return false;
		}

		const origItem = sameNameTypeItems[0];
		const origItemData = origItem.system;
		switch (item.type) {
			case "learnedSkill":
				const newNumAcquisitions = origItemData.numAcquisitions + 1;
				ui.notifications.info(
					`The skill ${origItem.name} has been updated, it now has ${newNumAcquisitions} acquisition`
				);
				origItem.update({
					"system.numAcquisitions": newNumAcquisitions,
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

		const item = game.items.filter((x) => x.uuid == data.uuid)[0];

		if (!item) return;

		if (!["combatTraining"].includes(item.type)) return;

		const sameTypeItems = actor.items.filter((x) => x.type === item.type);

		if (sameTypeItems.length === 0) {
			ui.notifications.info(
				`The actor ${this.name} has added Combat Training,` +
					` changing the Actions Per Round to ${item.system.actionsPerRound}`
			);
			return;
		}

		if (sameTypeItems.length > 1) {
			console.log(`Expected there to be at most 1 ${item.type} with same name but ${sameTypeItems.length} found`);
		}

		const origItem = sameTypeItems[0];
		ui.notifications.info(
			`The actor ${this.name} has updated their Combat Training,` +
				` changing the Actions Per Round to ${item.system.actionsPerRound}`
		);
		origItem.update({
			name: item.name,
			"data.actionsPerRound": item.system.actionsPerRound,
			"data.description": item.system.description,
		});

		return false;
	}

	_initialize() {
		super._initialize();

		if (!this.isOwner) return;
		if (this.type !== "character") return;
		if (this.getCharacterType()) return;

		this.setCharacterType("character");
		this.setCurWeapon(null);
	}

	async setCharacterType(charType) {
		await this.setFlag("metalsaviors", "characterType", charType);
	}

	getCharacterType() {
		return this.getFlag("metalsaviors", "characterType");
	}

	async setCurWeapon(curWeapon) {
		await this.setFlag("metalsaviors", "curWeapon", curWeapon ? curWeapon.id : "");

		const tokens = this.getActiveTokens(true, false);

		tokens.forEach((x) => x.refresh());
	}

	getCurWeapon() {
		const weaponId = this.getFlag("metalsaviors", "curWeapon");
		return this.items.get(weaponId);
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
		const actorSystem = this.system;
		const actorItems = this.items;
		const flags = this.flags.metalsaviors || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._prepareCharacterData(actorSystem, actorItems);
		this._prepareInfantryData(actorSystem);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorSystem, actorItems) {
		if (this.type !== "character") return;

		attributeCalculator(actorSystem, actorItems);
		if (this.getCharacterType() !== "minorCharacter") {
			derivedAttributeCalculator(actorSystem);
		} else {
			for (const [name, dAttribute] of Object.entries(actorSystem.derivedAttributes)) {
				if (name == "damageModifier") {
					dAttribute.baseValue = "0";
					dAttribute.value = "0";
					dAttribute.otherBonuses = null;
					continue;
				}
				dAttribute.baseValue = 0;
				dAttribute.value = 0;
				dAttribute.otherBonuses = 0;
			}
		}

		actorSystem.nsr.value = (actorSystem.nsr.baseValue || 0) + (actorSystem.nsr.otherBonuses || 0);

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
	_prepareInfantryData(actorSystem) {
		if (this.type !== "infantry") return;

		actorSystem.squadMembers = Math.ceil(actorSystem.health.value / actorSystem.healthPerSquadMember);
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		// Deep Copy data so it doesn't get imported into the character
		const data = foundry.utils.deepClone(super.getRollData());

		// Prepare character roll data.
		this._getCharacterRollData(data);

		return data;
	}

	/**
	 * Prepare character roll data.
	 */
	_getCharacterRollData(data) {
		if (this.system.type !== "character") return;

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

	getActionsPerRound() {
		const combatTraining = this.items.filter((x) => x.type === "combatTraining");
		if (combatTraining.length === 0) {
			return METALSAVIORS.combat.defaultActionsPerRound;
		}
		return combatTraining[0].system.actionsPerRound || METALSAVIORS.combat.defaultActionsPerRound;
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
		const value = cavId ? this.system.cavAttributes[cavId][key].origValue : this.system.attributes[key].value;
		const cavBane = cavId && this.system.cavAttributes[cavId][key].bane;

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
