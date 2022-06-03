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
