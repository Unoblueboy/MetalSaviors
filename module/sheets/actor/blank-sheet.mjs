export class MetalSaviorsBlankSheet extends ActorSheet {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-blank-sheet.hbs`;
	}

	getData() {
		const context = super.getData();
		const actorData = this.actor.data.toObject(false);
		context.data = actorData.data;

		return context;
	}
}
