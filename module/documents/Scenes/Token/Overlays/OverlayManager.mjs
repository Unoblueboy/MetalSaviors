import { SyncTransformObject } from "../SyncTransformObject.mjs";

export class OverlayManager {
	constructor(object) {
		this.object = object;
		this.container = new SyncTransformObject(object);
		this.overlay = null;
	}

	setupContainerParent() {
		throw new Error("method setupContainerParent not Implemented");
	}

	draw() {
		if (!this.container.parent) this.setupContainerParent();

		this.container.removeChildren();
		this.container.addChild(this.createOverlay());

		return this.container;
	}

	createOverlay() {
		throw new Error("method createOverlay not Implemented");
	}

	refresh() {
		if (!this.container || !this.overlay) return;

		this.overlay.clear();

		if (!this.containerIsActive()) return;

		this.draw();
	}

	containerIsActive() {
		throw new Error("method containerIsActive not Implemented");
	}

	destroy() {
		this.container.destroy();
	}
}
