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
					"Deals 2 Damage to other Infantry, and 4 Damage to CAV Units. " +
					"Standard Size is 6 to 10.",
			},
			{
				name: "Engineer",
				description:
					"Lightly armed Infantry with repair capabilities. " +
					"Deals 2 Damage to other Infantry, but can repair 1d6 Durability to damage sections per Round.",
			},
			{
				name: "Recon",
				description:
					"Infantry designed for range finding. " +
					"Deals 2 Damage to other Infantry Squads, " +
					"but can transmit current enemy locations directly to the CAV Squad.",
			},
			{
				name: "Rifles",
				description:
					"Standard Infantry, light AV capabilities. " +
					"Deals 5 Damage to other Infantry Squads, but 2 Damage to CAV Units. Standard size is 10 to 12.",
			},
			{
				name: "Support",
				description:
					"Infantry designed to support other Infantry Squads. " +
					"Deals 3 Damage to other Infantry Squads, " +
					"but restores 3 Squad Health to all adjacent Infantry Squads.",
			},
		];

		return context;
	}
}
