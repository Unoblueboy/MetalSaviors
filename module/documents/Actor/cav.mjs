import { MetalSaviorsActor } from "./actor.mjs";
import { METALSAVIORS } from "../../helpers/config.mjs";

export class MetalSaviorsCav extends MetalSaviorsActor {
	get pilot() {
		const pilotId = this.getFlag("metalsaviors", "pilotId");
		return pilotId ? game.actors.get(pilotId) : null;
	}

	get isBaseModel() {
		return this.getFlag("metalsaviors", "isBaseModel");
	}

	get hasPilot() {
		return !!this.pilot;
	}

	async setPilot(actor) {
		if (actor.type !== "character") return;
		const pilotId = actor.id;

		const existingPilot = this.pilot;

		if (!existingPilot) {
			actor.addCav(this);
			await this.setFlag("metalsaviors", "pilotId", pilotId);
			ui.notifications.info(`The CAV ${this.name} has been assigned to Character ${actor.name}`);
			return;
		}

		if (existingPilot.id === actor.id) {
			ui.notifications.info(`The CAV ${this.name} was already assigned to Character ${actor.name}`);
			return;
		}

		// Final Case, Cav switching Actor
		await existingPilot.deleteCav(this);
		await actor.addCav(this);
		await this.setFlag("metalsaviors", "pilotId", pilotId);

		ui.notifications.info(
			`The CAV ${this.name} was already assigned to Character ${existingPilot.name} ` +
				`now assigning to Character ${actor.name}`
		);
	}

	async deletePilot() {
		if (this.pilot) this.pilot.deleteCav(this);
		await this.setFlag("metalsaviors", "pilotId", null);
	}

	_preCreate(data, options, user) {
		super._preCreate(data, options, user);

		if (this.isBaseModel === undefined || this.isBaseModel === null) {
			this.updateSource({
				"flags.metalsaviors.isBaseModel": true,
			});
		}
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

		const cavLearnedSkills = Object.fromEntries(
			pilotLearnedSkills.map((skill) => [
				skill.id,
				{
					name: skill.name,
					value: this._getCavLearnedSkillValue(canPilot, skill),
				},
			])
		);

		this.system.attributes = cavAttributes;
		this.system.learnedSkills = cavLearnedSkills;
		this.system.canPilot = canPilot;
	}

	_onUpdate(data, options, userId) {
		super._onUpdate(data, options, userId);

		if (this.hasPilot) {
			this.pilot.sheet.render(false);
		}
	}

	getRollData() {
		const data = foundry.utils.deepClone(super.getRollData());

		if (this.hasPilot) {
			data.pilot = this.pilot.getRollData();
		}

		return data;
	}

	getInitiativeRoll() {
		if (!this.hasPilot) {
			return "d20";
		}

		return "d20 + @pilot.derivedAttributes.cavInitiativeModifier.value";
	}

	getInitiativeBonus() {
		if (!this.hasPilot) {
			return super.getInitiativeBonus();
		}

		return this.pilot.system.derivedAttributes.cavInitiativeModifier.value;
	}

	_getCavLearnedSkillValue(canPilot, skill) {
		let value = skill.system.value;

		const cavBonus = this.system.cavUnitPiloting[skill.name] ?? 0;
		value += cavBonus;

		if (!canPilot) {
			value -= 15;
		}

		return value;
	}

	getActionsPerRound() {
		if (!this.hasPilot) return METALSAVIORS.combat.defaultActionsPerRound;

		return this.pilot.getActionsPerRound();
	}

	async _getCurMovementSpeedDetails() {
		const token = await this.getToken();
		if (!token) {
			return null;
		}

		const combatant = token.combatant;
		if (!combatant) {
			return null;
		}

		const movementSpeedKey = combatant.getCurMovementSpeedKey();
		return this.system.speed.combatSpeeds[movementSpeedKey];
	}

	async getToHitPenalty() {
		const curMovementSpeedDetails = await this._getCurMovementSpeedDetails();

		if (!curMovementSpeedDetails) {
			return super.getToHitPenalty();
		}

		return curMovementSpeedDetails.hitBonus ?? 0;
	}
}
