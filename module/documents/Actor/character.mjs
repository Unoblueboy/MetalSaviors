import { attributeCalculator, derivedAttributeCalculator } from "../helpers/Calculators.mjs";
import { rollAttributeOrSkill } from "../../helpers/roll.mjs";
import { generateSkillKey } from "../../helpers/KeyGenerator.mjs";
import { MetalSaviorsActor } from "./actor.mjs";

export class MetalSaviorsCharacter extends MetalSaviorsActor {
	static AddCavActor(actor, sheet, data) {
		console.log("AddCavActor", actor, sheet, data);
		if (actor.type !== "character") return;
		if (data.type !== "Actor") return;

		const cav = fromUuidSync(data.uuid);
		console.log(cav);
		if (cav.type !== "cav") return;

		cav.setPilot(actor);
	}

	_preCreate(data, options, user) {
		super._preCreate(data, options, user);

		if (!this.isOwner) return;
		if (this.getCharacterType()) return;

		this.setSourceCharacterType("character");
		this.setSourceCurWeapon(null);
	}

	async setSourceCharacterType(charType) {
		this.updateSource({
			"flags.metalsaviors.characterType": charType,
		});
	}

	async setCharacterType(charType) {
		await this.setFlag("metalsaviors", "characterType", charType);
	}

	getCharacterType() {
		return this.getFlag("metalsaviors", "characterType");
	}

	async addCav(cavActor) {
		if (cavActor.type !== "cav") return;

		const cavId = cavActor.id;
		if (!this.system.cavs) {
			await this.update({ "system.cavs": [] });
		}
		const cavIds = [...this.system.cavs];

		if (cavIds.includes(cavId)) return;

		const newCavIds = cavIds.concat(cavId);
		await this.update({ "system.cavs": newCavIds });
	}

	async deleteCav(cavActor) {
		if (cavActor.type !== "cav") return;

		const cavId = cavActor.id;
		if (!this.system.cavs) {
			await this.update({ "system.cavs": [] });
		}

		const cavIds = [...this.system.cavs];
		if (!cavIds.includes(cavId)) return;

		const filteredCavIds = cavIds.filter((x) => x !== cavId);
		await this.update({ "system.cavs": filteredCavIds });
	}

	getCavs() {
		if (!this.system.cavs) {
			this.update({ "system.cavs": [] });
			return [];
		}

		const cavIds = [...this.system.cavs];
		const cavs = cavIds.map((id) => game.actors.get(id));
		return cavs;
	}

	async setSourceCurWeapon(curWeapon) {
		const weaponId = curWeapon ? curWeapon.id : "";

		this.updateSource({
			"flags.metalsaviors.curWeapon": weaponId,
		});
	}

	prepareDerivedData() {
		const actorSystem = this.system;
		const actorItems = this.items;

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

	getRollData() {
		const data = foundry.utils.deepClone(super.getRollData());

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

	getInitiativeRoll({ inCav = false } = {}) {
		if (!inCav) {
			return "d20 + @derivedAttributes.initiativeModifier.value";
		}
		return "d20 + @derivedAttributes.cavInitiativeModifier.value";
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
