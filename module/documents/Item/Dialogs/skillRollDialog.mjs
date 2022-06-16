export class MetalSaviorsSkillRollDialog extends Dialog {
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

		this.skillData = data.skillData;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/item/skill/dialog/skill-roll-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Roll Skill";
	}

	static async getSkillOptions(skillData) {
		return new Promise((resolve) => {
			new MetalSaviorsSkillRollDialog(
				{
					normalCallback: (html) => resolve(this._processInitiativeOptions(html[0].querySelector("form"))),
					cancelCallback: (html) => resolve({ cancelled: true }),
					skillData: skillData,
				},
				null
			).render(true);
		});
	}

	static _processInitiativeOptions(form) {
		return {
			name: parseInt(form.name.value || 0),
			value: parseInt(form.value.value || 0),
			difficultyPenalty: parseInt(form.difficultyPenalty.value || 0),
		};
	}

	getData(options) {
		const data = super.getData(options);
		if (!this.skillData) {
			return data;
		}

		data.name = this.skillData.name;
		data.value = this.skillData.value;
		return data;
	}
}
