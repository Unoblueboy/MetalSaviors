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
		const inCav = form.inCav.checked;
		const data = {
			bonus: parseInt(form.bonus.value || 0),
			inCav: inCav,
		};
		if (inCav) {
			data.combatSpeed = form.combatSpeed.value;
		}
		return data;
	}

	getData() {
		const context = super.getData();
		context.combatSpeedOptions = this.combatant.getCombatSpeedOptions();
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);
		const combatSpeedDiv = html.find(".combat-speed-div").get(0);

		html.find(".in-cav-checkbox").change((ev) => {
			const inCav = ev.target.checked;
			if (inCav) {
				combatSpeedDiv.style.visibility = "visible";
			} else {
				combatSpeedDiv.style.visibility = "hidden";
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
			const inCav = form[`${combatant.id}_inCav`].checked;
			options[combatant.id] = {
				bonus: parseInt(form[`${combatant.id}_bonus`].value || 0),
				inCav: inCav,
			};
			if (inCav) {
				options[combatant.id].combatSpeed = form[`${combatant.id}_combatSpeed`].value;
			}
		}

		return options;
	}

	getData() {
		const context = super.getData();
		context.combatants = [...this.combatants].map((c) => ({
			id: c.id,
			name: c.name,
			combatSpeedOptions: c.getCombatSpeedOptions(),
		}));
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".in-cav-checkbox").change((ev) => {
			const element = ev.target;
			const inCav = element.checked;
			const combatSpeedCell = $(element).closest("td").siblings(".combat-speed-td").get(0);
			if (inCav) {
				combatSpeedCell.style.visibility = "visible";
			} else {
				combatSpeedCell.style.visibility = "hidden";
			}
		});
	}
}
