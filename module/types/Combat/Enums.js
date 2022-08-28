class Enum {
	constructor(value) {
		this.value = value;
	}

	static getAllEnumValues() {
		return Object.values(this);
	}

	static getAllEnumEntries() {
		return Object.fromEntries(Object.entries(this));
	}

	static parseValue(value) {
		return Object.values(this).filter((x) => x.value === value)[0] ?? null;
	}
}

export class ActionType extends Enum {
	static AccelerateBrake = new ActionType("Accelerate / Brake");
	static Attack = new ActionType("Attack");
	static CavSystem = new ActionType("CAV System");
	static Delay = new ActionType("Delay");
	static Ejection = new ActionType("Ejection");
	static Repairs = new ActionType("Emergency Repairs");
	static Maneuver = new ActionType("Maneuver");
	static Other = new ActionType("Other");
	static Refocus = new ActionType("Refocus");
	static Reload = new ActionType("Reload");
	static Tool = new ActionType("Tool");
	static Block = new ActionType("Block");
	static Dive = new ActionType("Dive");
	static Dodge = new ActionType("Dodge");
	static EvasiveManeuvers = new ActionType("Evasive Maneuvers");
	static Parry = new ActionType("Parry");
	static Reorient = new ActionType("Reorient");
	static RollWithPunch = new ActionType("Roll with Punch");
	static SwitchWeapon = new ActionType("Switch Weapon");
	static Unspecified = new ActionType("Unspecified");
}

export class AttackAugmentType extends Enum {
	static None = new AttackAugmentType("None");
	static AimDownSights = new AttackAugmentType("Aim Down Sights");
	static AllInStrike = new AttackAugmentType("All-In-Strike");
	static CalledStrike = new AttackAugmentType("Called Strike");
	static Cleave = new AttackAugmentType("Cleave");
	static Feint = new AttackAugmentType("Feint");
	static PreciseStrike = new AttackAugmentType("Precise Strike");
	static Spray = new AttackAugmentType("Spray");
	static Unspecified = new AttackAugmentType("Unspecified");
}
