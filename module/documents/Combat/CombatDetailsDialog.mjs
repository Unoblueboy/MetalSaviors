export class MetalSaviorsCombatDetailsDialog extends Dialog {
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
		};

		this.selectedAction = this.actions[0].name;
		this.selectedAttackAugment = this.attackAugments[0].name;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/combat/combat-action-dialog.hbs",
		});
	}

	getData(options) {
		const context = {};

		context.actions = this.actions;
		context.selectedAction = this.selectedAction;
		context.attackAugments = this.attackAugments;
		context.selectedAttackAugment = this.selectedAttackAugment;
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".action-name-select").change((ev) => {
			this.selectedAction = ev.target.value;
			this.render({});
		});
	}
}
