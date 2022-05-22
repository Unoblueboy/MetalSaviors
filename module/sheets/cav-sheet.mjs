/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsCavSheet extends ItemSheet {
	/** @override */
	get template() {
		const path = "systems/metalsaviors/templates/item/cav";
		return `${path}/cav-sheet.hbs`;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			height: 350,
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		const itemData = context.item.data;

		context.data = foundry.utils.deepClone(itemData.data);

		return context;
	}
}
