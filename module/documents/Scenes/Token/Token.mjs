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
		const opacity = game.settings.get("metalsaviors", "facingOverlayOpacity") / 100;

		if (!tiles || !opacity) return this.facingOverlay;

		let magnitude = Math.max(tiles + 0.5, 0) * d.size;
		if ([4, 5].includes(canvas.scene.data.gridType)) {
			magnitude *= Math.sqrt(3) / 2;
		}

		const x = magnitude * cos;
		const y = magnitude * sin;

		drawDottedLine(this.facingOverlay, magnitude, 10, Math.PI / 6, this._getBorderColor() || 0x000000, opacity);
		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			(5 * Math.PI) / 6,
			this._getBorderColor() || 0x000000,
			opacity
		);
		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			(7 * Math.PI) / 6,
			this._getBorderColor() || 0x000000,
			opacity
		);
		drawDottedLine(
			this.facingOverlay,
			magnitude,
			10,
			(11 * Math.PI) / 6,
			this._getBorderColor() || 0x000000,
			opacity
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

		const curWeapon = this.actor?.getCurWeapon();

		if (!curWeapon) return this.weaponRangeOverlay;

		const weaponRange = curWeapon.range;

		const pointCloseBoundary = 1;
		const closeMediumBoundary = Math.max(Math.floor(weaponRange / 2), pointCloseBoundary);
		const mediumLongBoundary = Math.max(weaponRange - 1, closeMediumBoundary);
		const longExtremeBoundary = Math.max(2 * weaponRange, mediumLongBoundary);

		const gridSize = canvas.dimensions.size;
		const opacity = game.settings.get("metalsaviors", "weaponRangeOverlayOpacity") / 100;

		if (canvas.grid.grid instanceof HexagonalGrid) {
			const polygonGenerator = (x, y) => canvas.grid.grid.getPolygon(x, y);
			const gridUseColumns = canvas.grid.grid.columns;
			this.drawHexagonalWeaponRangeOverlay(
				gridSize,
				gridUseColumns,
				opacity,
				polygonGenerator,
				pointCloseBoundary,
				closeMediumBoundary,
				mediumLongBoundary,
				longExtremeBoundary
			);
		} else if (canvas.grid.grid instanceof SquareGrid) {
			this.drawSquareWeaponRangeOverlay(
				gridSize,
				opacity,
				pointCloseBoundary,
				closeMediumBoundary,
				mediumLongBoundary,
				longExtremeBoundary
			);
		} else {
			this.drawGridlessWeaponRangeOverlay(
				gridSize,
				opacity,
				pointCloseBoundary,
				closeMediumBoundary,
				mediumLongBoundary,
				longExtremeBoundary
			);
		}

		return this.weaponRangeOverlay;
	}

	drawHexagonalWeaponRangeOverlay(
		gridSize,
		gridUseColumns,
		opacity,
		polygonGenerator,
		pointCloseBoundary,
		closeMediumBoundary,
		mediumLongBoundary,
		longExtremeBoundary
	) {
		// Draw Point Blank Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			polygonGenerator,
			{
				gridSize: gridSize,
				useColumns: gridUseColumns,
				innerRadius: 1,
				outerRadius: pointCloseBoundary,
			},
			{ color: 0xff0000, alpha: opacity }
		);

		// Draw Close Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			polygonGenerator,
			{
				gridSize: gridSize,
				useColumns: gridUseColumns,
				innerRadius: pointCloseBoundary + 1,
				outerRadius: closeMediumBoundary,
			},
			{ color: 0x00ff00, alpha: opacity }
		);

		// Draw Medium Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			polygonGenerator,
			{
				gridSize: gridSize,
				useColumns: gridUseColumns,
				innerRadius: closeMediumBoundary + 1,
				outerRadius: mediumLongBoundary,
			},
			{ color: 0x0000ff, alpha: opacity }
		);

		// Draw Long Range
		highlightConcentricHexagons(
			this.weaponRangeOverlay,
			polygonGenerator,
			{
				gridSize: gridSize,
				useColumns: gridUseColumns,
				innerRadius: mediumLongBoundary + 1,
				outerRadius: longExtremeBoundary,
			},
			{ color: 0x000000, alpha: opacity }
		);
	}

	drawSquareWeaponRangeOverlay(
		gridSize,
		opacity,
		pointCloseBoundary,
		closeMediumBoundary,
		mediumLongBoundary,
		longExtremeBoundary
	) {
		// Draw Point Blank Range
		highlightConcentricSquares(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: 1,
				outerRadius: pointCloseBoundary,
			},
			{ color: 0xff0000, alpha: opacity }
		);

		// Draw Close Range
		highlightConcentricSquares(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: pointCloseBoundary + 1,
				outerRadius: closeMediumBoundary,
			},
			{ color: 0x00ff00, alpha: opacity }
		);

		// Draw Medium Range
		highlightConcentricSquares(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: closeMediumBoundary + 1,
				outerRadius: mediumLongBoundary,
			},
			{ color: 0x0000ff, alpha: opacity }
		);

		// Draw Long Range
		highlightConcentricSquares(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: mediumLongBoundary + 1,
				outerRadius: longExtremeBoundary,
			},
			{ color: 0x000000, alpha: opacity }
		);
	}

	drawGridlessWeaponRangeOverlay(
		gridSize,
		opacity,
		pointCloseBoundary,
		closeMediumBoundary,
		mediumLongBoundary,
		longExtremeBoundary
	) {
		// Draw Point Blank Range
		highlightConcentricCircle(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: 0,
				outerRadius: pointCloseBoundary,
			},
			{ color: 0xff0000, alpha: opacity }
		);

		// Draw Close Range
		highlightConcentricCircle(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: pointCloseBoundary,
				outerRadius: closeMediumBoundary,
			},
			{ color: 0x00ff00, alpha: opacity }
		);

		// Draw Medium Range
		highlightConcentricCircle(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: closeMediumBoundary,
				outerRadius: mediumLongBoundary + 1,
			},
			{ color: 0x0000ff, alpha: opacity }
		);

		// Draw Long Range
		highlightConcentricCircle(
			this.weaponRangeOverlay,
			{
				gridSize: gridSize,
				innerRadius: mediumLongBoundary + 1,
				outerRadius: longExtremeBoundary,
			},
			{ color: 0x000000, alpha: opacity }
		);
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
	{ gridSize = 100, useColumns = true, innerRadius = 0, outerRadius = 5 } = {},
	{ color = 0x123456, alpha = 0.5 }
) {
	let gridWidth, gridHeight;
	if (useColumns) {
		gridWidth = gridSize;
		gridHeight = (gridSize * Math.sqrt(3)) / 2;
	} else {
		gridWidth = (gridSize * Math.sqrt(3)) / 2;
		gridHeight = gridSize;
	}

	for (let ring = innerRadius; ring <= outerRadius; ring++) {
		if (ring === 0) {
			const polygon = polygonGenerator(0, 0);
			graphic.beginFill(color, alpha).drawPolygon(polygon).endFill();
			continue;
		}

		let { polygon1, polygon2, polygon3, polygon4, polygon5, polygon6 } = getCornerHexagons(
			useColumns,
			gridWidth,
			gridHeight,
			ring,
			polygonGenerator
		);

		let arrayOfPolygons = [polygon1, polygon2, polygon3, polygon4, polygon5, polygon6];

		drawLinearInterpolatedRing(ring, arrayOfPolygons, graphic, color, alpha);
	}
}

