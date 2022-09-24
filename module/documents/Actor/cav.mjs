import { MetalSaviorsActor } from "./actor.mjs";

export class MetalSaviorsCav extends MetalSaviorsActor {
	get pilot() {
		const pilotId = this.getFlag("metalsaviors", "pilotId");
		return pilotId ? game.actors.get(pilotId) : null;
	}

	async setPilot(actor) {
		if (actor.type !== "character") return;
		const pilotId = actor.id;

		const existingPilot = this.pilot;

		if (!existingPilot) {
			ui.notifications.info(`The CAV ${this.name} has been assigned to Character ${actor.name}`);
			actor.addCav(this);
			await this.setFlag("metalsaviors", "pilotId", pilotId);
			return;
		}

		if (existingPilot.id === actor.id) {
			ui.notifications.info(`The CAV ${this.name} was already assigned to Character ${actor.name}`);
			return;
		}

		// Final Case, Cav switching Actor
		ui.notifications.info(
			`The CAV ${this.name} was already assigned to Character ${existingPilot.name} ` +
				`now assigning to Character ${actor.name}`
		);

		await existingPilot.deleteCav(this);
		await actor.addCav(this);
		await this.setFlag("metalsaviors", "pilotId", pilotId);
	}

	async deletePilot() {
		await this.setFlag("metalsaviors", "pilotId", null);
		if (this.pilot) this.pilot.deleteCav(this);
	}

	_preDelete(options, user) {
		super._preDelete(options, user);
		if (this.pilot) this.pilot.deleteCav(this);
	}

	prepareDerivedData() {
		this.preparePilotData();
	}

	preparePilotData() {
		if (!this.pilot) return;

		const requiredLicense = this.system.requiredLicense;

		// Prepare Pilot Data if not already prepared
		const pilotNotPrepared = Object.values(this.pilot.system.attributes).some((x) => !x.value && x.value !== 0);
		if (pilotNotPrepared) {
			this.pilot.prepareData();
		}

		const pilotAttributes = foundry.utils.deepClone(this.pilot.system.attributes);
		const pilotLearnedSkills = this.pilot.itemTypes["learnedSkill"];
		const pilotLicenses = this.pilot.itemTypes["pilotLicense"].map((license) => license.name);

		const canPilot = pilotLicenses.includes(requiredLicense);

		const cavAttributes = Object.fromEntries(
			Object.keys(pilotAttributes).map((attr) => [
				attr,
				{
					value: canPilot ? pilotAttributes[attr].value : pilotAttributes[attr].value - 2,
				},
			])
		);

		// TODO: Consider CAV Unit Piloting
		const cavLearnedSkills = Object.fromEntries(
			pilotLearnedSkills.map((skill) => [
				skill.id,
				{
					name: skill.name,
					value: canPilot ? skill.system.value : skill.system.value - 15,
				},
			])
		);

		this.system.attributes = cavAttributes;
		this.system.learnedSkills = cavLearnedSkills;
		this.system.canPilot = canPilot;
	}
}
