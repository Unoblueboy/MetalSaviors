import MetalSaviorsCombatant from "./Combatant.mjs";

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
			dMomentum: 0,
			actionCost: 0,
		}));

		if (combatants.every((x) => x.getRemainingActions() == 0)) {
			ui.notifications.warn("All combatants you control have no remaining actions, so no dialog was displayed");
			return [() => {}, new Promise((resolve) => resolve(defaultResult))];
		}

		// cancel: (html) => resolve(defaultResult)
		// normal: (html) => resolve(this._processExcessActionsDetails(html[0].querySelector("form"), combatants))

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
				dialog.setNormalCallback((html) =>
					resolve(this._processExcessActionsDetails(html[0].querySelector("form"), combatants))
				);
				dialog.setCancelCallback((html) => resolve(defaultResult));
			}),
		];
	}

	static _processExcessActionsDetails(form, combatants) {
		const defaultResult = combatants.map((x) => ({
			combatantId: x.id,
			dInit: 0,
			dMomentum: 0,
			actionCost: 0,
		}));
		return defaultResult;
	}
}
