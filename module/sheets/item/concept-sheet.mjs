/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsConceptSheet extends ItemSheet {
	/** @override */
	get template() {
		return "systems/metalsaviors/templates/item/concept/concept-sheet.hbs";
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			height: 350,
		});
	}

	getData() {
		const context = super.getData();

		const itemData = this.item.data.toObject(false);
		context.data = itemData.data;

		return context;
	}
}
