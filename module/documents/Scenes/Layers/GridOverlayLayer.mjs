export class GridOverlayLayer extends CanvasLayer {
	constructor() {
		super();

		this.ranges = this.addChild(new PIXI.Container());
		this.facings = this.addChild(new PIXI.Container());
	}

	static get layerOptions() {
		return foundry.utils.mergeObject(super.layerOptions, {
			name: "gridOverlay",
		});
	}

	async _draw() {
		// Adjust scale
		const d = canvas.dimensions;
		this.hitArea = d.rect;
		this.zIndex = 40;
	}

	/** @override */
	async _tearDown() {
		this.facings.removeChildren();
		this.ranges.removeChildren();
	}
}
