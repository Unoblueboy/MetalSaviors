export function attributeCalculator(actorData, data) {
	const attributeDicts = {};
	for (let [key, attribute] of Object.entries(data.attributes)) {
		const attributeDict = {
			...attribute,
			bonusesFromAtbSkills: 0,
		};
		attributeDicts[key] = attributeDict;
	}

	const cavAttributes = {};

	for (const item of actorData.items) {
		if (!["atbSkill", "cav"].includes(item.type)) {
			continue;
		}

		if (item.type === "atbSkill") {
			const itemData = item.data;
			for (const [name, bonus] of Object.entries(itemData.data.attributeBonuses)) {
				attributeDicts[name].bonusesFromAtbSkills += bonus;
			}
		}

		if (item.type == "cav") {
			cavAttributes[item.id] = {};
		}
	}

	const cavs = actorData.items.filter((x) => x.type === "cav");
	const licences = actorData.items.filter((x) => x.type === "pilotLicense");

	for (let [key, attributeDict] of Object.entries(attributeDicts)) {
		const [value, cavValue] = _calculateAttributeValue(attributeDict, licences, cavs);
		data.attributes[key].value = value;

		for (let [cavId, cavAttr] of Object.entries(cavAttributes)) {
			cavAttr[key] = cavValue[cavId];
		}
	}
	data.cavAttributes = cavAttributes;
}

function _calculateAttributeValue(attributeDict, licences, cavs) {
	const pilotValue = attributeDict.baseValue + attributeDict.otherBonuses + attributeDict.bonusesFromAtbSkills;
	const cavValues = {};
	for (let cav of cavs) {
		cavValues[cav.id] = { origValue: pilotValue, value: pilotValue, bane: false };
		if (licences.every((x) => x.name !== cav.data.data.requiredLicense)) {
			cavValues[cav.id].bane = true;
		}
	}
	return [pilotValue, cavValues];
}

export function derivedAttributeCalculator(actorData, data) {
	let dAttributes = data.derivedAttributes;
	let attributes = data.attributes;

	let bonusToAttrDict = {
		damageModifier: 0,
		toHitModifier: 0,
		skillModifier: 0,
		reactionModifier: 0,
		initiativeModifier: 0,
		spacesMoved: 0,
		cavInitiativeModifier: 0,
	};

	const atbSkills = actorData.items?.filter((x) => x.type === "atbSkill") ?? [];

	for (const atbSkill of atbSkills) {
		for (const [k, v] of Object.entries(atbSkill.data.data.derivedAttributeBonuses)) {
			bonusToAttrDict[k] += v;
		}
	}

	dAttributes.damageModifier.baseValue = _calculateBaseDamageModifier(attributes.pow.value);
	dAttributes.damageModifier.value = _validateDamageModifier(dAttributes.damageModifier);

	dAttributes.toHitModifier.baseValue = _calculateToHitModifier(attributes.pow.value);
	dAttributes.toHitModifier.value =
		dAttributes.toHitModifier.baseValue + dAttributes.toHitModifier.otherBonuses + bonusToAttrDict.toHitModifier;

	dAttributes.skillModifier.baseValue = _calculateSkillModifier(attributes.int.value);
	dAttributes.skillModifier.value =
		dAttributes.skillModifier.baseValue + dAttributes.skillModifier.otherBonuses + bonusToAttrDict.skillModifier;

	dAttributes.reactionModifier.baseValue = _calculateReactionModifier(attributes.bea.value);
	dAttributes.reactionModifier.value =
		dAttributes.reactionModifier.baseValue +
		dAttributes.reactionModifier.otherBonuses +
		bonusToAttrDict.reactionModifier;

	dAttributes.initiativeModifier.baseValue = _calculateInitiativeModifier(attributes.spd.value);
	dAttributes.initiativeModifier.value =
		dAttributes.initiativeModifier.baseValue +
		dAttributes.initiativeModifier.otherBonuses +
		bonusToAttrDict.initiativeModifier;

	dAttributes.spacesMoved.baseValue = _calculateSpacesMoved(attributes.spd.value);
	dAttributes.spacesMoved.value =
		dAttributes.spacesMoved.baseValue + dAttributes.spacesMoved.otherBonuses + bonusToAttrDict.spacesMoved;

	dAttributes.cavInitiativeModifier.baseValue = _calculateCavInitiativeModifier(
		attributes.fin.value,
		attributes.spd.value
	);
	dAttributes.cavInitiativeModifier.value =
		dAttributes.cavInitiativeModifier.baseValue +
		dAttributes.cavInitiativeModifier.otherBonuses +
		bonusToAttrDict.cavInitiativeModifier;
}

function _calculateBaseDamageModifier(power) {
	if (power <= 10) {
		return "0";
	}
	if (power <= 15) {
		return "1d6";
	}
	if (power <= 20) {
		return "2d6";
	}
	return "3d6";
}

function _validateDamageModifier(damageModifier) {
	if (!damageModifier.otherBonuses) {
		return damageModifier.baseValue;
	}

	let formula = `${damageModifier.baseValue} + ${damageModifier.otherBonuses}`;

	if (!Roll.validate(formula)) {
		return damageModifier.baseValue;
	}

	return formula;
}

