import { MetalSaviorsAbstractItemSheet } from "./abstract-item-sheet.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsSkillSheet extends MetalSaviorsAbstractItemSheet {
	/** @override */
	get template() {
		const path = "systems/metalsaviors/templates/item/skill";
		return `${path}/skill-${this.item.type}-sheet.hbs`;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			height: 350,
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Retrieve the roll data for TinyMCE editors.
		context.rollData = {};
		let actor = this.object?.parent ?? null;
		if (actor) {
			context.rollData = actor.getRollData();
		}

		context.system = foundry.utils.deepClone(this.item.system);

		// Add localisation data for attributeSkills
		this._prepareAtbSkills(context);

		// Add some rendering options to the context
		this.renderOptions = this.renderOptions ?? {
			isEditing: false,
		};
		context.renderOptions = this.renderOptions;

		return context;
	}

	_prepareAtbSkills(context) {
		if (this.item.type !== "atbSkill") return;
		for (const [attribute, bonus] of Object.entries(context.system.attributeBonuses)) {
			context.system.attributeBonuses[attribute] = {
				value: bonus,
			};
			context.system.attributeBonuses[attribute].label =
				game.i18n.localize(CONFIG.METALSAVIORS.attributes[attribute]) ?? attribute;
		}

		for (const [derivedAttribute, bonus] of Object.entries(context.system.derivedAttributeBonuses)) {
			context.system.derivedAttributeBonuses[derivedAttribute] = {
				value: bonus,
			};
			context.system.derivedAttributeBonuses[derivedAttribute].label =
				game.i18n.localize(CONFIG.METALSAVIORS.derivedAttributes[derivedAttribute]) ?? derivedAttribute;
		}
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Roll handlers, click handlers, etc. would go here.
		html.find(".delete-skill-bonus").click((ev) => {
			const dataset = ev.currentTarget.dataset;
			const skillName = dataset.skillName;
			this.item.update({
				[`system.skillBonuses.-=${skillName}`]: "Yeeted",
			});
		});

		html.find(".add-skill-bonus").click((ev) => {
			const target = ev.currentTarget;
			const input = $(target).parent().parent().find("td input")[0];
			const inpValue = input?.value;

			if (!inpValue || inpValue === "") {
				return;
			}

			this.item.update({ [`system.skillBonuses.${inpValue}`]: 0 });
		});
	}
}
