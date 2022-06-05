export class MetalSaviorsWeapon extends Item {
	getDamageRoll() {
		throw new Error("The method getDamageRoll has not been implemented");
	}

	getToHitRoll() {
		throw new Error("The method getToHitRoll has not been implemented");
	}

	_onCreate(data, options, userId) {
		super._onCreate(data, options, userId);

		if (!this.actor) {
			return;
		}

		if (this.actor.type !== "character") {
			return;
		}

		this.setFlag("metalsaviors", "owner", { type: "pilot", id: this.actor.id });
	}

	getOwner() {
		return this.getFlag("metalsaviors", "owner");
	}

	setOwner(ownerId) {
		if (!this.actor) {
			return;
		}

		this.setFlag("metalsaviors", "owner", { type: ownerId === this.actor.id ? "pilot" : "cav", id: ownerId });
	}
}
