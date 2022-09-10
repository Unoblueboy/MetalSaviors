import { OverlayManager } from "./OverlayManager.mjs";

export class WeaponRangeManager extends OverlayManager {
	setupContainerParent() {
		canvas.gridOverlay.ranges.addChild(this.container);
	}

	createOverlay() {
		this.overlay = this.overlay || new PIXI.Graphics();

		const curWeapon = this.object.actor?.getCurWeapon();

		if (!curWeapon) return this.overlay;

		const weaponRange = curWeapon.range;

		const pointCloseBoundary = 1;
		const closeMediumBoundary = Math.max(Math.floor(weaponRange / 2), pointCloseBoundary);
		const mediumLongBoundary = Math.max(weaponRange, closeMediumBoundary);
		const longExtremeBoundary = Math.max(2 * weaponRange, mediumLongBoundary);

		const gridSize = canvas.dimensions.size;
		const opacity = game.settings.get("metalsaviors", "weaponRangeOverlayOpacity") / 100;

		if (canvas.grid.grid instanceof HexagonalGrid) {
			const polygonGenerator = (x, y) => canvas.grid.grid.getPolygon(x, y);
			const gridUseColumns = canvas.grid.grid.columnar;
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

		return this.overlay;
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
			this.overlay,
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
			this.overlay,
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
			this.overlay,
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
			this.overlay,
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
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: 1,
				outerRadius: pointCloseBoundary,
			},
			{ color: 0xff0000, alpha: opacity }
		);

		// Draw Close Range
		highlightConcentricSquares(
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: pointCloseBoundary + 1,
				outerRadius: closeMediumBoundary,
			},
			{ color: 0x00ff00, alpha: opacity }
		);

		// Draw Medium Range
		highlightConcentricSquares(
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: closeMediumBoundary + 1,
				outerRadius: mediumLongBoundary,
			},
			{ color: 0x0000ff, alpha: opacity }
		);

		// Draw Long Range
		highlightConcentricSquares(
			this.overlay,
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
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: 0,
				outerRadius: pointCloseBoundary,
			},
			{ color: 0xff0000, alpha: opacity }
		);

		// Draw Close Range
		highlightConcentricCircle(
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: pointCloseBoundary,
				outerRadius: closeMediumBoundary,
			},
			{ color: 0x00ff00, alpha: opacity }
		);

		// Draw Medium Range
		highlightConcentricCircle(
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: closeMediumBoundary,
				outerRadius: mediumLongBoundary,
			},
			{ color: 0x0000ff, alpha: opacity }
		);

		// Draw Long Range
		highlightConcentricCircle(
			this.overlay,
			{
				gridSize: gridSize,
				innerRadius: mediumLongBoundary,
				outerRadius: longExtremeBoundary,
			},
			{ color: 0x000000, alpha: opacity }
		);
	}

	containerIsActive() {
		return (this.object.hover || this.object.controlled) && this.object.isOwner;
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
		gridWidth = (gridSize * 2) / Math.sqrt(3);
		gridHeight = gridSize;
	} else {
		gridWidth = gridSize;
		gridHeight = (gridSize * 2) / Math.sqrt(3);
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

		console.log(x1, x2, y1, y2);

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
