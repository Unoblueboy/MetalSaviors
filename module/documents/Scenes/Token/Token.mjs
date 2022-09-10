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
}
