import { rollAttack } from "../../../helpers/roll.mjs";
import { MetalSaviorsWeaponAttackDialog } from "./dialogs/weaponAttackDialog.mjs";
import { WeaponRange } from "../../../types/Item/ItemEnums.js";

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

	getRangeIncrement(distance) {
		if (distance <= 1) {
			return WeaponRange.PointBlank;
		}

		if (distance <= this.range / 2) {
			return WeaponRange.Close;
		}

		if (distance <= this.range) {
			return WeaponRange.Medium;
		}

		if (distance <= this.range * 2) {
			return WeaponRange.Long;
		}

		return WeaponRange.Extreme;
	}

	async getWeaponData(defaultData = {}) {
		switch (this.weaponType) {
			case "missile":
				return await MetalSaviorsWeaponAttackDialog.getAttackRollData(this, {
					includeToHit: false,
					weaponRollData: defaultData,
				});
			default:
				return await MetalSaviorsWeaponAttackDialog.getAttackRollData(this, {
					weaponRollData: defaultData,
				});
		}
	}

	async getRangeIncrementToTarget(target, actorTokenDocument = null) {
		if (!this.actor) {
			return null;
		}

		const tokenDocument = actorTokenDocument ?? (await this.actor.getToken());

		if (!tokenDocument) {
			return null;
		}

		const token = tokenDocument.object;
		const distance =
			game.canvas.grid.measureDistance(
				{ x: token.position._x, y: token.position._y },
				{ x: target.position._x, y: target.position._y },
				{ gridSpaces: true }
			) / game.canvas.dimensions.distance;

		return this.getRangeIncrement(distance);
	}

	async _getActorToHitPenalty() {
		if (!this.actor) {
			return null;
		}

		return await this.actor.getToHitPenalty();
	}

	async _getElevationDif(target, actorTokenDocument = null) {
		if (!this.actor) {
			return null;
		}

		const tokenDocument = actorTokenDocument ?? (await this.actor.getToken());

		if (!tokenDocument) {
			return null;
		}

		return tokenDocument.elevation - target.document.elevation;
	}

	async _getTargetToHitPenalty(target) {
		if (!target.document) {
			return null;
		}

		const actor = target.document.actor;

		if (!actor) {
			return null;
		}

		return await actor.getToHitPenalty();
	}

	async _getTargetDefence(target) {
		if (!target.document) {
			return null;
		}

		const actor = target.document.actor;

		if (!actor) {
			return null;
		}

		return await actor.getDefence();
	}

	async roll(event) {
		const getOptions = event.shiftKey;
		const targets = game.user.targets;

		if (getOptions) {
			this._rollWithOptions(targets);
			return;
		}

		this._rollWithoutOptions(targets);
	}

	async _rollWithOptions(targets) {
		const weaponRollData = await this.getRollWeaponData(targets);
		for (const defaultData of weaponRollData) {
			const data = await this.getWeaponData(defaultData);

			if (data.cancelled) {
				return;
			}

			// TODO Consider indirect Shots
			rollAttack(this.actor, data);
		}
	}

	async _rollWithoutOptions(targets) {
		const rollWeaponData = await this.getRollWeaponData(targets);

		for (const data of rollWeaponData) {
			rollAttack(this.actor, data);
		}
	}

	async getRollWeaponData(targets) {
		const itemSystem = this.system;
		let data;

		switch (this.weaponType) {
			case "missile":
				data = {
					weaponName: this.name,
					weaponType: this.weaponType,
					attackerName: this.actor?.name,
					includeToHit: false,
					weaponDamageRoll: itemSystem.rolls.Normal.damageRoll,
				};
				break;
			case "ranged":
				data = {
					weaponName: this.name,
					weaponType: this.weaponType,
					attackerName: this.actor?.name,
					weaponToHitBonus: itemSystem.rolls.Normal.toHitBonus,
					weaponDamageRoll: itemSystem.rolls.Normal.damageRoll,
					actorToHitPenalty: await this._getActorToHitPenalty(),
					tags: this._getTags(),
					augments: await this._getAugments(),
				};
				break;
			case "melee":
				data = {
					weaponName: this.name,
					weaponType: this.weaponType,
					attackerName: this.actor?.name,
					weaponToHitBonus: itemSystem.rolls.Normal.toHitBonus,
					weaponDamageRoll: itemSystem.rolls.Normal.damageRoll,
					tags: this._getTags(),
					augments: await this._getAugments(),
					curActorMomentum: await this._getActorMomentum(),
				};
				break;
			default:
				data = {
					weaponName: this.name,
					weaponType: this.weaponType,
					attackerName: this.actor?.name,
					weaponToHitBonus: itemSystem.rolls.Normal.toHitBonus,
					weaponDamageRoll: itemSystem.rolls.Normal.damageRoll,
				};
				break;
		}

		if (targets.size === 0) {
			return [data];
		}

		const allData = [];
		for (const target of targets) {
			const targetData = foundry.utils.deepClone(data);

			if (this.weaponType === "ranged") {
				targetData.rangeIncrement = await this.getRangeIncrementToTarget(target);
				targetData.actorToHitPenalty = await this._getActorToHitPenalty();
				targetData.targetToHitPenalty = await this._getTargetToHitPenalty(target);
				targetData.elevationDif = await this._getElevationDif(target);
				targetData.targetCover = await this._getTargetCover(target);
			}
			targetData.targetName = target.document.name;
			targetData.targetDefence = await this._getTargetDefence(target);
			allData.push(targetData);
		}

		return allData;
	}

	_getTags() {
		const tags = {
			ranged: Object.prototype.hasOwnProperty.call(this.system.tags, "Ranged"),
			scoped: Object.prototype.hasOwnProperty.call(this.system.tags, "Scoped"),
			shotgun: Object.prototype.hasOwnProperty.call(this.system.tags, "Shotgun"),
			piercing: Object.prototype.hasOwnProperty.call(this.system.tags, "Piercing"),
		};

		return tags;
	}

	async _getAugments() {
		if (!this.actor) {
			return {};
		}

		const token = await this.actor.getToken();

		if (!token) {
			return {};
		}

		const augments = {
			aimDownSights: token.hasStatusEffect("scope"),
		};

		return augments;
	}

	async _getTargetCover(target) {
		const token = target.document;

		if (!token) {
			return "none";
		}

		if (token.hasStatusEffect("fullCover")) {
			return "Full";
		}

		if (token.hasStatusEffect("halfCover")) {
			return "Half";
		}

		return "none";
	}

	async _getActorMomentum() {
		if (!this.actor) {
			return null;
		}

		const token = await this.actor.getToken();

		if (!token) {
			return null;
		}

		const combatant = token.combatant;

		if (!combatant) {
			return null;
		}

		const curMovementSpeedKey = combatant.getCurMovementSpeedKey();
		const curSpeedData = this.actor.getCombatSpeeds()[curMovementSpeedKey];

		if (!curSpeedData) {
			return null;
		}

		return curSpeedData.momentum ?? null;
	}
}
