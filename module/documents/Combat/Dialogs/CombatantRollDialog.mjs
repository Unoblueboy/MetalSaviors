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
					cancelCallback: (html) => resolve({ cancelled: true }),
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
		context.hasCav = this.combatant.hasCav;
		if (this.combatant.hasDerivedInitiativeBonuses()) {
			const data = this.combatant.actor.data.data;
			context.includeModifiers = true;
			context.pilotInitativeModifier = data.derivedAttributes.initiativeModifier.value;
			context.cavInitativeModifier = data.derivedAttributes.cavInitiativeModifier.value;
		}
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);
		const combatSpeedDiv = html.find(".combat-speed-div").get(0);
		const pilotInitativeModifierDiv = html.find(".pilot-initative-modifier-div").get(0);
		const cavInitativeModifierDiv = html.find(".cav-initative-modifier-div").get(0);

		html.find(".in-cav-checkbox").change((ev) => {
			const inCav = ev.target.checked;
			if (inCav) {
				combatSpeedDiv.style.visibility = "visible";
				if (pilotInitativeModifierDiv) {
					pilotInitativeModifierDiv.style.display = "none";
				}
				if (cavInitativeModifierDiv) {
					cavInitativeModifierDiv.style.display = "flex";
				}
			} else {
				combatSpeedDiv.style.visibility = "hidden";
				if (pilotInitativeModifierDiv) {
					pilotInitativeModifierDiv.style.display = "flex";
				}
				if (cavInitativeModifierDiv) {
					cavInitativeModifierDiv.style.display = "none";
				}
			}
		});
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
					cancelCallback: (html) => resolve({ cancelled: true }),
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
				hasCav: c.hasCav,
			};
			if (c.hasDerivedInitiativeBonuses()) {
				const data = c.actor.data.data;
				mappedData.includeModifiers = true;
				mappedData.pilotInitativeModifier = data.derivedAttributes.initiativeModifier.value;
				mappedData.cavInitativeModifier = data.derivedAttributes.cavInitiativeModifier.value;
			}
			return mappedData;
		});
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".in-cav-checkbox").change((ev) => {
			const element = ev.target;
			const inCav = element.checked;
			const combatSpeedCell = $(element).closest("td").siblings(".combat-speed-td").find("select").get(0);
			const pilotInitativeModifierInput = $(element)
				.closest("td")
				.siblings(".base-initative-modifiers-td")
				.find(".pilot-initative-modifier")
				.get(0);
			const cavInitativeModifierInput = $(element)
				.closest("td")
				.siblings(".base-initative-modifiers-td")
				.find(".cav-initative-modifier")
				.get(0);
			if (inCav) {
				combatSpeedCell.style.visibility = "visible";
				if (pilotInitativeModifierInput) {
					pilotInitativeModifierInput.style.display = "none";
				}
				if (cavInitativeModifierInput) {
					cavInitativeModifierInput.style.display = "block";
				}
			} else {
				combatSpeedCell.style.visibility = "hidden";
				if (pilotInitativeModifierInput) {
					pilotInitativeModifierInput.style.display = "block";
				}
				if (cavInitativeModifierInput) {
					cavInitativeModifierInput.style.display = "none";
				}
			}
		});
	}
}

function processCombatantFormData(form) {
	const inCav = form.inCav?.checked ?? false;
	const data = {
		bonus: parseInt(form.bonus.value || 0),
		inCav: inCav,
	};
	const combatSpeed = form.combatSpeed?.value;
	if (combatSpeed) {
		data.combatSpeed = combatSpeed;
	}
	return data;
}