function getCornerHexagons(useColumns, gridWidth, gridHeight, ring, polygonGenerator) {
	let polygon1, polygon2, polygon3, polygon4, polygon5, polygon6;

	if (useColumns) {
		const x1 = 0.75 * gridWidth * ring;
		const x2 = 0;
		const y1 = (gridHeight * ring) / 2;
		const y2 = gridHeight * ring;

		polygon1 = polygonGenerator(x1, y1);
		polygon2 = polygonGenerator(x1, -y1);
		polygon3 = polygonGenerator(x2, -y2);
		polygon4 = polygonGenerator(-x1, -y1);
		polygon5 = polygonGenerator(-x1, y1);
		polygon6 = polygonGenerator(-x2, y2);
	} else {
		const x1 = 1 * gridWidth * ring;
		const x2 = 0.5 * gridWidth * ring;
		const y1 = 0;
		const y2 = 0.75 * gridHeight * ring;

		polygon1 = polygonGenerator(x1, y1);
		polygon2 = polygonGenerator(x2, -y2);
		polygon3 = polygonGenerator(-x2, -y2);
		polygon4 = polygonGenerator(-x1, -y1);
		polygon5 = polygonGenerator(-x2, y2);
		polygon6 = polygonGenerator(x2, y2);
	}
	return { polygon1, polygon2, polygon3, polygon4, polygon5, polygon6 };
}

