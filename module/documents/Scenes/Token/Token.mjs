import { SyncTransformObject } from "./SyncTransformObject";

export class MetalSaviorsToken extends Token {
	constructor(...args) {
		super(...args);

		this.facing = new SyncTransformObject(this);
		this.weaponRange = new SyncTransformObject(this);
	}

	/** @override */
	async draw() {
		await super.draw();

		this._drawFacing();
		this._drawWeaponRange();
		return this;
	}

	_drawFacing() {
		if (!this.facing.parent) canvas.gridOverlay.facings.addChild(this.facing);

		this.facing.removeChildren();
		this.facing.addChild(this._createFacingOverlay());

		return this.facing;
	}

	_drawWeaponRange() {}

	_createFacingOverlay() {
		this.facingOverlay = this.facingOverlay || new PIXI.Graphics();

		const d = canvas.dimensions;

		const sin = 1 / 2;
		const cos = Math.sqrt(3) / 2;
		const tiles = game.settings.get("metalsaviors", "facingOverlayLength");
		const transparency = game.settings.get("metalsaviors", "facingOverlayOpacity") / 100;

		if (!tiles || !transparency) return this.facingOverlay;

		let magnitude = Math.max(tiles + 0.5, 0) * d.size;
		if ([4, 5].includes(canvas.scene.data.gridType)) {
			magnitude *= Math.sqrt(3) / 2;
		}

		const x = magnitude * cos;
		const y = magnitude * sin;

		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			Math.PI / 6,
			this._getBorderColor() || 0x000000,
			transparency
		);
		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			(5 * Math.PI) / 6,
			this._getBorderColor() || 0x000000,
			transparency
		);
		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			(7 * Math.PI) / 6,
			this._getBorderColor() || 0x000000,
			transparency
		);
		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			(11 * Math.PI) / 6,
			this._getBorderColor() || 0x000000,
			transparency
		);

		this.facingOverlay.position.x = this.bounds.width / 2;
		this.facingOverlay.position.y = this.bounds.height / 2;
		this.facingOverlay.rotation = this.icon.rotation;

		return this.facingOverlay;
	}

	_drawWeaponRange() {
		if (!this.weaponRange.parent) canvas.gridOverlay.ranges.addChild(this.weaponRange);

		this.weaponRange.removeChildren();
		this.weaponRange.addChild(this._createWeaponRangeOverlay());

		return this.weaponRange;
	}

	_createWeaponRangeOverlay() {
		const poly = canvas.grid.grid.getPolygon(0, 0);

		this.weaponRangeOverlay = new PIXI.Graphics();

		this.weaponRangeOverlay.beginFill(0x123456, 1);
		this.weaponRangeOverlay.drawShape(poly).endFill();

		this.weaponRangeOverlay.position.x = this.bounds.width / 2;
		this.weaponRangeOverlay.position.y = this.bounds.height / 2;

		return this.weaponRangeOverlay;
	}

	refresh() {
		super.refresh();
		if (this.facing && this.facingOverlay) this._refreshFacing();

		if (this.weaponRange && this.weaponRangeOverlay) this._refreshWeaponRange();
		return this;
	}

	_refreshFacing() {
		this.facingOverlay.clear();

		const isTargetted = Array.from(this.targeted).some((u) => u === game.user);

		if (!(this._hover || this._controlled || isTargetted)) return;

		this._drawFacing();
	}

	_refreshWeaponRange() {
		this.weaponRangeOverlay.clear();
	}

	destroy(options) {
		this.facing.destroy();
		this.weaponRange.destroy();
		return super.destroy(options);
	}
}

function drawRotatedRoundedRect(graphic, x, y, width, height, radius, angle = 0) {
	if (width < 2 * radius) return;
	if (height < 2 * radius) return;

	const rotMatrixTranspose = [
		[Math.cos(angle), Math.sin(angle)],
		[-Math.sin(angle), Math.cos(angle)],
	];
	const pointMatrixTranspose = [
		[radius, 0],

		[width, 0],
		[width, radius],

		[width, height],
		[width - radius, height],

		[0, height],
		[0, height - radius],

		[0, 0],
		[radius, 0],
	];

	const rotatedPoints = matrixMultiplication(pointMatrixTranspose, rotMatrixTranspose);

	graphic.moveTo(x + rotatedPoints[0][0], y + rotatedPoints[0][1]);
	for (let i = 0; i < 4; i++) {
		const point1 = rotatedPoints[2 * i + 1];
		const point2 = rotatedPoints[2 * i + 2];
		graphic.arcTo(x + point1[0], y + point1[1], x + point2[0], y + point2[1], radius);
	}
}

function matrixMultiplication(matrix1, matrix2) {
	// matrix 1: m x p, matrix 2: p x n, result: m x n
	if (!matrix1.every((row) => row.length === matrix2.length)) throw Error("Matrices not of conforming sizes");
	const m = matrix1.length;
	const n = matrix2[0].length;
	const p = matrix2.length;
	const result = new Array(m).fill().map((x) => new Array(n).fill(0));

	for (let i = 0; i < m; i++) {
		for (let j = 0; j < n; j++) {
			for (let k = 0; k < p; k++) {
				result[i][j] += matrix1[i][k] * matrix2[k][j];
			}
		}
	}

	return result;
}

function drawDottedLine(graphic, length, width, angle, color, alpha) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	let totalLength = 0;
	const spaceLength = 20;
	const solidLength = 60;
	while (totalLength < length) {
		const x = totalLength * cos + (width / 2) * sin;
		const y = totalLength * sin - (width / 2) * cos;
		const segmentLength = Math.min(length - totalLength, solidLength);
		totalLength += segmentLength;

		graphic.beginFill(color, alpha);
		graphic.lineStyle(0);
		drawRotatedRoundedRect(graphic, x, y, segmentLength, width, width / 3, angle);
		graphic.endFill();

		totalLength += spaceLength;
	}
}
