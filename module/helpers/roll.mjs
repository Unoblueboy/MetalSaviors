import { MetalSaviorsAttributeRollDialog as MetalSaviorsAttributeOrSkillDialog } from "../documents/Actor/Dialogs/attributeOrSkillDialog.mjs";
import { MetalSaviorsChatMessage } from "../documents/ChatMessage/chatMessage.mjs";
import { WeaponRange } from "../types/Item/ItemEnums.js";

export async function rollInitiative(combatant, { bonus = 0, makeSound = true, messageData = {} }) {
	const actor = combatant.actor;
	const rollData = actor.getRollData();

	let rollString = actor.getInitiativeRoll();

	if (bonus !== 0) {
		rollString += ` + ${bonus}`;
	}

	const roll = new Roll(rollString, rollData);
	await roll.evaluate({ async: true });
	const message = await roll.toMessage(messageData, { create: false });

	// If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
	message.rollMode = combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : message.rollMode;

	if (!makeSound) {
		message.sound = null;
	}
	await MetalSaviorsChatMessage.implementation.create([message]);

	return roll;
}

export async function rollAttack(
	actor = null,
	{
		attackerName = null,
		targetName = null,
		targetDefence = null,
		weaponName = null,
		weaponImgPath = "icons/weapons/swords/greatsword-crossguard-steel.webp",
		includeToHit = true,
		weaponToHitBonus = null,
		otherToHitBonus = null,
		includeDamage = true,
		weaponDamageRoll = "0",
		otherDamageBonuses = null,
		damageType = null,
		rangeIncrement = null,
		actorToHitPenalty = null,
		targetToHitPenalty = null,
		elevationDif = null,
		tags = {},
		augments = {},
	} = {}
) {
	var toHitRoll = null;
	var toHitBonuses = [];
	if (includeToHit) {
		let toHitRollString = "d20";

		if (weaponToHitBonus) {
			toHitRollString += _getBonusString(weaponToHitBonus);

			toHitBonuses.push({
				value: _getBonusString(weaponToHitBonus),
				description: "Weapon To Hit",
			});
		}

		if (actorToHitPenalty !== null) {
			toHitRollString += _getBonusString(actorToHitPenalty);

			toHitBonuses.push({
				value: _getBonusString(actorToHitPenalty),
				description: "Actor Speed",
			});
		}

		if (targetToHitPenalty !== null) {
			toHitRollString += _getBonusString(targetToHitPenalty);

			toHitBonuses.push({
				value: _getBonusString(targetToHitPenalty),
				description: "Target Speed",
			});
		}

		if (rangeIncrement !== null) {
			const rangeIncrementPenalty = _getRangeIncrementPenalty(rangeIncrement, tags.ranged);
			toHitRollString += _getBonusString(rangeIncrementPenalty);

			toHitBonuses.push({
				value: _getBonusString(rangeIncrementPenalty),
				description: tags.ranged ? "Range [Ranged]" : "Range",
			});
		}

		if (elevationDif !== null) {
			const elevationBonus = Math.max(elevationDif, 0);

			if (elevationBonus) {
				toHitRollString += _getBonusString(elevationBonus);

				toHitBonuses.push({
					value: _getBonusString(elevationBonus),
					description: "Elevation",
				});
			}
		}

		if (augments.aimDownSights) {
			const aimDownSightsBonus = _getAimDownSightsBonus(tags.scoped);
			toHitRollString += _getBonusString(aimDownSightsBonus);

			toHitBonuses.push({
				value: _getBonusString(aimDownSightsBonus),
				description: tags.scoped ? "Aim Down Sights [Scoped]" : "Aim Down Sights",
			});
		}

		if (otherToHitBonus) {
			toHitRollString += _getBonusString(otherToHitBonus);

			toHitBonuses.push({
				value: _getBonusString(otherToHitBonus),
				description: "Other",
			});
		}

		toHitRoll = await new Roll(toHitRollString).evaluate({ async: true });
	}

	var damageRoll = null;
	var damageRolls = [];
	var critRoll = null;
	var damageBonuses = [];
	if (includeDamage) {
		let baseDamageRollString = weaponDamageRoll;

		if (tags.shotgun) {
			const shotgunDamageBonus = _getShotgunDamageBonus(rangeIncrement);
			if (shotgunDamageBonus !== null) {
				baseDamageRollString += _getBonusString(shotgunDamageBonus);

				damageBonuses.push({
					value: _getBonusString(shotgunDamageBonus),
					description: "Shotgun Range",
				});
			}
		}

		if (otherDamageBonuses) {
			baseDamageRollString += _getBonusString(otherDamageBonuses);

			damageBonuses.push({
				value: _getBonusString(otherDamageBonuses),
				description: "Other",
			});
		}

		damageRolls.push({
			damageType: "",
			description: "",
			formula: new Roll(baseDamageRollString).formula,
		});

		if (tags.piercing) {
			damageRolls.push(getPierceDamageRoll(baseDamageRollString));
		}

		console.log(damageRolls);

		damageRoll = await new Roll(baseDamageRollString).evaluate({ async: true });

		var isCrit = includeToHit && toHitRoll.terms[0].results[0].result === 20;
		if (isCrit) {
			critRoll = await damageRoll.clone().evaluate({ async: true });
		}
	}

	const template = "/systems/metalsaviors/templates/chatMessage/roll/attack-roll.hbs";
	const templateData = {
		weaponName: weaponName ?? "",
		targetName: targetName ?? "",
		weaponImgPath: weaponImgPath,
		toHitBonuses: toHitBonuses,
		damageBonuses: damageBonuses,
		targetDefence: targetDefence ?? "",
		toHitRoll: includeToHit
			? {
					terms: toHitRoll.terms.map((term) => getTemplateData(term)),
					total: toHitRoll.total,
			  }
			: null,
		damageRolls: damageRolls,
	};
	const content = await renderTemplate(template, templateData);

	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
	MetalSaviorsChatMessage.create({
		user: game.user.id,
		speaker: speaker,
		rollMode: rollMode,
		type: CONST.CHAT_MESSAGE_TYPES.ROLL,
		content: content,
		sound: CONFIG.sounds.dice,
	});
}

