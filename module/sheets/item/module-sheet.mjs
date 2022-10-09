/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsModuleSheet extends ItemSheet {
	/** @override */
	get template() {
		return "systems/metalsaviors/templates/item/module/module-sheet.hbs";
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			height: 350,
		});
	}

	getData() {
		const context = super.getData();
		context.system = foundry.utils.deepClone(this.item.system);

		return context;
	}
}