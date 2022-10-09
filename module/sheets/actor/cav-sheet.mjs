import { MetalSaviorsCav } from "../../documents/Actor/cav.mjs";

export class MetalSaviorsCavSheet extends ActorSheet {
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
		html.find(".delete-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".delete-cav-unit-skill");
			const cavSkillName = curTarget.siblings(".cav-skill-name").children("input").val();
			this.cav.update({
				[`system.cavUnitPiloting.-=${cavSkillName}`]: null,
			});
		});

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

		// Rollable abilities.
		html.find(".rollable").click(this._onRoll.bind(this));
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