import { AttackAugmentType } from "./Enums.js";

export class AttackAugment {
	static None = new AttackAugment({ type: AttackAugmentType.None });
	static AimDownSights = new AttackAugment({ type: AttackAugmentType.AimDownSights, additionalActions: 2 });
	static AllInStrike = new AttackAugment({ type: AttackAugmentType.AllInStrike, additionalActions: 2 });
	static CalledStrike = new AttackAugment({ type: AttackAugmentType.CalledStrike, additionalActions: 1 });
	static Cleave = new AttackAugment({ type: AttackAugmentType.Cleave, additionalActions: 1 });
	static Feint = new AttackAugment({ type: AttackAugmentType.Feint, additionalActions: 1 });
	static PreciseStrike = new AttackAugment({ type: AttackAugmentType.PreciseStrike, additionalActions: 2 });
	static Spray = new AttackAugment({ type: AttackAugmentType.Spray, additionalActions: 1 });
	static Unspecified = new AttackAugment({ type: AttackAugmentType.Unspecified });

	constructor({ type, additionalActions = 0 }) {
		this.type = type;
		this.name = type.value;
		this.additionalActions = additionalActions;
	}

	static getAllAttackAugments() {
		return Object.values(Action);
	}
}