function _calculateToHitModifier(power) {
	if (power <= 5) {
		return -2;
	}
	if (power <= 10) {
		return 0;
	}
	if (power <= 15) {
		return 1;
	}
	if (power <= 20) {
		return 2;
	}
	return 3;
}

function _calculateSkillModifier(intelligence) {
	if (intelligence <= 10) {
		return 0;
	}
	if (intelligence <= 13) {
		return 4;
	}
	if (intelligence <= 16) {
		return 8;
	}
	if (intelligence <= 19) {
		return 10;
	}
	return 12;
}

function _calculateReactionModifier(beauty) {
	if (beauty <= 0) {
		return -6;
	}
	if (beauty <= 4) {
		return -3;
	}
	if (beauty <= 9) {
		return 0;
	}
	if (beauty <= 14) {
		return 1;
	}
	if (beauty <= 19) {
		return 2;
	}
	return 3;
}

function _calculateInitiativeModifier(speed) {
	if (speed <= 0) {
		return -6;
	}
	if (speed <= 4) {
		return -3;
	}
	if (speed <= 9) {
		return 0;
	}
	if (speed <= 14) {
		return 1;
	}
	if (speed <= 19) {
		return 2;
	}
	return 3;
}

function _calculateSpacesMoved(speed) {
	if (speed <= 0) {
		return 1;
	}
	if (speed <= 4) {
		return 2;
	}
	if (speed <= 9) {
		return 3;
	}
	if (speed <= 14) {
		return 4;
	}
	if (speed <= 19) {
		return 5;
	}
	return 6;
}

function _calculateCavInitiativeModifier(finesse, speed) {
	let avg = Math.floor((finesse + speed) / 2);

	if (avg <= 0) {
		return -6;
	}
	if (avg <= 4) {
		return -3;
	}
	if (avg <= 9) {
		return 0;
	}
	if (avg <= 14) {
		return 1;
	}
	if (avg <= 19) {
		return 2;
	}
	return 3;
}

/**
 * Audio/Video Conferencing Configuration Sheet
 *
 *
 * @param {object} [skill]  The Skill
 * @param {object} [actor]  The Actor Data
 *
 * @returns {number} The skill Value
 */
export function CalculateSkillValue(skill, actor) {
	const skillData = skill.data;

	const actorData = _getActorData(actor);
	const cavBonuses = _getCavBonuses(skillData.name, actorData);

	if (skillData.data.override.active) {
		return {
			value: skillData.data.override.value,
			cavValue: _calculateCavValue(skillData.data.override.value, cavBonuses),
		};
	}

	const lvl = actorData.data?.level?.value || 1;
	const lvlAcquired = skill.data.data.lvlAcquired || 1;
	const lvlDiff = lvl - lvlAcquired + 1;

	const skillModifier = actorData.data?.derivedAttributes?.skillModifier?.value || 0;
	const numAcquiredBonus = (skillData.data.numAcquisitions - 1) * 10;

	const bonusesFromAtbSkills = _calculateSkillBonusesFromAtbSkills(skillData.name, actorData);

	const skillValue =
		skillData.data.baseValue +
		numAcquiredBonus +
		bonusesFromAtbSkills +
		skillData.data.otherBonuses +
		skillData.data.levelIncrease * (lvlDiff - 1) +
		skillModifier;

	return {
		value: skillValue,
		cavValue: _calculateCavValue(skillValue, cavBonuses),
	};
}

function _getActorData(actor) {
	if (!!actor.data) return actor.data;

	return {
		data: {
			level: {
				value: 1,
			},
			derivedAttributes: {
				skillModifier: {
					value: 0,
				},
			},
		},
	};
}

function _getCavBonuses(skillName, actorData) {
	const cavs = actorData.items?.filter((x) => x.type === "cav") ?? [];
	let bonus = {};
	for (const cav of cavs) {
		const cavBonus = cav.data.data.cavUnitPiloting[skillName] || 0;
		const requiredLicense = cav.data.data.requiredLicense;
		const hasRequiredLicense = (actorData.items ?? []).some(
			(x) => x.type === "pilotLicense" && x.name === requiredLicense
		);

		if (hasRequiredLicense) {
			bonus[cav.id] = cavBonus;
			continue;
		}

		bonus[cav.id] = cavBonus - 15;
	}
	return bonus;
}

function _calculateCavValue(skillValue, cavBonuses) {
	const cavValue = {};
	for (const [cavId, bonus] of Object.entries(cavBonuses)) {
		cavValue[cavId] = skillValue + bonus;
	}
	return cavValue;
}

function _calculateSkillBonusesFromAtbSkills(skillName, actorData) {
	const atbSkills = actorData.items?.filter((x) => x.type === "atbSkill") ?? [];
	let bonus = 0;

	for (const atbSkill of atbSkills) {
		if (Object.keys(atbSkill.data.data.skillBonuses).includes(skillName)) {
			bonus += atbSkill.data.data.skillBonuses[skillName];
		}
	}
	return bonus;
}
