export class SyncTransformObject extends PIXI.Container {
	constructor(object) {
		super();

		this.object = object;

		this.transform = new SynchronizedTransform(this.object.transform);
	}

	/** @override */
	get visible() {
		return this.object.visible;
	}
	set visible(value) {}
}
