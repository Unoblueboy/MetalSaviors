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
			submitOnChange: true,
		});
	}

	/** @override */
	get template() {
		return `systems/metalsaviors/templates/actor/actor-${this.actor.type}-sheet.hbs`;
	}

	get cav() {
		return this.actor;
	}

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		context.system = foundry.utils.deepClone(this.cav.system);

		this.preparePilotData(context);

		return context;
	}

	preparePilotData(context) {
		const pilot = this.cav.pilot;
		context.hasPilot = !!pilot;

		if (!pilot) return;

		context.attributeLabels = {};
		for (let [k] of Object.entries(context.system.attributes)) {
			context.attributeLabels[k] = game.i18n.localize(CONFIG.METALSAVIORS.attributes[k]) ?? k;
		}

		context.pilot = { name: pilot.name };
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
			const bonus = this.cav.system.cavUnitPiloting[prevName];
			this.cav.update({
				[`system.cavUnitPiloting.${newName}`]: bonus,
				[`system.cavUnitPiloting.-=${prevName}`]: null,
			});
		});
		html.find(".add-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".add-cav-unit-skill");
			const newName = $(curTarget).siblings(".add-cav-unit-skill-name").children("input").first().val();
			const newValue = $(curTarget).siblings(".add-cav-unit-skill-value").children("input").first().val();

			if (!newName || !newValue) {
				return;
			}

			const cavUnitPilotingSkills = Object.keys(this.cav.system.cavUnitPiloting);
			if (cavUnitPilotingSkills.includes(newName)) {
				return;
			}

			const bonus = Number.parseInt(newValue);
			if (!bonus) {
				return;
			}

			this.cav.update({
				[`system.cavUnitPiloting.${newName}`]: bonus,
			});
		});
		html.find(".delete-cav-unit-skill").click((ev) => {
			const curTarget = $(ev.target).parents(".delete-cav-unit-skill");
			const cavSkillName = curTarget.siblings(".cav-skill-name").children("input").val();
			this.cav.update({
				[`system.cavUnitPiloting.-=${cavSkillName}`]: null,
			});
		});
	}
}
