import { rollAttack } from "../../../helpers/roll.mjs";

export class MetalSaviorsWeapon extends Item {
	getDamageRoll() {
		throw new Error("The method getDamageRoll has not been implemented");
	}

	gettoHitBonus() {
		throw new Error("The method gettoHitBonus has not been implemented");
	}

	_onCreate(data, options, userId) {
		super._onCreate(data, options, userId);

		if (!this.actor) {
			return;
		}

		if (this.actor.type !== "character") {
			return;
		}

		this.setFlag("metalsaviors", "owner", { type: "pilot", id: this.actor.id });
	}

	getOwner() {
		return this.getFlag("metalsaviors", "owner");
	}

	setOwner(ownerId) {
		if (!this.actor) {
			return;
		}

		this.setFlag("metalsaviors", "owner", { type: ownerId === this.actor.id ? "pilot" : "cav", id: ownerId });
	}

	getAttackRollData(name) {
		return this.data.data.rolls[name] || {};
	}

	getAllAttackRollData() {
		return this.data.data.rolls;
	}

	async getWeaponData() {
		throw new Error("The method getWeaponType has not been implemented");
	}

	async roll() {
		const data = await this.getWeaponData();

		if (data.cancelled) {
			return;
		}

		rollAttack(this.actor, data);
	}
}
