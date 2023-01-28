import { rollDamage } from "../../helpers/roll.mjs";

export class MetalSaviorsChatMessage extends ChatMessage {
	static activateListeners(html) {
		html.find(".damage-roll").click((ev) => {
			const target = $(ev.target);
			const dataDiv = target.find("[data-formula]").add(target.filter("[data-formula]")).first();
			const data = {
				formula: dataDiv.data("formula"),
				damageType: dataDiv.data("damageType"),
			};

			const actorDataDiv = target.closest(".metalSaviors");
			const actorId = actorDataDiv.data("actorId");
			const actor = game.actors.get(actorId) ?? null;

			rollDamage(actor, data);
		});
	}
}
