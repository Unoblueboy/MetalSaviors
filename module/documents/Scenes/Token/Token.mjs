import { SyncTransformObject } from "./SyncTransformObject.mjs";

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
		this.weaponRangeOverlay = this.weaponRangeOverlay || new PIXI.Graphics();

		const weaponRange = 1;

		const pointCloseBoundary = Math.max(Math.floor(weaponRange / 4), 1);
		const closeMediumBoundary = Math.max(Math.floor(weaponRange / 2), pointCloseBoundary);
		const mediumLongBoundary = Math.max(weaponRange - 1, closeMediumBoundary);
		const longExtremeBoundary = Math.max(2 * weaponRange, mediumLongBoundary);

		// Draw Point Blank Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			(x, y) => canvas.grid.grid.getPolygon(x, y),
			{
				gridSize: 100,
				innerRadius: 1,
				outerRadius: pointCloseBoundary,
			},
			{ color: 0xff0000, alpha: 0.5 }
		);

		// Draw Close Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			(x, y) => canvas.grid.grid.getPolygon(x, y),
			{
				gridSize: 100,
				innerRadius: pointCloseBoundary + 1,
				outerRadius: closeMediumBoundary,
			},
			{ color: 0x00ff00, alpha: 0.5 }
		);

		// Draw Medium Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			(x, y) => canvas.grid.grid.getPolygon(x, y),
			{
				gridSize: 100,
				innerRadius: closeMediumBoundary + 1,
				outerRadius: mediumLongBoundary,
			},
			{ color: 0x0000ff, alpha: 0.5 }
		);

		// Draw Long Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			(x, y) => canvas.grid.grid.getPolygon(x, y),
			{
				gridSize: 100,
				innerRadius: mediumLongBoundary + 1,
				outerRadius: longExtremeBoundary,
			},
			{ color: 0x000000, alpha: 0.5 }
		);

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

		if (!(this._hover || this._controlled) || !this.isOwner) return;

		this._drawWeaponRange();
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

function highlightConcentricHexagons(
	graphic,
	polygonGenerator,
	{ gridSize = 100, innerRadius = 0, outerRadius = 5 } = {},
	{ color = 0x123456, alpha = 0.5 }
) {
	const gridWidth = gridSize;
	const gridHeight = (gridSize * Math.sqrt(3)) / 2;
	for (let ring = innerRadius; ring <= outerRadius; ring++) {
		if (ring === 0) {
			const polygon = polygonGenerator(0, 0);
			graphic.beginFill(color, alpha).drawPolygon(polygon).endFill();
			continue;
		}

		const x1 = 0.75 * gridWidth * ring;
		const x2 = 0;
		const y1 = (gridHeight * ring) / 2;
		const y2 = gridHeight * ring;

		const polygon1 = polygonGenerator(x1, y1);
		const polygon2 = polygonGenerator(x1, -y1);
		const polygon3 = polygonGenerator(x2, -y2);
		const polygon4 = polygonGenerator(-x1, -y1);
		const polygon5 = polygonGenerator(-x1, y1);
		const polygon6 = polygonGenerator(-x2, y2);

		for (let i = 0; i < ring; i++) {
			const newPolygon1 = polygon1.map((val, index) => (index % 2 === 0 ? val : val - gridHeight * i));
			const newPolygon2 = polygon2.map((val, index) =>
				index % 2 === 0 ? val - 0.75 * gridWidth * i : val - 0.5 * gridHeight * i
			);
			const newPolygon3 = polygon3.map((val, index) =>
				index % 2 === 0 ? val - 0.75 * gridWidth * i : val + 0.5 * gridHeight * i
			);
			const newPolygon4 = polygon4.map((val, index) => (index % 2 === 0 ? val : val + gridHeight * i));
			const newPolygon5 = polygon5.map((val, index) =>
				index % 2 === 0 ? val + 0.75 * gridWidth * i : val + 0.5 * gridHeight * i
			);
			const newPolygon6 = polygon6.map((val, index) =>
				index % 2 === 0 ? val + 0.75 * gridWidth * i : val - 0.5 * gridHeight * i
			);
			graphic.beginFill(color, alpha).drawPolygon(newPolygon1).endFill();
			graphic.beginFill(color, alpha).drawPolygon(newPolygon2).endFill();
			graphic.beginFill(color, alpha).drawPolygon(newPolygon3).endFill();
			graphic.beginFill(color, alpha).drawPolygon(newPolygon4).endFill();
			graphic.beginFill(color, alpha).drawPolygon(newPolygon5).endFill();
			graphic.beginFill(color, alpha).drawPolygon(newPolygon6).endFill();
		}
	}
}
