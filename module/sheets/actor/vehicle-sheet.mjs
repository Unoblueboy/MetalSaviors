export class MetalSaviorsVehicleSheet extends ActorSheet {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-vehicle-sheet.hbs`;
	}

	getData() {
		const context = super.getData();
		const actorData = this.actor.data.toObject(false);

		context.vehicleWeights = [{ name: "Light" }, { name: "Medium" }, { name: "Heavy" }];
		context.vehicleDesignations = [{ name: "Air" }, { name: "Land" }, { name: "Water" }];
		context.vehicleCombatReadiness = [{ name: "Combat" }, { name: "Non-Combat" }];
		context.data = actorData.data;
		context.flags = actorData.flags;

		this._prepareItems(context);
		this._prepareVehicleData(context);

		context.CONFIG = CONFIG.METALSAVIORS;

		return context;
	}

	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		let combatTraining = null;
		const weapons = [];

		// Iterate through items, allocating to containers
		for (let i of context.items) {
			i.img = i.img || DEFAULT_TOKEN;
			// Append to gear.
			switch (i.type) {
				case "item":
					gear.push(i);
					break;
				case "combatTraining":
					combatTraining = i;
					break;
				case "weapon":
					weapons.push(i);
					break;
			}
		}

		// Assign and return
		context.gear = gear;
		context.combatTraining = combatTraining;
		context.weapons = weapons;
	}

	_prepareVehicleData(context) {
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
