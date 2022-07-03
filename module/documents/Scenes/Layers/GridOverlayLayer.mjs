export class GridOverlayLayer extends CanvasLayer {
	constructor() {
		super();

		this.ranges = this.addChild(new PIXI.Container());

		this.facings = this.addChild(new PIXI.Container());
	}

	static get layerOptions() {
		return foundry.utils.mergeObject(super.layerOptions, {
			name: "gridOverlay",
			zIndex: 40,
		});
	}

	async draw() {
		// Adjust scale
		const d = canvas.dimensions;
		this.hitArea = d.rect;
		this.zIndex = this.getZIndex();
		this.interactiveChildren = false;
	}

	/** @override */
	async tearDown() {
		this.facings.removeChildren();
		this.ranges.removeChildren();
	}
}
