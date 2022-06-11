import { rollAttack } from "../../../helpers/roll.mjs";
import { MetalSaviorsWeaponAttackDialog } from "./dialogs/weaponAttackDialog.mjs";

export class MetalSaviorsWeapon extends Item {
	get weaponType() {
		return this.data.data.type;
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
		switch (this.weaponType) {
			case "missile":
				return await MetalSaviorsWeaponAttackDialog.getAttackRollData(this, {
					includeToHit: false,
				});
			default:
				return await MetalSaviorsWeaponAttackDialog.getAttackRollData(this);
		}
	}

	async roll() {
		const data = await this.getWeaponData();

		if (data.cancelled) {
			return;
		}

		rollAttack(this.actor, data);
	}
}
