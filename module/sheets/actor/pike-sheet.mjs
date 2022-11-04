import { MetalSaviorsActorSheet } from "./actor-sheet.mjs";

export class MetalSaviorsPikeSheet extends MetalSaviorsActorSheet {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-pike-sheet.hbs`;
	}

	getData() {
		const context = super.getData();
		context.system = foundry.utils.deepClone(this.actor.system);

		this._prepareItems(context);
		this._preparePikeData(context);

		context.CONFIG = CONFIG.METALSAVIORS;

		return context;
	}

	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		const weapons = [];
		let combatTraining = null;

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
				case "combatTraining":
					combatTraining = i;
					break;
			}
		}

		// Assign and return
		context.gear = gear;
		context.weapons = weapons;
		context.combatTraining = combatTraining;
	}

	_preparePikeData(context) {
		const token = this.actor.getActiveTokens(true, true)[0];
		if (!token) return;

		// The following are only included for tokens
		context.curMovementSpeed = token.combatant?.getCurMovementSpeedKey();
		context.excessMomentum = token.combatant?.getExtraMovementMomentum();
	}

	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.find(".item-edit").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		if (!this.isEditable) return;

		// Delete Inventory Item
		html.find(".item-delete").click(this._onItemDelete.bind(this));

		html.find(".rollable").click(this._onRoll.bind(this));

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
