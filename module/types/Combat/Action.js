import { ActionType } from "./Enums.js";

export class Action {
	static AccelerateBrake = new Action({ type: ActionType.AccelerateBrake, cavAction: true });
	static Attack = new Action({ type: ActionType.Attack, cavAction: true, pilotAction: true, augmentable: true });
	static CavSystem = new Action({ type: ActionType.CavSystem, cavAction: true });
	static Delay = new Action({ type: ActionType.Delay, cavAction: true, pilotAction: true });
	static Ejection = new Action({ type: ActionType.Ejection, cavAction: true });
	static Repairs = new Action({ type: ActionType.Repairs, cavAction: true });
	static Maneuver = new Action({ type: ActionType.Maneuver, cavAction: true });
	static Other = new Action({ type: ActionType.Other, cavAction: true, pilotAction: true });
	static Refocus = new Action({ type: ActionType.Refocus, cavAction: true, pilotAction: true });
	static Reload = new Action({ type: ActionType.Reload, cavAction: true, pilotAction: true });
	static Tool = new Action({ type: ActionType.Tool, cavAction: true, pilotAction: true });
	static Block = new Action({ type: ActionType.Block, cavAction: true, pilotAction: true });
	static Dive = new Action({ type: ActionType.Dive, pilotAction: true });
	static Dodge = new Action({ type: ActionType.Dodge, cavAction: true, pilotAction: true });
	static EvasiveManeuvers = new Action({ type: ActionType.EvasiveManeuvers, cavAction: true });
	static Parry = new Action({ type: ActionType.Parry, cavAction: true, pilotAction: true });
	static Reorient = new Action({ type: ActionType.Reorient, cavAction: true });
	static RollWithPunch = new Action({ type: ActionType.RollWithPunch, cavAction: true, pilotAction: true });
	static SwitchWeapon = new Action({ type: ActionType.SwitchWeapon, cavAction: true, pilotAction: true });
	static Unspecified = new Action({ type: ActionType.Unspecified, cavAction: true, pilotAction: true });

	constructor({ type, cavAction = false, pilotAction = false, augmentable = false }) {
		this.type = type;
		this.name = type.value;
		this.cavAction = cavAction;
		this.pilotAction = pilotAction;
		this.augmentable = augmentable;
	}

	static getAllActions() {
		return Object.values(Action);
	}
}
