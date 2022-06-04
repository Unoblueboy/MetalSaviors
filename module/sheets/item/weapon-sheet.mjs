export class MetalSaviorsWeaponSheet extends ItemSheet {
	constructor(object = {}, options = {}) {
		super(object, options);

		this.selectedTagTypeKey = "akimbo";
	}

	get template() {
		return "systems/metalsaviors/templates/item/weapon/weapon-sheet.hbs";
	}

	weaponTypes = { melee: "Melee", ranged: "Ranged" };
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
		reload: { name: "Reload" },
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

	getData() {
		const context = super.getData();

		const itemData = context.item.data;
		context.data = foundry.utils.deepClone(itemData.data);
		context.weaponTypes = this.weaponTypes;
		context.tagTypes = this.tagTypes;
		context.selectedTagTypeKey = this.selectedTagTypeKey;

		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".add-weapon-tag-name select").change((ev) => {
			const curTarget = $(ev.target);
			const value = curTarget.val();
			this.selectedTagTypeKey = value;
			this.render(true);
		});

		html.find(".add-weapon-tag").click((ev) => {
			const curTarget = $(ev.target).closest(".add-weapon-tag");
			const addWeaponTagNameEle = $(curTarget).siblings(".add-weapon-tag-name");
			const newtagKey = addWeaponTagNameEle.find("select").first().val();
			const newValue = $(curTarget).siblings(".add-weapon-tag-value").children("input").first().val();

			if (!newtagKey) {
				return;
			}

			const newTagName = this.tagTypes[newtagKey].hasCustomName
				? addWeaponTagNameEle.find("input").first().val()
				: this.tagTypes[newtagKey].name;

			const tags = Object.keys(this.item.data.data.tags);
			if (newTagName && tags.includes(newTagName)) {
				return;
			}

			this.item.update({
				[`data.tags.${newTagName}`]: newValue || null,
			});
		});
		html.find(".delete-weapon-tag").click((ev) => {
			const curTarget = $(ev.target).closest(".delete-weapon-tag");
			const tagName = curTarget.data("tagName");
			this.item.update({
				[`data.tags.-=${tagName}`]: null,
			});
		});
	}

	_getCustomTagName(addWeaponTagNameEle) {
		const newTagName = addWeaponTagNameEle.children("input").first().val();
		if (Object.values(tagTypes).some((x) => x.name.toLowerCase() === newTagName.toLowerCase())) {
			return null;
		}
		return newTagName;
	}
}
