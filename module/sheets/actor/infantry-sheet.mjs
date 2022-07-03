export class MetalSaviorsInfantrySheet extends ActorSheet {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-infantry-sheet.hbs`;
	}

	getData() {
		const context = super.getData();

		context.squadTypes = [
			{
				name: "Anti-Vehicle",
				description:
					"Infantry armed with Anti-Armor weapons. " +
					"Deals 2d6 Damage to other Infantry, and 2d6 Missile Damage to CAV Units. " +
					"Standard Size is 6 to 10.",
			},
			{
				name: "Engineer",
				description:
					"Lightly armed Infantry with repair capabilities. " +
					"Deals 1d6 Damage to other Infantry, but can repair 1d6 Durability to damage sections per Round.",
			},
			{
				name: "Recon",
				description:
					"Infantry designed for range finding. " +
					"Deals 1d6 Damage to other Infantry Squads, " +
					"but can transmit current enemy locations directly to the CAV Squad.",
			},
			{
				name: "Rifles",
				description:
					"Standard Infantry, light AV capabilities. " +
					"Deals 4d6 Damage to other Infantry Squads, but 1d6 Damage to CAV Units (Single Fire). " +
					"Standard size is 10 to 12.",
			},
			{
				name: "Support",
				description:
					"Infantry designed to support other Infantry Squads. " +
					"Deals 2d6 Damage to other Infantry Squads, " +
					"but restores 1d6 Squad Health to all adjacent Infantry Squads.",
			},
		];

		this._prepareItems(context);

		return context;
	}

	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		let combatTraining = null;

		// Iterate through items, allocating to containers
		for (let i of context.items) {
			i.img = i.img || DEFAULT_TOKEN;
			// Append to gear.
			switch (i.type) {
				case "item":
					gear.push(i);
					break;
				case "combatTraining":
					combatTraining = i;
					break;
			}
		}

		// Assign and return
		context.gear = gear;
		context.combatTraining = combatTraining;
	}
}
