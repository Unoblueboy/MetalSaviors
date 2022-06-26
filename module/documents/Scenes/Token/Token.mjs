class SyncTransformObject extends PIXI.Container {
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

export class MetalSaviorsToken extends Token {
	constructor(...args) {
		super(...args);

		this.facing = new SyncTransformObject(this);
	}

	/** @override */
	async draw() {
		await super.draw();

		this._drawfacing();
		return this;
	}

	_drawfacing() {
		if (!this.facing.parent) canvas.gridOverlay.facings.addChild(this.facing);

		this.facing.removeChildren();
		this.facing.addChild(this._createFacingOverlay());

		return this.facing;
	}

	_createFacingOverlay() {
		const graphy = new PIXI.Graphics();

		const sin = 1 / 2;
		const cos = Math.sqrt(3) / 2;
		const magnitude = 500;
		const x = magnitude * cos;
		const y = magnitude * sin;

		graphy.lineStyle(10, 0x000000);
		graphy.moveTo(0, 0);
		graphy.lineTo(x, y);
		graphy.moveTo(0, 0);
		graphy.lineTo(x, -y);
		graphy.moveTo(0, 0);
		graphy.lineTo(-x, y);
		graphy.moveTo(0, 0);
		graphy.lineTo(-x, -y);
		graphy.position.x = this.bounds.width / 2;
		graphy.position.y = this.bounds.height / 2;

		return graphy;
	}

	/** @inheritdoc */
	destroy(options) {
		this.facing.destroy();
		return super.destroy(options);
	}
}
