export class MetalSaviorsCav extends Item {
	_onCreate(data, options, userId) {}

	_initialize(options = {}) {
		super._initialize(options);
		if (this.id) this.delete();
	}
}
