import { MetalSaviorsActor } from "./actor.mjs";

export class MetalSaviorsInfantry extends MetalSaviorsActor {
	prepareDerivedData() {
		const actorSystem = this.system;
		actorSystem.squadMembers = Math.ceil(actorSystem.health.value / actorSystem.healthPerSquadMember);
	}
}
