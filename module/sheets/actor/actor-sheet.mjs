// Treat this as an abstract class for all Actor Sheets to inherit from
export class MetalSaviorsActorSheet extends ActorSheet {
	async close(options = {}) {
		if (!this.isEditable) {
			options.submit = false;
		}

		return super.close(options);
	}
}
