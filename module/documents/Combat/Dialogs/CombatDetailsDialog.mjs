import { CombatSpeedHelper } from "../../../helpers/CombatSpeedHelper.mjs";

export class MetalSaviorsCombatDetailsDialog extends Dialog {
	// TODO: Consider whether combatant in or out of CAV.
	actions = [
		{
			name: "Accelerate / Brake",
			cavAction: true,
		},
		{
			name: "Attack",
			cavAction: true,
			pilotAction: true,
			augmentable: true,
		},
		{
			name: "CAV System",
			cavAction: true,
		},
		{
			name: "Delay",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Ejection",
			cavAction: true,
		},
		{
			name: "Emergency Repairs",
			cavAction: true,
		},
		{
			name: "Maneuver",
			cavAction: true,
		},
		{
			name: "Other",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Refocus",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Reload",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Tool",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Block",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Dive",
			pilotAction: true,
		},
		{
			name: "Dodge",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Evasive Maneuvers",
			cavAction: true,
		},
		{
			name: "Parry",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Reorient",
			cavAction: true,
		},
		{
			name: "Roll with Punch",
			cavAction: true,
			pilotAction: true,
		},
		{
			name: "Unspecified",
			cavAction: true,
			pilotAction: true,
		},
	];

	attackAugments = [
		{
			name: "None",
		},
		{
			name: "Aim Down Sights",
			additionalActions: 2,
		},
		{
			name: "All-In-Strike",
			additionalActions: 2,
		},
		{
			name: "Called Strike",
			additionalActions: 1,
		},
		{
			name: "Cleave",
			additionalActions: 1,
		},
		{
			name: "Feint",
			additionalActions: 1,
		},
		{
			name: "Precise Strike",
			additionalActions: 2,
		},
		{
			name: "Spray",
			additionalActions: 1,
		},
		{
			name: "Unspecified",
		},
	];

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

		this.selectedAction = this.actions[0].name;
		this.selectedAttackAugment = this.attackAugments[0].name;
		this.combatant = data.combatant;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/combat/combat-action-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Perform Action";
	}

	static async getActionDetails(combatant) {
		return new Promise((resolve) => {
			new MetalSaviorsCombatDetailsDialog(
				{
					normalCallback: (html) =>
						resolve(this._processActionDetails(html[0].querySelector("form"), combatant)),
					cancelCallback: (html) => resolve({ cancelled: true }),
					combatant: combatant,
				},
				null
			).render(true);
		});
	}

	static _processActionDetails(form, combatant) {
		const actionName = form.actionName.value;
		switch (actionName) {
			case "Accelerate / Brake":
				return {
					actionName: actionName,
					actionCost: 1,
					dSpeed: parseInt(form.dSpeed.value),
				};
			case "Attack":
				const augmentActionCost = Number.isNumeric(form.augmentActionCost.value)
					? parseInt(form.augmentActionCost.value)
					: 1;
				const actionCost = augmentActionCost + 1;
				return {
					actionName: actionName,
					actionCost: actionCost,
				};
			case "Refocus":
				// TODO: Make the roll output prettier
				const roll = new Roll("1d6");
				const speaker = ChatMessage.getSpeaker({ actor: combatant.actor });
				const rollMode = game.settings.get("core", "rollMode");
				const result = roll.roll({ async: false });
				roll.toMessage({
					speaker: speaker,
					rollMode: rollMode,
					flavor: `${combatant.actor.data.name} is refocusing`,
				});
				return {
					actionName: actionName,
					actionCost: 1,
					dInit: result.total,
				};
			case "Unspecified":
				const curSpeed = combatant.getCurMovementSpeed();
				const newSpeed = Number.isNumeric(form.newSpeed.value) ? parseInt(form.newSpeed.value) : curSpeed;
				const curInitiative = combatant.data.initiative;
				const newInitiative = Number.isNumeric(form.newInitiative.value)
					? parseInt(form.newInitiative.value)
					: curInitiative;

				return {
					actionName: actionName,
					actionCost: Number.isNumeric(form.actionCost.value) ? parseInt(form.actionCost.value) : 0,
					dSpeed: newSpeed - curSpeed,
					dInit: newInitiative - curInitiative,
				};
			default:
				return {
					actionName: actionName,
					actionCost: Number.isNumeric(form.actionCost.value) ? parseInt(form.actionCost.value) : 1,
				};
		}
	}

	getData(options) {
		const context = {};

		context.actions = this.actions;
		context.actionDetails = {
			selectedAction: this.selectedAction,
			speedDetails: this._getSpeedDetails(),
		};
		context.attackAugments = this.attackAugments;
		context.attackAugmentsDetails = {
			selectedAttackAugment: this.selectedAttackAugment,
			selectedAttackAugmentCost: this.attackAugments.find((x) => x.name == this.selectedAttackAugment)
				.additionalActions,
		};
		context.combatant = this.combatant;
		return context;
	}

	_getSpeedDetails() {
		const combatant = this.combatant;
		const curSpeed = combatant.getCurMovementSpeed();
		const decSpeed = curSpeed - 1 < 0 ? null : curSpeed - 1;
		const accSpeed = curSpeed + 1 > combatant.getMaxSpeed() ? null : curSpeed + 1;
		return {
			currentSpeed: {
				value: curSpeed,
				label: CombatSpeedHelper.getMovementSpeedString(curSpeed),
			},
			decelerateSpeed: {
				value: decSpeed,
				label: CombatSpeedHelper.getMovementSpeedString(decSpeed),
			},
			accelerateSpeed: {
				value: accSpeed,
				label: CombatSpeedHelper.getMovementSpeedString(accSpeed),
			},
			combatSpeedOptions: combatant.getCombatSpeedOptions(),
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".action-name-select").change((ev) => {
			this.selectedAction = ev.target.value;
			this.render({});
		});

		html.find(".attack-augment-select").change((ev) => {
			this.selectedAttackAugment = ev.target.value;
			this.render({});
		});
	}
}
