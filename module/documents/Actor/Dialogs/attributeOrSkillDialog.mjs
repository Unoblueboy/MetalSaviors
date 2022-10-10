export class MetalSaviorsAttributeRollDialog extends Dialog {
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

		this.attributeData = data.attributeData;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/metalsaviors/templates/actor/dialog/attribute-check-dialog.hbs",
		});
	}

	get title() {
		return this.data.title || "Roll Attribute";
	}

	static async getAttributeOptions(attributeData) {
		return new Promise((resolve) => {
			new MetalSaviorsAttributeRollDialog(
				{
					normalCallback: (html) => resolve(this._processOptions(html[0].querySelector("form"))),
					cancelCallback: () => resolve({ cancelled: true }),
					attributeData: attributeData,
				},
				null
			).render(true);
		});
	}

	static _processOptions(form) {
		const rollType = form.rollType.value;
		switch (rollType) {
			case "skill":
				return {
					name: form.name.value || "",
					value: parseInt(form.skillValue.value || 0),
					difficultyPenalty: parseInt(form.difficultyPenalty.value || 0),
					rollAsSkill: true,
				};
			case "attribute":
				return {
					name: form.name.value || "",
					value: parseInt(form.attributeValue.value || 0),
				};
			default:
				return {};
		}
	}

	getData(options) {
		const data = super.getData(options);
		if (!this.attributeData) {
			return data;
		}

		data.name = this.attributeData.name;
		data.skillValue = this.attributeData.skillValue;
		data.attributeValue = this.attributeData.attributeValue;
		return data;
	}

	activateListeners(html) {
		super.activateListeners(html);

		const difficultyPenaltyDiv = html.find(".difficulty-penalty-div").get(0);
		const skillValueInput = html.find("input[name='skillValue']").get(0);
		const attributeValueInput = html.find("input[name='attributeValue']").get(0);
		html.find(".roll-type-select").change((ev) => {
			const rollType = ev.target.value;
			switch (rollType) {
				case "skill":
					difficultyPenaltyDiv.style.visibility = "visible";
					skillValueInput.type = "number";
					attributeValueInput.type = "hidden";
					return;
				case "attribute":
					difficultyPenaltyDiv.style.visibility = "hidden";
					skillValueInput.type = "hidden";
					attributeValueInput.type = "number";
					return;
				default:
					return;
			}
		});
	}
}