export async function rollDamage({ formula = "", damageType = "" } = {}) {
	var damageRoll = await new Roll(formula).evaluate();

	const templateData = {
		damageType: damageType,
		terms: damageRoll.terms.map((term) => getTemplateData(term)),
		total: damageRoll.total,
	};
	const template = "/systems/metalsaviors/templates/chatMessage/roll/damage-roll.hbs";
	const content = await renderTemplate(template, templateData);

	const rollMode = game.settings.get("core", "rollMode");
	MetalSaviorsChatMessage.create({
		user: game.user.id,
		// speaker: speaker,
		rollMode: rollMode,
		type: CONST.CHAT_MESSAGE_TYPES.ROLL,
		content: content,
		sound: CONFIG.sounds.dice,
	});
}

export async function rollSkill(actor = null, { name = null, value = 0, difficultyPenalty = 0 } = {}) {
	const rollResult = Math.ceil(CONFIG.Dice.randomUniform() * 100) || 1;
	const targetValue = value + difficultyPenalty;
	const skillResult = _getSkillResult(rollResult, targetValue);
	const skillResultClass = _getResultClass(skillResult);

	const formula = difficultyPenalty ? `d100 <= ${value} + ${difficultyPenalty}` : `d100 <= ${value}`;

	const template = "/systems/metalsaviors/templates/chatMessage/roll/skill-roll.hbs";
	const templateData = {
		formula: formula,
		rollResult: rollResult,
		skillResult: skillResult,
		skillResultClass: skillResultClass,
	};

	const content = await renderTemplate(template, templateData);

	const flavor = name ? `${actor.name} is rolling the skill ${name}` : `${actor.name} is rolling a skill`;
	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
	MetalSaviorsChatMessage.create({
		user: game.user.id,
		speaker: speaker,
		rollMode: rollMode,
		type: CONST.CHAT_MESSAGE_TYPES.ROLL,
		flavor: flavor,
		content: content,
		sound: CONFIG.sounds.dice,
	});
}

export async function rollAttributeCheck(actor = null, { name = null, value = 0 } = {}) {
	const rollResult = Math.ceil(CONFIG.Dice.randomUniform() * 20) || 1;
	const attributeCheckResult = rollResult <= value ? "Success" : "Failure";
	const attributeCheckResultClass = _getResultClass(attributeCheckResult);

	const formula = `d20 <= ${value}`;

	const template = "/systems/metalsaviors/templates/chatMessage/roll/attribute-check.hbs";
	const templateData = {
		formula: formula,
		rollResult: rollResult,
		attributeCheckresult: attributeCheckResult,
		attributeCheckResultClass: attributeCheckResultClass,
	};

	const content = await renderTemplate(template, templateData);

	const flavor = `${actor.name} is rolling an attribute check for ${name}`;
	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
	MetalSaviorsChatMessage.create({
		user: game.user.id,
		speaker: speaker,
		rollMode: rollMode,
		type: CONST.CHAT_MESSAGE_TYPES.ROLL,
		flavor: flavor,
		content: content,
		sound: CONFIG.sounds.dice,
	});
}

