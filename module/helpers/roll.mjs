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
	{ weaponToHitBonus = null, otherToHitBonus = null, weaponDamageRoll = "0", otherDamageBonuses = null } = {}
) {
	let toHitRollString = "d20";

	if (weaponToHitBonus) {
		toHitRollString += `+${weaponToHitBonus}`;
	}

	if (otherToHitBonus) {
		toHitRollString += `+${otherToHitBonus}`;
	}

	var toHitRoll = await new Roll(toHitRollString).evaluate({ async: true });

	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");

	let damageRollString = weaponDamageRoll;

	if (otherDamageBonuses) {
		damageRollString += `+${otherDamageBonuses}`;
	}

	var damageRoll = await new Roll(damageRollString).evaluate({ async: true });

	var critRoll = null;
	var isCrit = toHitRoll.terms[0].results[0].result === 20;
	if (isCrit) {
		critRoll = await damageRoll.clone().evaluate({ async: true });
	}

	const content = await renderTemplate("/systems/metalsaviors/templates/chatMessage/roll/attack-roll.hbs", {
		toHitRoll: {
			formula: toHitRoll.formula,
			parts: toHitRoll.dice.map((d) => d.getTooltipData()),
			total: toHitRoll.total,
		},
		damageRoll: {
			formula: damageRoll.formula,
			parts: damageRoll.dice.map((d) => d.getTooltipData()),
			total: damageRoll.total,
		},
		critRoll: critRoll
			? {
					formula: critRoll.formula,
					parts: critRoll.dice.map((d) => d.getTooltipData()),
					total: critRoll.total,
			  }
			: null,
		isPrivate: false,
	});

	ChatMessage.create(
		{
			user: game.user.id,
			speaker: speaker,
			rollMode: rollMode,
			flavor: `${actor.data.name} is making an attack`,
			content: content,
			sound: CONFIG.sounds.dice,
		},
		{ rollMode: rollMode }
	);
}
