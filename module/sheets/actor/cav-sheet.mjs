// eslint-disable-next-line no-unused-vars
import { MetalSaviorsCav } from "../../documents/Actor/cav.mjs";
import { MetalSaviorsActorSheet } from "./actor-sheet.mjs";

export class MetalSaviorsCavSheet extends MetalSaviorsActorSheet {
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
			submitOnChange: true,
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-${this.actor.type}-sheet.hbs`;
	}

	/**
	 * Returns cav
	 *
	 * @returns {MetalSaviorsCav} cav
	 */
	get cav() {
		return this.actor;
	}

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		context.system = foundry.utils.deepClone(this.cav.system);
		context.flags = foundry.utils.deepClone(this.cav.flags);

		this.preparePilotData(context);
		this._prepareCavData(context);
		this._prepareItems(context);

		return context;
	}

	preparePilotData(context) {
		const pilot = this.cav.pilot;
		context.hasPilot = !!pilot;

		if (!pilot) return;

		context.attributeLabels = {};
		for (let [k] of Object.entries(context.system.attributes)) {
			context.attributeLabels[k] = game.i18n.localize(CONFIG.METALSAVIORS.attributes[k]) ?? k;
		}

		context.pilot = { name: pilot.name };
	}

	_prepareCavData(context) {
		const token = this.actor.getActiveTokens(true, true)[0];
		if (!token) return;

		// The following are only included for tokens
		context.curMovementSpeed = token.combatant?.getCurMovementSpeedKey();
		context.excessMomentum = token.combatant?.getExtraMovementMomentum();
	}

	_prepareItems(context) {
		{
			// Initialize containers.
			const gear = [];
			const weapons = [];
			const modules = [];

			// Iterate through items, allocating to containers
			for (let i of context.items) {
				i.img = i.img || DEFAULT_TOKEN;
				// Append to gear.
				switch (i.type) {
					case "item":
						gear.push(i);
						break;
					case "weapon":
						weapons.push(i);
						break;
					case "module":
						modules.push(i);
						break;
				}
			}

			// Assign and return
			context.gear = gear;
			context.weapons = weapons;
			context.modules = modules;
		}
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		html.find(".item-edit").click((ev) => {
			const parent = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(parent.data("itemId"));
			item.sheet.render(true);
		});

		if (!this.isEditable) return;

		html.find(".item-create").click(this._onItemCreate.bind(this));

		html.find(".item-delete").click(this._onItemDelete.bind(this));

		html.find(".cav-skill-name input").change((ev) => {
			const newName = ev.target.value;
			const prevName = $(ev.target).parents(".cav-skill-name").data("prevName");

			if (newName === prevName) {
				return;
			}
			const bonus = this.cav.system.cavUnitPiloting[prevName];
			this.cav.update({
				[`system.cavUnitPiloting.${newName}`]: bonus,
				[`system.cavUnitPiloting.-=${prevName}`]: null,
			});
		});
		html.find(".add-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".add-cav-unit-skill");
			const newName = $(curTarget).siblings(".add-cav-unit-skill-name").children("input").first().val();
			const newValue = $(curTarget).siblings(".add-cav-unit-skill-value").children("input").first().val();

			if (!newName || !newValue) {
				return;
			}

			const cavUnitPilotingSkills = Object.keys(this.cav.system.cavUnitPiloting);
			if (cavUnitPilotingSkills.includes(newName)) {
				return;
			}

			const bonus = Number.parseInt(newValue);
			if (!bonus) {
				return;
			}

			this.cav.update({
				[`system.cavUnitPiloting.${newName}`]: bonus,
			});
		});
		html.find(".delete-cav-unit-skill").click(this._onCavUnitPilotingDelete.bind(this));

		html.find("button.reset-cav-ownership").click((ev) => {
			if (ev.pointerType === "") return;
			this.cav.deletePilot();
		});

		html.find(".base-model-name").change((ev) => {
			const name = ev.target.value;
			this.cav.update({
				"system.model": name,
			});
		});

		html.find(".accordion-link").click((ev) => {
			const accordion = $(ev.target).parents(".accordion");

			var panel = accordion.next();
			panel.slideToggle();
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

		// Rollable abilities.
		html.find(".rollable").click(this._onRoll.bind(this));
	}

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

	async _onItemDelete(event) {
		const ele = $(event.currentTarget).closest(".item");
		const item = this.actor.items.get(ele.data("itemId"));
		const response = await Dialog.confirm({
			title: "Delete Item",
			content: `<p>Do you want to delete the ${item.type} <b>${item.name}</b>?</p>`,
		});

		if (response) {
			item.delete();
			ele.slideUp(200, () => this.render(false));
		}
	}

	async _onCavUnitPilotingDelete(event) {
		const curTarget = $(event.target).parents(".delete-cav-unit-skill");
		const cavSkillName = curTarget.siblings(".cav-skill-name").children("input").val();

		// const ele = $(event.currentTarget).closest(".item");
		// const item = this.actor.items.get(ele.data("itemId"));
		const response = await Dialog.confirm({
			title: "Delete Item",
			content: `<p>Do you want to delete the Cav Unit Piloting Skill <b>${cavSkillName}</b>?</p>`,
		});

		if (response) {
			this.cav.update({
				[`system.cavUnitPiloting.-=${cavSkillName}`]: null,
			});
		}
	}

	_onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		console.log("CavSheet rolling", dataset);
		// Handle item rolls.
		if (dataset.rollType) {
			if (dataset.rollType == "item") {
				const itemId = element.closest(".item").dataset.itemId;
				const item = this.cav.items.get(itemId);
				if (item) return item.roll(event);
			}

			if (dataset.rollType == "pilot-item") {
				if (!this.cav.hasPilot) return;
				const itemId = element.closest(".item").dataset.itemId;
				const item = this.cav.pilot.items.get(itemId);
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
