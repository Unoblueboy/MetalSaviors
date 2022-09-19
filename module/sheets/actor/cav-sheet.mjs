export class MetalSaviorsCavSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["metalsaviors", "sheet", "actor"],
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: "form",
					initial: "pilot",
				},
			],
			submitOnChange: false,
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-${this.actor.type}-sheet.hbs`;
	}

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		context.system = foundry.utils.deepClone(this.actor.system);

		return context;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		html.find(".cav-skill-name input").change((ev) => {
			const newName = ev.target.value;
			const prevName = $(ev.target).parents(".cav-skill-name").data("prevName");

			if (newName === prevName) {
				return;
			}
			const bonus = this.actor.system.cavUnitPiloting[prevName];
			this.actor.update({
				[`system.cavUnitPiloting.${newName}`]: bonus,
				[`system.cavUnitPiloting.-=${prevName}`]: null,
			});
		});
		html.find(".add-cav-unit-skill").click((ev) => {
			console.log("add-cav-unit-skill");

			const curTarget = $(ev.target).parents(".add-cav-unit-skill");
			const newName = $(curTarget).siblings(".add-cav-unit-skill-name").children("input").first().val();
			const newValue = $(curTarget).siblings(".add-cav-unit-skill-value").children("input").first().val();

			if (!newName || !newValue) {
				return;
			}

			const cavUnitPilotingSkills = Object.keys(this.actor.system.cavUnitPiloting);
			if (cavUnitPilotingSkills.includes(newName)) {
				return;
			}

			const bonus = Number.parseInt(newValue);
			if (!bonus) {
				return;
			}

			this.actor.update({
				[`system.cavUnitPiloting.${newName}`]: bonus,
			});
		});
		html.find(".delete-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".delete-cav-unit-skill");
			const cavSkillName = curTarget.siblings(".cav-skill-name").children("input").val();
			this.actor.update({
				[`system.cavUnitPiloting.-=${cavSkillName}`]: null,
			});
		});

		html.find(".cav-trait-name input").change((ev) => {
			const newName = ev.target.value;
			const prevName = $(ev.target).parents(".cav-trait-name").data("prevName");

			if (newName === prevName) {
				return;
			}
			const bonus = this.actor.system.traits[prevName];
			this.actor.update({
				[`system.traits.${newName}`]: bonus,
				[`system.traits.-=${prevName}`]: null,
			});
		});
		html.find(".add-cav-trait").click((ev) => {
			const curTarget = $(ev.target).parents(".add-cav-trait");
			const newName = $(curTarget).siblings(".add-cav-trait-name").children("input").first().val();
			const newValue = $(curTarget).siblings(".add-cav-trait-value").children("textarea").first().val();

			if (!newName || !newValue) {
				return;
			}

			const traits = Object.keys(this.actor.system.traits);
			if (traits.includes(newName)) {
				return;
			}

			const traitDescription = newValue;
			if (!traitDescription) {
				return;
			}

			this.actor.update({
				[`system.traits.${newName}`]: traitDescription,
			});
		});
		html.find(".delete-cav-trait").click((ev) => {
			const curTarget = $(ev.target).parents(".delete-cav-trait");
			const traitName = curTarget.siblings(".cav-trait-name").children("input").val();
			this.actor.update({
				[`system.traits.-=${traitName}`]: null,
			});
		});
	}
}
