import MetalSaviorsCombatant from "../Combatant.mjs";

export class MetalSaviorsCombatExcessActionsDialog extends Dialog {
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
		game.socket.on("system.metalsaviors", (arg) => this._socketEventHandler(arg));
	}

	get title() {
		return this.data.title || "Spend Excess Actions";
	}

	setNormalCallback(normalCallback) {
		this.data.buttons.normal.callback = normalCallback;
	}

	setCancelCallback(cancelCallback) {
		this.data.buttons.cancel.callback = cancelCallback;
		this.data.close = cancelCallback;
	}

	async _socketEventHandler(data) {
		const { location = "", action = "", payload = {} } = data;

		if (location === "CombatExcessActionsDialog" && action === "newRound") {
			this.close();
		}
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/combat/combat-excess-actions-dialog.hbs",
		});
	}

	static getExcessActionsDetails(combatants) {
		const defaultResult = combatants.map((x) => ({
			combatantId: x.id,
			dInit: 0,
			dExtraMomentum: 0,
			actionCost: 0,
		}));

		if (combatants.every((x) => x.getRemainingActions() == 0)) {
			ui.notifications.warn("All combatants you control have no remaining actions, so no dialog was displayed");
			return [() => {}, new Promise((resolve) => resolve(defaultResult))];
		}

		var dialog = new MetalSaviorsCombatExcessActionsDialog(
			{
				normalCallback: null,
				cancelCallback: null,
				combatants: combatants,
			},
			null
		);
		dialog.render(true);

		return [
			() => dialog.close(),
			new Promise((resolve) => {
				dialog.setNormalCallback((html) => {
					const [valid, result] = this._processExcessActionsDetails(
						html[0].querySelector("form"),
						combatants
					);
					if (valid) resolve(result);
					return valid;
				});
				dialog.setCancelCallback((html) => {
					resolve(defaultResult);
					return true;
				});
			}),
		];
	}

	getData() {
		const context = super.getData();
		const combatants = [];
		for (const combatant of this.combatants) {
			combatants.push({
				id: combatant.id,
				name: combatant.name,
				remainingActions: combatant.getRemainingActions(),
				remainingInitIncrease: combatant.getFinesse() - combatant.getCumExcessInitIncrease(),
			});
		}

		context.combatants = combatants;

		return context;
	}

	submit(button) {
		try {
			let shouldClose = true;
			if (button.callback) shouldClose = button.callback(this.options.jQuery ? this.element : this.element[0]);
			if (shouldClose) this.close();
		} catch (err) {
			ui.notifications.error(err);
			throw new Error(err);
		}
	}

	static _processExcessActionsDetails(form, combatants) {
		const result = [];

		for (const combatant of combatants) {
			let dInit = form[`${combatant.id}_dInit`].value;
			let dExtraMomentum = form[`${combatant.id}_dExtraMomentum`].value;

			if (!Number.isNumeric(dInit) || !Number.isNumeric(dExtraMomentum)) {
				ui.notifications.warn("All inputs must be numbers");
				return [false, []];
			}

			dInit = parseInt(dInit);
			dExtraMomentum = parseInt(dExtraMomentum);

			if (dInit < 0 || dExtraMomentum < 0) {
				ui.notifications.warn("All inputs must be greater than 0");
				return [false, []];
			}

			if (combatant.getCumExcessInitIncrease() + dInit > combatant.getFinesse()) {
				ui.notifications.warn(
					"The cumulative initiative increase throughout combat cannot exceed your finesse"
				);
				return [false, []];
			}

			if (dInit + dExtraMomentum > combatant.getRemainingActions()) {
				ui.notifications.warn("The total momentum and initiative increase cannot exceed the remaining actions");
				return [false, []];
			}

			result.push({
				combatantId: combatant.id,
				dInit: dInit,
				dExtraMomentum: dExtraMomentum,
				actionCost: dInit + dExtraMomentum,
			});
		}

		return [true, result];
	}
}
