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

		this._prepareItems(context);
		this._prepareVehicleData(context);

		context.CONFIG = CONFIG.METALSAVIORS;

		return context;
	}

	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		let combatTraining = null;

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
			}
		}

		// Assign and return
		context.gear = gear;
		context.combatTraining = combatTraining;
	}

	_prepareVehicleData(context) {
		const token = this.actor.getActiveTokens(true, true)[0];
		if (!token) return;

		// The following are only included for tokens
		context.curMovementSpeed = token.combatant?.getCurMovementSpeedKey();
		context.excessMomentum = token.combatant?.getExtraMovementMomentum();
	}
}
