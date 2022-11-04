export class MetalSaviorsCombatantRollDialog extends Dialog {
	constructor(data, options) {
		super(options);
		this.data = {
			buttons: {
				normal: {
					callback: data.normalCallback,
				},
				cancel: {
					callback: data.cancelCallback,
				},
			},
			close: data.cancelCallback,
		};

		this.combatant = data.combatant;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/combat/combatant-roll-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Roll Initiative";
	}

	static async getInitiativeOptions(combatant) {
		return new Promise((resolve) => {
			new MetalSaviorsCombatantRollDialog(
				{
					normalCallback: (html) => resolve(this._processInitiativeOptions(html[0].querySelector("form"))),
					cancelCallback: () => resolve({ cancelled: true }),
					combatant: combatant,
				},
				null
			).render(true);
		});
	}

	static _processInitiativeOptions(form) {
		return processCombatantFormData(form);
	}

	getData() {
		const context = super.getData();
		context.combatSpeedOptions = this.combatant.getCombatSpeedOptions();
		if (this.combatant.hasDerivedInitiativeBonuses()) {
			const actor = this.combatant.actor;
			context.includeModifiers = true;
			context.initativeModifier = actor.getInitiativeBonus();
		}
		return context;
	}
}

export class MetalSaviorsCombatantMultiRollDialog extends Dialog {
	constructor(data, options) {
		super(options);
		this.data = {
			buttons: {
				normal: {
					callback: data.normalCallback,
				},
				cancel: {
					callback: data.cancelCallback,
				},
			},
			close: data.cancelCallback,
		};

		this.combatants = data.combatants;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/combat/combatant-multi-roll-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Roll Initiatives";
	}

	static async getInitiativeOptions(combatants) {
		return new Promise((resolve) => {
			new MetalSaviorsCombatantMultiRollDialog(
				{
					normalCallback: (html) =>
						resolve(this._processInitiativeOptions(html[0].querySelector("form"), combatants)),
					cancelCallback: () => resolve({ cancelled: true }),
					combatants: combatants,
				},
				null
			).render(true);
		});
	}

	static _processInitiativeOptions(form, combatants) {
		const options = {};

		for (const combatant of combatants) {
			const combatantForm = {
				inCav: form[`${combatant.id}_inCav`],
				bonus: form[`${combatant.id}_bonus`],
				combatSpeed: form[`${combatant.id}_combatSpeed`],
			};
			options[combatant.id] = processCombatantFormData(combatantForm);
		}

		return options;
	}

	getData() {
		const context = super.getData();
		context.combatants = [...this.combatants].map((c) => {
			const mappedData = {
				id: c.id,
				name: c.name,
				combatSpeedOptions: c.getCombatSpeedOptions(),
			};
			if (c.hasDerivedInitiativeBonuses()) {
				const actor = c.actor;
				mappedData.includeModifiers = true;
				mappedData.initativeModifier = actor.getInitiativeBonus();
			}
			return mappedData;
		});
		return context;
	}
}

function processCombatantFormData(form) {
	const data = {
		bonus: parseInt(form.bonus.value || 0),
	};
	const combatSpeed = form.combatSpeed?.value;
	if (combatSpeed) {
		data.combatSpeed = combatSpeed;
	}
	return data;
}
