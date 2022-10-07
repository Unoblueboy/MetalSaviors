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
	constructor(data, context) {
		if (data.items) {
			// Remove all Cav Items
			const allowedItems = data.items.filter((item) => item.type != "cav");
			data.items = allowedItems;
		}
		super(data, context);
	}

	static EnforceItemUniqueness(actor, sheet, data) {
		if (data.type !== "Item") return;

		const item = game.items.find((x) => x.uuid == data.uuid);

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
			case "learnedSkill": {
				const newNumAcquisitions = origItemData.numAcquisitions + 1;
				ui.notifications.info(
					`The skill ${origItem.name} has been updated, it now has ${newNumAcquisitions} acquisition`
				);
				origItem.update({
					"system.numAcquisitions": newNumAcquisitions,
				});
				break;
			}
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

		const item = game.items.find((x) => x.uuid == data.uuid);

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

	async setCurWeapon(curWeapon) {
		await this.setFlag("metalsaviors", "curWeapon", curWeapon ? curWeapon.id : "");

		const tokens = this.getActiveTokens(true, false);

		tokens.forEach((x) => x.refresh());
	}

	getCurWeapon() {
		const weaponId = this.getFlag("metalsaviors", "curWeapon");
		return this.items.get(weaponId);
	}

	getActionsPerRound() {
		const combatTraining = this.items.find((x) => x.type === "combatTraining");
		if (!combatTraining) {
			return METALSAVIORS.combat.defaultActionsPerRound;
		}
		return combatTraining.system.actionsPerRound || METALSAVIORS.combat.defaultActionsPerRound;
	}

	getInitiativeRoll(options = {}) {
		return "d20";
	}
}
