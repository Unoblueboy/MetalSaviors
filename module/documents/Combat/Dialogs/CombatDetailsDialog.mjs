import { CombatSpeedHelper } from "../../../helpers/CombatSpeedHelper.mjs";
import { Action } from "../../../types/Combat/Action.js";
import { CombatAction } from "../../../types/Combat/CombatAction.js";
import { AttackAugment } from "../../../types/Combat/AttackAugment.js";
import { ActionType, AttackAugmentType } from "../../../types/Combat/CombatEnums.js";

export class MetalSaviorsCombatDetailsDialog extends Dialog {
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

		this.validActions = data.combatant.isMechanical
			? Action.getAllActions().filter((action) => action.cavAction)
			: Action.getAllActions().filter((action) => action.pilotAction);
		const validActionsTypes = this.validActions.map((x) => x.type);
		this.validActionTypes = ActionType.filter((k, v) => validActionsTypes.includes(v));

		this.selectedActionType = this.validActions[0].type;
		this.selectedAttackAugmentType = AttackAugment.getAllAttackAugments()[0].type;
		this.combatant = data.combatant;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/combat/combat-action-dialog.hbs",
			height: 250,
			resizable: true,
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
					cancelCallback: () => resolve({ cancelled: true }),
					combatant: combatant,
				},
				null
			).render(true);
		});
	}

	static _processActionDetails(form, combatant) {
		const actionName = form.actionName.value;
		const actionType = ActionType.parseValue(actionName);
		switch (actionType) {
			case ActionType.AccelerateBrake:
				return new CombatAction({
					type: actionType,
					actionCost: 1,
					dSpeed: parseInt(form.dSpeed.value),
				});
			case ActionType.Attack: {
				const augmentActionCost = Number.isNumeric(form.augmentActionCost.value)
					? parseInt(form.augmentActionCost.value)
					: 1;
				const actionCost = augmentActionCost + 1;
				return new CombatAction({
					type: actionType,
					actionCost: actionCost,
				});
			}
			case ActionType.Refocus: {
				// TODO: Make the roll output prettier
				const roll = new Roll("1d6");
				const speaker = ChatMessage.getSpeaker({ actor: combatant.actor });
				const rollMode = game.settings.get("core", "rollMode");
				const result = roll.roll({ async: false });
				roll.toMessage({
					speaker: speaker,
					rollMode: rollMode,
					flavor: `${combatant.actor.name} is refocusing`,
				});
				return new CombatAction({
					type: actionType,
					actionCost: 1,
					dInit: result.total,
				});
			}
			case ActionType.Unspecified: {
				const curInitiative = combatant.initiative;
				const newInitiative = Number.isNumeric(form.newInitiative.value)
					? parseInt(form.newInitiative.value)
					: curInitiative;

				const data = {
					type: actionType,
					actionCost: Number.isNumeric(form.actionCost.value) ? parseInt(form.actionCost.value) : 0,
					dInit: newInitiative - curInitiative,
				};

				if (combatant.isMechanical) {
					const curSpeed = combatant.getCurMovementSpeed();
					const newSpeed = Number.isNumeric(form.newSpeed.value) ? parseInt(form.newSpeed.value) : curSpeed;
					data["dSpeed"] = newSpeed - curSpeed;
				}

				return new CombatAction(data);
			}
			default:
				return new CombatAction({
					type: actionType,
					actionCost: Number.isNumeric(form.actionCost.value) ? parseInt(form.actionCost.value) : 1,
				});
		}
	}

	getData(options) {
		const context = {};

		context.isMechanical = this.combatant.isMechanical;
		context.actions = this.validActions;
		context.actionTypes = this.validActionTypes;
		context.actionDetails = {
			selectedActionType: this.selectedActionType,
			speedDetails: this._getSpeedDetails(),
		};
		context.attackAugments = AttackAugment.getAllAttackAugments();
		context.attackAugmentTypes = AttackAugmentType.getAllEnumEntries();
		context.attackAugmentsDetails = {
			selectedAttackAugmentType: this.selectedAttackAugmentType,
			selectedAttackAugmentCost: AttackAugment.getAdditionalActions(this.selectedAttackAugmentType),
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
			this.selectedActionType = ActionType.parseValue(ev.target.value);
			this.render({});
		});

		html.find(".attack-augment-select").change((ev) => {
			this.selectedAttackAugmentType = AttackAugmentType.parseValue(ev.target.value);
			this.render({});
		});
	}
}
