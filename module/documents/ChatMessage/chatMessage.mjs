import { rollDamage } from "../../helpers/roll.mjs";

export class MetalSaviorsChatMessage extends ChatMessage {
	static activateListeners(html) {
		html.find(".damage-roll").click((ev) => {
			const target = $(ev.target);
			const dataDiv = target.find("[data-formula]").add(target.filter("[data-formula]")).first();
			const data = dataDiv.data();

			rollDamage(data);
		});
	}
}
