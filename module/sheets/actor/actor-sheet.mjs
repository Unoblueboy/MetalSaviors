import { onManageActiveEffect, prepareActiveEffectCategories } from "../../helpers/effects.mjs";

import { generateSkillKey } from "../../helpers/KeyGenerator.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MetalSaviorsActorSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: "form",
					initial: "pilot",
				},
			],
			submitOnChange: false,
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-${this.actor.data.type}-sheet.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = this.actor.data.toObject(false);

		// Add the actor's data to context.data for easier access, as well as flags.
		context.data = actorData.data;
		context.flags = actorData.flags;

		// Add some rendering options to the context
		this.renderOptions = this.renderOptions ?? {
			isEditing: false,
		};
		context.renderOptions = this.renderOptions;

		// Prepare character data and items.
		if (actorData.type == "character") {
			this._prepareItems(context);
			this._prepareCharacterData(context);
		}

		// Prepare NPC data and items.
		if (actorData.type == "npc") {
			this._prepareItems(context);
		}

		// Add roll data for TinyMCE editors.
		context.rollData = context.actor.getRollData();

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.actor.effects);

		return context;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareCharacterData(context) {
		// Handle ability scores.
		context.attributeLabels = {};
		for (let [k, v] of Object.entries(context.data.attributes)) {
			context.attributeLabels[k] = game.i18n.localize(CONFIG.METALSAVIORS.attributes[k]) ?? k;
		}

		for (const [key, derivedAttribute] of Object.entries(context.data.derivedAttributes)) {
			derivedAttribute.label = game.i18n.localize(CONFIG.METALSAVIORS.derivedAttributes[key]) ?? key;
		}
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		const features = [];
		const skills = {
			learnedSkills: {},
			atbSkills: {},
			weaponProficiencies: {},
		};
		const pilotLicenses = {};
		const cavs = [];
		let combatTraining = null;
		const weapons = {
			pilot: [],
			cav: Object.fromEntries(this.actor.getCavs().map((cav) => [cav.id, []])),
		};

		// Iterate through items, allocating to containers
		for (let i of context.items) {
			i.img = i.img || DEFAULT_TOKEN;
			// Append to gear.
			switch (i.type) {
				case "item":
					gear.push(i);
					break;
				case "feature":
					features.push(i);
					break;
				case "learnedSkill":
					skills.learnedSkills[i._id] = i;
					break;
				case "atbSkill":
					skills.atbSkills[i._id] = i;
					break;
				case "combatTraining":
					combatTraining = i;
					break;
				case "weaponProficiency":
					skills.weaponProficiencies[i._id] = i;
					break;
				case "pilotLicense":
					pilotLicenses[i._id] = i;
					break;
				case "cav":
					cavs.push(i);
					break;
				case "weapon":
					let weaponList;

					const item = this.actor.data.items.get(i._id);
					const owner = item.getFlag("metalsaviors", "owner");

					if (!owner) {
						break;
					}

					weaponList = owner.type === "cav" ? weapons.cav[owner.id] : weapons[owner.type];

					weaponList.push(i);
					break;
			}
		}

		// Assign and return
		context.gear = gear;
		context.features = features;
		context.skills = skills;
		context.combatTraining = combatTraining;
		context.pilotLicenses = pilotLicenses;
		context.cavs = cavs;
		context.weapons = weapons;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.find(".item-edit").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find(".item-delete").click((ev) => {
			const li = $(ev.currentTarget).closest(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		html.find(".cav-data").change((ev) => {
			const itemPath = ev.target.dataset.itemPath;
			const updateValue = ev.target.value;
			const itemContainer = $(ev.target).parents(".item");

			const item = this.actor.items.get(itemContainer.data("itemId"));
			item.update({ [`${itemPath}`]: updateValue });
		});

		// Rollable abilities.
		html.find(".rollable").click(this._onRoll.bind(this));

		html.find(".exit-submit").mouseleave((event) => {
			const form = $(event.target).closest("form");
			if (form) {
				form.submit();
			}
		});

		// Drag events for macros.
		if (this.actor.owner) {
			let handler = (ev) => this._onDragStart(ev);
			html.find("li.item").each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}
	}

	/** @override */
	async _onChangeInput(event) {
		const el = event.target;
		if (!el.classList.contains("update-actor")) {
			return;
		}

		this._onSubmit(event);
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		// Handle item rolls.
		if (dataset.rollType) {
			if (dataset.rollType == "item") {
				const itemId = element.closest(".item").dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll(event);
			}

			if (dataset.rollType == "atb") {
				this.actor.rollAttribute(event);
				return;
			}
		}

		// Handle rolls that supply the formula directly.
		if (dataset.roll) {
			let label = dataset.label ? `[roll] ${dataset.label}` : "";
			let roll = new Roll(dataset.roll, this.actor.getRollData());
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label,
				rollMode: game.settings.get("core", "rollMode"),
			});
			return roll;
		}
	}
}
