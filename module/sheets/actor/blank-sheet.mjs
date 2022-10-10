import { MetalSaviorsActorSheet } from "./actor-sheet.mjs";

export class MetalSaviorsBlankSheet extends MetalSaviorsActorSheet {
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
		const actorSystem = this.actor.system;
		context.system = actorSystem;

		return context;
	}
}
