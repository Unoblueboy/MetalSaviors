export class MetalSaviorsWeaponSheet extends ItemSheet {
	constructor(object = {}, options = {}) {
		super(object, options);

		this.selectedTagTypeKey = "akimbo";
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "item"],
			width: 500,
			height: 500,
		});
	}

	get template() {
		return "systems/metalsaviors/templates/item/weapon/weapon-sheet.hbs";
	}

	weaponTypes = { melee: "Melee", ranged: "Ranged", missile: "Missile", supportWeapon: "Support Weapon" };
	tagTypes = {
		akimbo: { name: "Akimbo" },
		ammunition: {
			name: "Ammunition",
			hasValue: true,
		},
		automated: { name: "Automated" },
		concealable: { name: "Concealable" },
		dualWield: { name: "Dual-Wield" },
		freeHand: { name: "Free Hand" },
		fueled: { name: "Fueled" },
		gory: { name: "Gory" },
		heavy: { name: "Heavy" },
		indirect: { name: "Indirect" },
		longRangeMelee: { name: "Long Range Melee" },
		natural: { name: "Natural" },
		obvious: { name: "Obvious" },
		piercing: { name: "Piercing" },
		ranged: { name: "Ranged" },
		reload: {
			name: "Reload",
			hasValue: true,
		},
		salsaRule: { name: "Salsa Rule" },
		scoped: { name: "Scoped" },
		shotgun: { name: "Shotgun" },
		softTarget: { name: "Soft Target" },
		stun: {
			name: "Stun",
			hasValue: true,
		},
		suppression: { name: "Suppression" },
		switch: { name: "Switch" },
		tool: { name: "Tool" },
		trap: { name: "Trap" },
		twoHanded: { name: "Two-Handed" },
		ubiquitous: { name: "Ubiquitous" },
		unwieldy: { name: "Unwieldy" },
		other: {
			name: "Other",
			hasValue: true,
			hasCustomName: true,
		},
	};
	fireRateTypes = [
		{ name: "Automatic" },
		{ name: "Burst" },
		{ name: "Single" },
		{ name: "Laser" },
		{ name: "Explosive" },
		{ name: "Missile" },
		{ name: "Special" },
	];
	variantTypes = [{ name: "Charge" }, { name: "Kinetic" }, { name: "Laser" }];

	getData() {
		const context = super.getData();

		context.system = foundry.utils.deepClone(this.item.system);
		context.weaponTypes = this.weaponTypes;
		context.tagTypes = this.tagTypes;
		context.selectedTagTypeKey = this.selectedTagTypeKey;
		context.fireRateTypes = this.fireRateTypes;
		context.variantTypes = this.variantTypes;

		if (this.item.actor) {
			const actor = this.item.actor;
			context.possibleOwners = {
				[`${actor.id}`]: {
					type: "pilot",
					name: actor.name,
				},
			};
			for (const cav of actor.getCavs()) {
				context.possibleOwners[cav.id] = {
					type: "cav",
					name: cav.name,
				};
			}
			context.weaponOwner = this.item.getOwner();
		}

		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("select.add-weapon-tag-name").change((ev) => {
			const curTarget = $(ev.target);
			const value = curTarget.val();
			this.selectedTagTypeKey = value;
			this.render(true);
		});
		html.find(".add-weapon-tag").click((ev) => {
			const curTarget = $(ev.target).closest(".add-weapon-tag");
			const addWeaponTagInfoEle = $(curTarget).siblings(".add-weapon-tag-info");
			const newtagKey = addWeaponTagInfoEle.find("select.add-weapon-tag-name").first().val();
			const newValue = addWeaponTagInfoEle.find("input.add-weapon-tag-value").first().val();

			if (!newtagKey) {
				return;
			}

			const newTagName = this.tagTypes[newtagKey].hasCustomName
				? this._getCustomTagName(addWeaponTagInfoEle)
				: this.tagTypes[newtagKey].name;
			const tags = Object.keys(this.item.system.tags);

			if (!newTagName || tags.includes(newTagName)) {
				return;
			}

			this.item.update({
				[`system.tags.${newTagName}`]: newValue || null,
			});
		});
		html.find(".delete-weapon-tag").click((ev) => {
			const curTarget = $(ev.target).closest(".delete-weapon-tag");
			const tagName = curTarget.data("tagName");
			this.item.update({
				[`system.tags.-=${tagName}`]: null,
			});
		});

		html.find(".add-weapon-roll").click((ev) => {
			const curTarget = $(ev.target).closest(".add-weapon-roll");
			const newRollName = $(curTarget).siblings(".add-weapon-roll-name").children("input").first().val();
			const newDamageRoll = $(curTarget).siblings(".add-weapon-damage-roll").children("input").first().val();
			const newToHitBonus = $(curTarget).siblings(".add-weapon-to-hit-roll").children("input").first().val();

			if (!newRollName) {
				return;
			}

			if (!Roll.validate(newDamageRoll)) {
				return;
			}

			if (!Roll.validate(newToHitBonus)) {
				return;
			}

			const rolls = Object.keys(this.item.system.rolls);
			if (rolls.includes(newRollName)) {
				return;
			}

			this.item.update({
				[`system.rolls.${newRollName}`]: {
					damageRoll: newDamageRoll,
					toHitBonus: newToHitBonus,
				},
			});
		});
		html.find(".delete-weapon-roll").click((ev) => {
			const curTarget = $(ev.target).closest(".delete-weapon-roll");
			const name = curTarget.data("name");
			this.item.update({
				[`system.rolls.-=${name}`]: null,
			});
		});

		html.find(".owner-select").change((ev) => {
			const curTarget = $(ev.target);
			const value = curTarget.val();
			this.item.setOwner(value);
		});
	}

	_getCustomTagName(addWeaponTagInfoEle) {
		const newTagName = addWeaponTagInfoEle.find("input.add-weapon-tag-name").first().val();
		if (Object.values(this.tagTypes).some((x) => x.name.toLowerCase() === newTagName.toLowerCase())) {
			return null;
		}
		return newTagName;
	}
}
