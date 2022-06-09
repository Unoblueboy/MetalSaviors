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
		weaponToHitBonus = null,
		meleeToHitBonus = null,
		otherToHitBonus = null,
		weaponDamageRoll = "0",
		otherDamageBonuses = null,
	} = {}
) {
	let toHitRollString = "d20";

	if (weaponToHitBonus) {
		toHitRollString += `+${weaponToHitBonus}`;
	}

	if (meleeToHitBonus) {
		toHitRollString += `+${meleeToHitBonus}`;
	}

	if (otherToHitBonus) {
		toHitRollString += `+${meleeToHitBonus}`;
	}

	var toHitRoll = new Roll(toHitRollString);

	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
	toHitRoll.toMessage({
		speaker: speaker,
		rollMode: rollMode,
		flavor: `${actor.data.name} is Rolling to Hit`,
	});

	let damageRollString = weaponDamageRoll;

	if (otherDamageBonuses) {
		damageRollString += `+${otherDamageBonuses}`;
	}

	var damageRoll = new Roll(damageRollString);
	damageRoll.toMessage({
		speaker: speaker,
		rollMode: rollMode,
		flavor: `${actor.data.name} is Rolling Damage`,
	});
}
