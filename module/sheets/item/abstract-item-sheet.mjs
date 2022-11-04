// Treat this as an abstract class for all Item Sheets to inherit from
export class MetalSaviorsAbstractItemSheet extends ItemSheet {
	async close(options = {}) {
		if (!this.isEditable) {
			options.submit = false;
		}

		return super.close(options);
	}
}
