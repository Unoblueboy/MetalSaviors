import { rollAttack } from "../../../helpers/roll.mjs";
import { MetalSaviorsWeaponAttackDialog } from "./dialogs/weaponAttackDialog.mjs";

export class MetalSaviorsWeapon extends Item {
	get weaponType() {
		return this.system.type;
	}

	get range() {
		return this.weaponType === "ranged" ? this.system.range : 0;
	}

	getAttackRollData(name) {
		return this.system.rolls[name] || {};
	}

	getAllAttackRollData() {
		return this.system.rolls;
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

	async roll(event) {
		const getOptions = event.shiftKey;
		const itemSystem = this.system;
		let data;

		switch (this.weaponType) {
			case "missile":
				data = {
					weaponName: this.name,
					attackerName: this.actor?.name,
					includeToHit: false,
					weaponDamageRoll: itemSystem.rolls.Normal.damageRoll,
				};
				break;
			default:
				data = {
					weaponName: this.name,
					attackerName: this.actor?.name,
					weaponToHitBonus: itemSystem.rolls.Normal.toHitBonus,
					weaponDamageRoll: itemSystem.rolls.Normal.damageRoll,
				};
				break;
		}

		if (getOptions) {
			data = await this.getWeaponData();

			if (data.cancelled) {
				return;
			}
		}

		rollAttack(this.actor, data);
	}
}
