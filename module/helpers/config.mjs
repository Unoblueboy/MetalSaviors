export const METALSAVIORS = {};

// Define constants here, such as:
METALSAVIORS.foobar = {
	bas: "METALSAVIORS.bas",
	bar: "METALSAVIORS.bar",
};

METALSAVIORS.skillTypes = ["learnedSkill", "atbSkill"];

/**
 * The set of Attribute Scores used within the sytem.
 * @type {Object}
 */
METALSAVIORS.attributes = {
	bea: "METALSAVIORS.AttributeBea",
	fin: "METALSAVIORS.AttributeFin",
	hrd: "METALSAVIORS.AttributeHrd",
	int: "METALSAVIORS.AttributeInt",
	pow: "METALSAVIORS.AttributePow",
	spd: "METALSAVIORS.AttributeSpd",
	wil: "METALSAVIORS.AttributeWil",
};

METALSAVIORS.attributeAbbreviations = {
	bea: "METALSAVIORS.AttributeBeaAbbr",
	fin: "METALSAVIORS.AttributeFinAbbr",
	hrd: "METALSAVIORS.AttributeHrdAbbr",
	int: "METALSAVIORS.AttributeIntAbbr",
	pow: "METALSAVIORS.AttributePowAbbr",
	spd: "METALSAVIORS.AttributeSpdAbbr",
	wil: "METALSAVIORS.AttributeWilAbbr",
};

METALSAVIORS.derivedAttributes = {
	damageModifier: "METALSAVIORS.AttributeDamageModifier",
	toHitModifier: "METALSAVIORS.AttributeToHitModifier",
	skillModifier: "METALSAVIORS.AttributeSkillModifier",
	reactionModifier: "METALSAVIORS.AttributeReactionModifier",
	initiativeModifier: "METALSAVIORS.AttributeInitiativeModifier",
	spacesMoved: "METALSAVIORS.AttributeSpacesMoved",
	cavInitiativeModifier: "METALSAVIORS.AttributeCavInitiativeModifier",
};

METALSAVIORS.derivedAttributesAbbreviations = {
	damageModifier: "METALSAVIORS.AttributeDamageModifierAbbr",
	toHitModifier: "METALSAVIORS.AttributeToHitModifierAbbr",
	skillModifier: "METALSAVIORS.AttributeSkillModifierAbbr",
	reactionModifier: "METALSAVIORS.AttributeReactionModifierAbbr",
	initiativeModifier: "METALSAVIORS.AttributeInitiativeModifierAbbr",
	spacesMoved: "METALSAVIORS.AttributeSpacesMovedAbbr",
	cavInitiativeModifier: "METALSAVIORS.AttributeCavInitiativeModifierAbbr",
};

METALSAVIORS.combat = {
	defaultActionsPerRound: 1,
};

METALSAVIORS.combatSpeeds = {
	halt: "METALSAVIORS.CombatSpeedHalt",
	walk: "METALSAVIORS.CombatSpeedWalk",
	pace: "METALSAVIORS.CombatSpeedPace",
	gallop: "METALSAVIORS.CombatSpeedGallop",
	sprint: "METALSAVIORS.CombatSpeedSprint",
};
