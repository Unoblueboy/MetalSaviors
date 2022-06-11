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
		includeToHit = true,
		weaponToHitBonus = null,
		otherToHitBonus = null,
		includeDamage = true,
		weaponDamageRoll = "0",
		otherDamageBonuses = null,
	} = {}
) {
	console.log(includeToHit, weaponToHitBonus, otherToHitBonus, includeDamage, weaponDamageRoll, otherDamageBonuses);
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

	const content = await renderTemplate("/systems/metalsaviors/templates/chatMessage/roll/attack-roll.hbs", {
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
	});

	const speaker = ChatMessage.getSpeaker({ actor: actor });
	const rollMode = game.settings.get("core", "rollMode");
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
