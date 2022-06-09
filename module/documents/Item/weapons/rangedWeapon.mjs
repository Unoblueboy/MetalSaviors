import { MetalSaviorsWeaponAttackDialog } from "./dialogs/weaponAttackDialog.mjs";
import { MetalSaviorsWeapon } from "./weapon.mjs";

export class MetalSaviorsRangedWeapon extends MetalSaviorsWeapon {
	async getWeaponData() {
		const data = await MetalSaviorsWeaponAttackDialog.getAttackRollData(this);
		return data;
	}
}
