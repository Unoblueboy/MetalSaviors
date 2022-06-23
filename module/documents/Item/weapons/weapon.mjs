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

	getOwnerName() {
		if (!this.actor) {
			return null;
		}

		const ownerData = this.getFlag("metalsaviors", "owner");
		if (ownerData?.type === "pilot") {
			return this.actor.name;
		}

		const cav = this.actor.items.get(ownerData.id);
		return cav?.name;
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

	async roll(event) {
		const getOptions = event.shiftKey;
		const itemData = this.data.data;
		let data;

		switch (this.weaponType) {
			case "missile":
				data = {
					weaponName: this.name,
					attackerName: this.getOwnerName(),
					includeToHit: false,
					weaponDamageRoll: itemData.rolls.Normal.damageRoll,
				};
				break;
			default:
				data = {
					weaponName: this.name,
					attackerName: this.getOwnerName(),
					weaponToHitBonus: itemData.rolls.Normal.toHitBonus,
					weaponDamageRoll: itemData.rolls.Normal.damageRoll,
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
