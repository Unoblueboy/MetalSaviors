export class MetalSaviorsWeaponAttackDialog extends Dialog {
	constructor(data, options) {
		super(options);
		this.data = {
			buttons: {
				normal: {
					callback: data.normalCallback,
				},
				cancel: {
					callback: data.cancelCallback,
				},
			},
			close: data.cancelCallback,
		};

		this.weapon = data.weapon;
		this.rollData = this.weapon.getAllAttackRollData();
		this.includeToHit = data.includeToHit;
		this.includeDamage = data.includeDamage;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/item/weapon/dialog/weapon-attack-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Roll Attack";
	}

	static async getAttackRollData(weapon, { includeToHit = true, includeDamage = true } = {}) {
		return new Promise((resolve) => {
			new MetalSaviorsWeaponAttackDialog(
				{
					normalCallback: (html) =>
						resolve(
							this._processAttackRollData(html[0].querySelector("form"), includeToHit, includeDamage)
						),
					cancelCallback: (html) => resolve({ cancelled: true }),
					weapon: weapon,
					includeToHit: includeToHit,
					includeDamage: includeDamage,
				},
				null
			).render(true);
		});
	}

	getData() {
		const context = {};
		const rollData = foundry.utils.deepClone(this.rollData);
		for (const [name, data] of Object.entries(rollData)) {
			data.label = name;
		}
		rollData[""] = { label: "Other" };
		context.rollData = rollData;
		context.weaponName = this.weapon.name;
		context.attackerName = this.weapon.isOwned ? this.weapon.actor.name : game.user.name;

		context.includeToHit = this.includeToHit;
		context.includeDamage = this.includeDamage;

		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".roll-name-select").change((ev) => {
			var target = $(ev.target);
			var damageRollInput = $(html.find(".damage-roll-input"));
			var toHitBonusInput = $(html.find(".to-hit-bonus-input"));
			if (target.val() === "") {
				damageRollInput.val("");
				toHitBonusInput.val("");
				damageRollInput.prop("disabled", false);
				toHitBonusInput.prop("disabled", false);
				return;
			}

			damageRollInput.val(this.rollData[target.val()].damageRoll);
			toHitBonusInput.val(this.rollData[target.val()].toHitBonus);
			damageRollInput.prop("disabled", true);
			toHitBonusInput.prop("disabled", true);
		});
		html.find("input").change((ev) => {
			var target = $(ev.target);
			var dType = target.data("dtype");
			switch (dType) {
				case "Dice":
					target.val((i, val) => window.Dice(val) ?? "");
					break;
				default:
					break;
			}
		});
	}

	static _processAttackRollData(form, includeToHit, includeDamage) {
		const data = {
			weaponName: form.weaponName.value,
			attackerName: form.attackerName.value,
		};
		data.includeToHit = includeToHit;
		if (includeToHit) {
			data.weaponToHitBonus = form.toHitBonus.value || null;
			data.otherToHitBonus = form.othertoHitBonuses.value || null;
		}
		data.includeDamage = includeDamage;
		if (includeDamage) {
			data.weaponDamageRoll = form.damageRoll.value || "0";
			data.otherDamageBonuses = form.otherDamageBonuses.value || null;
			data.damageType = form.damageType.value || null;
		}
		return data;
	}
}
