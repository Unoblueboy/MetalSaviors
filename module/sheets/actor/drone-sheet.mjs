export class MetalSaviorsDroneSheet extends ActorSheet {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-drone-sheet.hbs`;
	}

	getData() {
		const context = super.getData();
		context.system = foundry.utils.deepClone(this.actor.system);

		this._prepareItems(context);

		return context;
	}

	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		const weapons = [];

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
			}
		}

		// Assign and return
		context.gear = gear;
		context.weapons = weapons;
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
		html.find(".item-delete").click((ev) => {
			const li = $(ev.currentTarget).closest(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

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
