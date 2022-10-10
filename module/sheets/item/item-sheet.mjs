import { MetalSaviorsAbstractItemSheet } from "./abstract-item-sheet.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsItemSheet extends MetalSaviorsAbstractItemSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			width: 520,
			height: 480,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "description",
				},
			],
		});
	}

	/** @override */
	get template() {
		const path = "systems/metalsaviors/templates/item";
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.hbs`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.hbs`.
		return `${path}/item-${this.item.type}-sheet.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Retrieve the roll data for TinyMCE editors.
		context.rollData = {};
		let actor = this.object?.parent ?? null;
		if (actor) {
			context.rollData = actor.getRollData();
		}

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = foundry.utils.deepClone(this.item.system);
		context.flags = foundry.utils.deepClone(this.item.flags);

		// Add some rendering options to the context
		this.renderOptions = this.renderOptions ?? {
			isEditing: false,
		};
		context.renderOptions = this.renderOptions;

		return context;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Edit Button
		html.find(".edit-button").click(() => {
			this.renderOptions.isEditing = !this.renderOptions.isEditing;
			this.render(true);
		});
		// Roll handlers, click handlers, etc. would go here.
	}
}
