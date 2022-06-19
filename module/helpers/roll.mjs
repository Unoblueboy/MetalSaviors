import { MetalSaviorsAttributeRollDialog as MetalSaviorsAttributeOrSkillDialog } from "../documents/Actor/Dialogs/attributeOrSkillDialog.mjs";
import { MetalSaviorsChatMessage } from "../documents/ChatMessage/chatMessage.mjs";

export async function rollInitiative(combatant, { inCav = false, bonus = 0, createMessage = true, messageData = {} }) {
	const actor = combatant.actor;
	const rollData = actor.getRollData();

	let rollString = actor.getInitiativeRoll({ inCav: inCav });

	if (bonus !== 0) {
		rollString += ` + ${bonus}`;
	}

	const roll = new Roll(rollString, rollData);
	await roll.evaluate({ async: true });
	roll.toMessage(messageData, { create: createMessage });

	return roll;
}

export async function rollAttack(
	actor = null,
	{
		attackerName = null,
		weaponName = null,
		includeToHit = true,
		weaponToHitBonus = null,
		otherToHitBonus = null,
		includeDamage = true,
		weaponDamageRoll = "0",
		otherDamageBonuses = null,
		damageType = null,
	} = {}
) {
	var toHitRoll = null;
	if (includeToHit) {
		let toHitRollString = "d20";

		if (weaponToHitBonus) {
			toHitRollString += `+${weaponToHitBonus}`;
		}

		if (otherToHitBonus) {
			toHitRollString += `+${otherToHitBonus}`;
		}

		toHitRoll = await new Roll(toHitRollString).evaluate({ async: true });
	}

	var damageRoll = null;
	var critRoll = null;
	if (includeDamage) {
		let damageRollString = weaponDamageRoll;

		if (otherDamageBonuses) {
			damageRollString += `+${otherDamageBonuses}`;
		}

		var damageRoll = await new Roll(damageRollString).evaluate({ async: true });

		var isCrit = includeToHit && toHitRoll.terms[0].results[0].result === 20;
		if (isCrit) {
			critRoll = await damageRoll.clone().evaluate({ async: true });
		}
	}

	const template = "/systems/metalsaviors/templates/chatMessage/roll/attack-roll.hbs";
	const templateData = {
		toHitRoll: includeToHit
			? {
					formula: toHitRoll.clone().formula,
					parts: toHitRoll.dice.map((d) => d.getTooltipData()),
					total: toHitRoll.total,
			  }
			: null,
		damageRoll: includeDamage
			? {
					formula: damageRoll.clone().formula,
					parts: damageRoll.dice.map((d) => d.getTooltipData()),
					total: damageRoll.total,
			  }
			: null,
		critRoll: isCrit
			? {
					formula: critRoll.clone().formula,
					parts: critRoll.dice.map((d) => d.getTooltipData()),
					total: critRoll.total,
			  }
			: null,
		isPrivate: false,
	};
	const content = await renderTemplate(template, templateData);

	attackerName = attackerName || actor.data.name;
	let flavor = `${attackerName} is making an attack`;
	if (weaponName) {
		flavor += ` with their ${weaponName}`;
	}
	if (damageType) {
		flavor += ` (${damageType})`;
	}
	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
	MetalSaviorsChatMessage.create({
		user: game.user.id,
		speaker: speaker,
		rollMode: rollMode,
		roll: null,
		type: CONST.CHAT_MESSAGE_TYPES.ROLL,
		flavor: flavor,
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

	const flavor = name ? `${actor.data.name} is rolling the skill ${name}` : `${actor.data.name} is rolling a skill`;
	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
	MetalSaviorsChatMessage.create({
		user: game.user.id,
		speaker: speaker,
		rollMode: rollMode,
		roll: null,
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
		roll: null,
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