function linearInterpolatePolygons(polygon1, polygon2, t) {
	if (polygon1.length != polygon2.length) {
		throw new Error("Error Interpolating Polygons, both polygons must have the same number of points");
	}

	if (t < 0 || t > 1) {
		throw new Error(`Error Interpolating Polygons, t = ${t} must be between 0 and 1`);
	}

	var newPolygon = [];

	for (let i = 0; i < polygon1.length; i++) {
		const ordinate1 = polygon1[i];
		const ordinate2 = polygon2[i];
		const newOrdinate = (1 - t) * ordinate1 + t * ordinate2;
		newPolygon.push(newOrdinate);
	}

	return newPolygon;
}

function drawLinearInterpolatedRing(ringSize, arrayOfPolygons, graphic, color, alpha) {
	const numOfPolygons = arrayOfPolygons.length;

	for (let i = 0; i < ringSize; i++) {
		for (let j = 0; j < numOfPolygons; j++) {
			const poly1 = arrayOfPolygons[j];
			const poly2 = arrayOfPolygons[(j + 1) % numOfPolygons];
			const newPolygon = linearInterpolatePolygons(poly1, poly2, i / ringSize);
			graphic.beginFill(color, alpha).drawPolygon(newPolygon).endFill();
		}
	}
}

function highlightConcentricSquares(
	graphic,
	{ gridSize = 100, innerRadius = 0, outerRadius = 5 } = {},
	{ color = 0x123456, alpha = 0.5 }
) {
	const polygonGenerator = (x, y) => [x, y, x, y + gridSize, x + gridSize, y + gridSize, x + gridSize, y, x, y];

	for (let ring = innerRadius; ring <= outerRadius; ring++) {
		if (ring === 0) {
			const polygon = polygonGenerator(0, 0);
			graphic.beginFill(color, alpha).drawPolygon(polygon).endFill();
			continue;
		}

		let { polygon1, polygon2, polygon3, polygon4 } = getCornerSquares(gridSize, ring, polygonGenerator);

		let arrayOfPolygons = [polygon1, polygon2, polygon3, polygon4];

		drawLinearInterpolatedRing(2 * ring, arrayOfPolygons, graphic, color, alpha);
	}
}

function getCornerSquares(gridSize, ring, polygonGenerator) {
	let polygon1, polygon2, polygon3, polygon4;

	const x1 = gridSize * ring;
	const y1 = gridSize * ring;

	polygon1 = polygonGenerator(x1, y1);
	polygon2 = polygonGenerator(x1, -y1);
	polygon3 = polygonGenerator(-x1, -y1);
	polygon4 = polygonGenerator(-x1, y1);

	return { polygon1, polygon2, polygon3, polygon4 };
}

function highlightConcentricCircle(
	graphic,
	{ gridSize = 100, innerRadius = 0, outerRadius = 5 } = {},
	{ color = 0x123456, alpha = 0.5 }
) {
	if (outerRadius <= innerRadius) {
		return;
	}

	const x = gridSize / 2;
	const y = gridSize / 2;

	graphic
		.beginFill(color, alpha)
		.drawCircle(x, y, outerRadius * gridSize)
		.endFill();

	if (innerRadius > 0) {
		graphic
			.beginHole()
			.drawCircle(x, y, innerRadius * gridSize)
			.endHole();
	}
}
