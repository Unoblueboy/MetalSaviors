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
		this.facingOverlay = this.facingOverlay || new PIXI.Graphics();

		const d = canvas.dimensions;

		const sin = 1 / 2;
		const cos = Math.sqrt(3) / 2;
		const tiles = 5;

		let magnitude = Math.max(tiles + 0.5, 0) * d.size;
		if ([4, 5].includes(canvas.scene.data.gridType)) {
			magnitude *= Math.sqrt(3) / 2;
		}

		const x = magnitude * cos;
		const y = magnitude * sin;

		this.facingOverlay.lineStyle(10, this._getBorderColor() || 0x000000);
		this.facingOverlay.moveTo(0, 0);
		this.facingOverlay.lineTo(x, y);
		this.facingOverlay.moveTo(0, 0);
		this.facingOverlay.lineTo(x, -y);
		this.facingOverlay.moveTo(0, 0);
		this.facingOverlay.lineTo(-x, y);
		this.facingOverlay.moveTo(0, 0);
		this.facingOverlay.lineTo(-x, -y);
		this.facingOverlay.position.x = this.bounds.width / 2;
		this.facingOverlay.position.y = this.bounds.height / 2;

		return this.facingOverlay;
	}

	refresh() {
		super.refresh();
		if (this.facing && this.facingOverlay) this._refreshFacing();
		return this;
	}

	_refreshFacing() {
		this.facingOverlay.clear();

		if (!this._hover && !this._controlled) return;

		this._drawfacing();
	}

	destroy(options) {
		this.facing.destroy();
		return super.destroy(options);
	}
}
