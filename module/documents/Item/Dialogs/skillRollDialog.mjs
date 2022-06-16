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

		this.skill = data.skill;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/item/skill/dialog/skill-roll-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Roll Skill";
	}

	static async getSkillOptions(skill) {
		return new Promise((resolve) => {
			new MetalSaviorsSkillRollDialog(
				{
					normalCallback: (html) => resolve(this._processInitiativeOptions(html[0].querySelector("form"))),
					cancelCallback: (html) => resolve({ cancelled: true }),
					skill: skill,
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
		if (!this.skill) {
			return data;
		}

		console.log(this.skill);

		data.name = this.skill.name;
		data.value = this.skill.data.data.value;
		return data;
	}
}
