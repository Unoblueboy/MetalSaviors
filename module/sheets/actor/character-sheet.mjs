import { CharacterType as CharacterTypes } from "../../documents/Actor/actor.mjs";
import { prepareActiveEffectCategories } from "../../helpers/effects.mjs";
import { MetalSaviorsActorSheet } from "./actor-sheet.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MetalSaviorsCharacterSheet extends MetalSaviorsActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: "form",
					initial: "summary",
				},
			],
			submitOnChange: false,
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-${this.actor.type}-sheet.hbs`;
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
		const actorSystem = this.actor.system;
		const actorFlags = this.actor.flags;

		// Add the actor's data to context.system for easier access, as well as flags.
		context.system = actorSystem;
		context.flags = actorFlags;

		// Add some rendering options to the context
		this.renderOptions = this.renderOptions ?? {
			isEditing: false,
		};
		context.renderOptions = this.renderOptions;

		this._prepareItems(context);
		this._prepareCharacterData(context);
		this._prepareCavData(context);

		// Add roll data for TinyMCE editors.
		context.rollData = context.actor.getRollData();

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.actor.effects);

		// Pass in config for localisation
		context.CONFIG = CONFIG.METALSAVIORS;

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
		for (let [k] of Object.entries(context.system.attributes)) {
			context.attributeLabels[k] = game.i18n.localize(CONFIG.METALSAVIORS.attributes[k]) ?? k;
		}

		for (const [key, derivedAttribute] of Object.entries(context.system.derivedAttributes)) {
			derivedAttribute.label = game.i18n.localize(CONFIG.METALSAVIORS.derivedAttributes[key]) ?? key;
		}

		context.characterTypes = CharacterTypes;
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
		const weapons = [];
		const concepts = {};

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
					weapons.push(i);
					break;
				case "concept":
					concepts[i._id] = i;
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
		context.concepts = concepts;
	}

	_prepareCavData(context) {
		context.cavs = this.actor.getCavs().map((cav) => ({
			id: cav.id,
			name: cav.name,
			model: cav.system.model,
		}));
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.find(".item-edit").click((ev) => {
			const parent = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(parent.data("itemId"));
			item.sheet.render(true);
		});

		html.find(".cav-show").click((ev) => {
			const parent = $(ev.currentTarget).parents(".cav");
			const cav = game.actors.get(parent.data("cavId"));
			cav.sheet.render(true);
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Delete Inventory Item
		html.find(".item-delete").click(this._onItemDelete.bind(this));

		// Add Inventory Item
		html.find(".item-create").click(this._onItemCreate.bind(this));

		// Rollable abilities.
		html.find(".rollable").click(this._onRoll.bind(this));

		html.find(".exit-submit").mouseleave((event) => {
			const form = $(event.target).closest("form");
			if (form) {
				this.submit();
			}
		});

		html.find(".character-type-select").change(async (ev) => {
			const element = ev.target;
			await this.actor.setCharacterType(element.value);
			this.render();
		});

		html.find(".cur-weapon-select").click(async (ev) => {
			const li = $(ev.currentTarget).closest(".item");
			const weaponId = li.data("itemId");
			const weapon = this.actor.items.get(weaponId);
			if (weapon === this.actor.getCurWeapon()) {
				this.actor.setCurWeapon(null);
			} else {
				this.actor.setCurWeapon(weapon);
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

		this.submit(event);
	}

	async _onItemDelete(event) {
		const li = $(event.currentTarget).closest(".item");
		const item = this.actor.items.get(li.data("itemId"));
		const response = await Dialog.confirm({
			title: "Delete Item",
			content: `<p>Do you want to delete the ${item.type} <b>${item.name}</b>?</p>`,
		});

		if (response) {
			item.delete();
		}
		li.slideUp(200, () => this.render(false));
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
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
