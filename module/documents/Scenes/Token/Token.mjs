import { SyncTransformObject } from "./SyncTransformObject.mjs";
import { WeaponRangeManager } from "./Overlays/WeaponRangeManager.mjs";
import { FacingManager } from "./Overlays/FacingManager.mjs";

export class MetalSaviorsToken extends Token {
	constructor(...args) {
		super(...args);

		this.weaponRangeManager = new WeaponRangeManager(this);
		this.facingManager = new FacingManager(this);
	}

	/** @override */
	async draw() {
		await super.draw();

		this.facingManager.draw();
		this.weaponRangeManager.draw();
		return this;
	}

	refresh() {
		super.refresh();

		this.facingManager.refresh();
		this.weaponRangeManager.refresh();

		return this;
	}

	destroy(options) {
		this.facingManager.destroy();
		this.weaponRangeManager.destroy();

		return super.destroy(options);
	}

	_drawAttributeBars() {
		const bars = new PIXI.Container();
		switch (this.actor.type) {
			case "cav": {
				bars.head = bars.addChild(new PIXI.Graphics());
				bars.lArm = bars.addChild(new PIXI.Graphics());
				bars.rArm = bars.addChild(new PIXI.Graphics());
				bars.torso = bars.addChild(new PIXI.Graphics());
				bars.reactor = bars.addChild(new PIXI.Graphics());
				bars.lLeg = bars.addChild(new PIXI.Graphics());
				bars.rLeg = bars.addChild(new PIXI.Graphics());
				break;
			}
			default: {
				bars.bar1 = bars.addChild(new PIXI.Graphics());
				bars.bar2 = bars.addChild(new PIXI.Graphics());
				break;
			}
		}

		return bars;
	}

	drawBars() {
		if (!this.actor || this.document.displayBars === CONST.TOKEN_DISPLAY_MODES.NONE) {
			return (this.bars.visible = false);
		}
		switch (this.actor.type) {
			case "cav": {
				Object.keys(game.model.Actor.cav.health).forEach((limb) => {
					const limbBar = this.bars[limb];
					const attr = this.document.getBarAttribute(null, { alternative: `health.${limb}` });
					if (!attr || attr.type !== "bar") return (limbBar.visible = false);
					this._drawCavBar(limb, limbBar, attr);
					limbBar.visible = true;
				});
				break;
			}
			default: {
				["bar1", "bar2"].forEach((b, i) => {
					const bar = this.bars[b];
					const attr = this.document.getBarAttribute(b);
					if (!attr || attr.type !== "bar") return (bar.visible = false);
					this._drawBar(i, bar, attr);
					bar.visible = true;
				});
				break;
			}
		}

		this.bars.visible = this._canViewMode(this.document.displayBars);
	}

	_drawCavBar(limb, bar, data) {
		const val = Number(data.value);
		const pct = Math.clamped(val, 0, data.max) / data.max;

		const color = PIXI.utils.rgb2hex([1 - pct / 2, pct, 0]);
		const [h] = this._drawSingleBar(color, bar, data, { w: this.w / 2.5 });

		const yMax = this.h - h;
		const lMargin = 1 / 20;

		switch (limb) {
			case "head":
				bar.position.set((0.25 + lMargin) * this.w, 0);
				break;
			case "lArm":
				bar.position.set(lMargin * this.w, yMax * 0.25);
				break;
			case "rArm":
				bar.position.set((0.5 + lMargin) * this.w, yMax * 0.25);
				break;
			case "torso":
				bar.position.set((0.25 + lMargin) * this.w, yMax * 0.5);
				break;
			case "reactor":
				bar.position.set((0.25 + lMargin) * this.w, yMax * 0.75);
				break;
			case "lLeg":
				bar.position.set(lMargin * this.w, yMax);
				break;
			case "rLeg":
				bar.position.set((0.5 + lMargin) * this.w, yMax);
				break;

			default:
				break;
		}
	}

	_drawSingleBar(color, bar, data, { w, h } = {}) {
		const val = Number(data.value);
		const pct = Math.clamped(val, 0, data.max) / data.max;

		// Determine sizing
		h = h || Math.max(canvas.dimensions.size / 12, 8);
		w = w || this.w;
		const bs = Math.clamped(h / 8, 1, 2);
		if (this.document.height >= 2) h *= 1.6; // Enlarge the bar for large tokens

		// Determine the color to use
		const blk = 0x000000;

		// Draw the bar
		bar.clear();
		bar.beginFill(blk, 0.5).lineStyle(bs, blk, 1.0).drawRoundedRect(0, 0, w, h, 3);
		bar.beginFill(color, 1.0)
			.lineStyle(bs, blk, 1.0)
			.drawRoundedRect(0, 0, pct * w, h, 2);

		return [h, w];
	}
}
