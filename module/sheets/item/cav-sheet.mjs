/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsCavSheet extends ItemSheet {
	/** @override */
	get template() {
		const path = "systems/metalsaviors/templates/item/cav";
		return `${path}/cav-sheet.hbs`;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			width: 800,
			height: 700,
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		const itemData = context.item.data;

		context.data = foundry.utils.deepClone(itemData.data);

		return context;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		html.find(".cav-skill-name input").change((ev) => {
			const newName = ev.target.value;
			const prevName = $(ev.target).parents(".cav-skill-name").data("prevName");

			if (newName === prevName) {
				return;
			}
			const bonus = this.item.data.data.cavUnitPiloting[prevName];
			this.item.update({
				[`data.cavUnitPiloting.${newName}`]: bonus,
				[`data.cavUnitPiloting.-=${prevName}`]: null,
			});
		});
		html.find(".add-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".add-cav-unit-skill");
			const newName = $(curTarget).siblings(".add-cav-unit-skill-name").children("input").first().val();
			const newValue = $(curTarget).siblings(".add-cav-unit-skill-value").children("input").first().val();

			if (!newName || !newValue) {
				return;
			}

			const cavUnitPilotingSkills = Object.keys(this.item.data.data.cavUnitPiloting);
			if (cavUnitPilotingSkills.includes(newName)) {
				return;
			}

			const bonus = Number.parseInt(newValue);
			if (!bonus) {
				return;
			}

			this.item.update({
				[`data.cavUnitPiloting.${newName}`]: bonus,
			});
		});
		html.find(".delete-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".delete-cav-unit-skill");
			const cavSkillName = curTarget.siblings(".cav-skill-name").children("input").val();
			this.item.update({
				[`data.cavUnitPiloting.-=${cavSkillName}`]: null,
			});
		});

		html.find(".cav-trait-name input").change((ev) => {
			const newName = ev.target.value;
			const prevName = $(ev.target).parents(".cav-trait-name").data("prevName");

			if (newName === prevName) {
				return;
			}
			const bonus = this.item.data.data.traits[prevName];
			this.item.update({
				[`data.traits.${newName}`]: bonus,
				[`data.traits.-=${prevName}`]: null,
			});
		});
		html.find(".add-cav-trait").click((ev) => {
			const curTarget = $(ev.target).parents(".add-cav-trait");
			const newName = $(curTarget).siblings(".add-cav-trait-name").children("input").first().val();
			const newValue = $(curTarget).siblings(".add-cav-trait-value").children("textarea").first().val();

			if (!newName || !newValue) {
				return;
			}

			const traits = Object.keys(this.item.data.data.traits);
			if (traits.includes(newName)) {
				return;
			}

			const traitDescription = newValue;
			if (!traitDescription) {
				return;
			}

			this.item.update({
				[`data.traits.${newName}`]: traitDescription,
			});
		});
		html.find(".delete-cav-trait").click((ev) => {
			const curTarget = $(ev.target).parents(".delete-cav-trait");
			const traitName = curTarget.siblings(".cav-trait-name").children("input").val();
			this.item.update({
				[`data.traits.-=${traitName}`]: null,
			});
		});
	}
}