export async function rollAttributeOrSkill(
	actor = null,
	{ name = "", skillValue = 0, attributeValue = 0, getOptions = false, rollAsSkill = false } = {}
) {
	let attributeData = {
		name: name,
		value: attributeValue,
	};

	let skillData = {
		name: name,
		value: skillValue,
	};

	if (getOptions) {
		const data = await MetalSaviorsAttributeOrSkillDialog.getAttributeOptions({
			name: name,
			skillValue: skillValue,
			attributeValue: attributeValue,
		});

		if (data.cancelled) {
			return;
		}

		if (data.rollAsSkill) {
			skillData = data;
		} else {
			attributeData = data;
		}

		rollAsSkill = rollAsSkill || data.rollAsSkill;
	}

	if (rollAsSkill) {
		rollSkill(actor, skillData);
		return;
	}

	rollAttributeCheck(actor, attributeData);
}

function _getSkillResult(rollResult, targetValue) {
	let skillResult = rollResult <= targetValue ? "Success" : "Failure";
	if ([11, 22, 33, 44, 55, 66, 77, 88, 99, 100].includes(rollResult)) {
		skillResult = "Critical " + skillResult;
	}

	return skillResult;
}

function _getResultClass(skillResult) {
	switch (skillResult) {
		case "Success":
			return "success";
		case "Failure":
			return "failure";

		case "Critical Success":
			return "critical success";
		case "Critical Failure":
			return "critical failure";
		default:
			return "";
	}
}

function _getRangeIncrementPenalty(rangeIncrement, isRanged) {
	switch (rangeIncrement) {
		case WeaponRange.PointBlank:
			return !isRanged ? +6 : -6;
		case WeaponRange.Close:
			return !isRanged ? +4 : -4;
		case WeaponRange.Medium:
			return !isRanged ? +0 : -0;
		case WeaponRange.Long:
			return !isRanged ? -4 : -0;
		case WeaponRange.Extreme:
			return !isRanged ? -6 : -4;
		default:
			return 0;
	}
}

function _getShotgunDamageBonus(rangeIncrement) {
	if (!rangeIncrement) {
		return null;
	}

	switch (rangeIncrement) {
		case WeaponRange.PointBlank:
			return "3d6";
		case WeaponRange.Close:
			return "2d6";
		case WeaponRange.Medium:
			return "1d6";
		default:
			return null;
	}
}

function _getAimDownSightsBonus(isScoped) {
	return !isScoped ? 4 : 8;
}

function _getBonusString(value) {
	if (typeof value === "string" || value instanceof String) {
		var trimmedValue = value.trim();
		if (trimmedValue.startsWith("-") || trimmedValue.startsWith("+")) {
			return trimmedValue;
		}
		return `+${trimmedValue}`;
	} else if (typeof value === "number" || value instanceof Number) {
		return value < 0 ? `${value}` : `+${value}`;
	} else {
		return "";
	}
}

function getTemplateData(term) {
	if (term instanceof Die) {
		return {
			...term.getTooltipData(),
			type: "die",
		};
	}

	if (term instanceof OperatorTerm) {
		return {
			value: term.operator,
			type: "operator",
		};
	}

	if (term instanceof NumericTerm) {
		return {
			value: term.number,
			type: "number",
		};
	}

	return {
		type: "other",
	};
}

function getPierceDamageRoll(baseDamageRollString) {
	var rollTerms = new Roll(baseDamageRollString).terms;
	var newRollTerms = [];
	for (const term of rollTerms) {
		newRollTerms.push(term);
		if (term instanceof Die) {
			newRollTerms.push(new OperatorTerm({ operator: "*" }));
			newRollTerms.push(new NumericTerm({ number: 2 }));
		}
	}

	var newRoll = Roll.fromTerms(newRollTerms);

	return {
		damageType: "",
		description: "Piercing",
		formula: newRoll.formula,
	};
}
