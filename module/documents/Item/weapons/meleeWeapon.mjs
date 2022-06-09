import { MetalSaviorsWeaponAttackDialog } from "./dialogs/weaponAttackDialog.mjs";
import { MetalSaviorsWeapon } from "./weapon.mjs";

export class MetalSaviorsMeleeWeapon extends MetalSaviorsWeapon {
	async getWeaponData() {
		const data = await MetalSaviorsWeaponAttackDialog.getAttackRollData(this);
		return { ...data, meleeToHitBonus: this.getMeleeToHit() };
	}

	getMeleeToHit() {
		if (!this.actor) {
			return null;
		}

		if (this.actor.type !== "character") {
			return null;
		}

		if (this.getOwner()?.type !== "pilot") {
			return;
		}

		return this.actor.data.data.derivedAttributes.toHitModifier.value;
	}
}
