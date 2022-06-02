export async function rollInitiative(combatant, { inCav = false, bonus = 0, createMessage = true, messageData = {} }) {
	const actor = combatant.actor;
	const rollData = actor.getRollData();

	var rollString;
	if (!inCav) {
		rollString = "d20 + @derivedAttributes.initiativeModifier.value";
	} else {
		rollString = "d20 + @derivedAttributes.cavInitiativeModifier.value";
	}

	if (bonus !== 0) {
		rollString += ` + ${bonus}`;
	}

	const roll = new Roll(rollString, rollData);
	await roll.evaluate({ async: true });
	roll.toMessage(messageData, { create: createMessage });

	return roll;
}
