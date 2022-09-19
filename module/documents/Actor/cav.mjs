import { MetalSaviorsActor } from "./actor.mjs";

export class MetalSaviorsCav extends MetalSaviorsActor {
	get pilot() {
		const pilotId = this.getFlag("metalsaviors", "pilotId");
		return pilotId ? game.actors.get(pilotId) : null;
	}

	set pilot(value) {
		const pilotId = value.id;
		this.setFlag("metalsaviors", pilotId);
	}
}
