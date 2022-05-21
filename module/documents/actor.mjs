import { 
  attributeCalculator, 
  healthCalculator, 
  enduranceCalculator,
  derivedAttributeCalculator,
  skillsCalculator } from "./helpers/Calculators.mjs"

import {generateSkillKey} from "../helpers/KeyGenerator.mjs";
import { SkillHelper } from "./helpers/SkillHelper.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MetalSaviorsActor extends Actor {

  static VerifySkillAddition(actor, sheet, data) {    
    if (data.type !== 'Item') return;

    const item = game.items.get(data.id);

    if (!item) return;

    if (item.type !== 'learnedSkill') return;

    const sameNameSkills = actor.items.filter(x => x.name === item.name);

    if (sameNameSkills.length === 0) return;

    if (sameNameSkills.length > 1) {
      console.log(`Expected there to be at most 1 skill with same name but ${sameNameSkills.length} found`)
    }

    const origSkill = sameNameSkills[0];
    const origSkillData = origSkill.data;

    origSkill.update({"data.numAcquisitions": origSkillData.data.numAcquisitions + 1})
    return false;
  }

  /** @override */
  prepareData() {
    super.prepareData();
    console.log("Prepare Data", JSON.parse(JSON.stringify(this.data)));
  }

  /**
   * @override
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.metalsaviors || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    // this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const data = actorData.data;

    attributeCalculator(actorData, data);
    healthCalculator(actorData, data);
    enduranceCalculator(actorData, data);
    derivedAttributeCalculator(actorData, data);
    skillsCalculator(actorData, data);

    // Learned skills values need to be recalculated to take into account the derived attribute
    this._recalculateLearnedSkillsValue();
  }

  _recalculateLearnedSkillsValue() {
    for (const item of this.items.filter(x => x.type === "learnedSkill")) {
      SkillHelper.prepareDerivedLearnedSkillData(item);
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const data = actorData.data;
    data.xp = (data.cr * data.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Deep Copy data so it doesn't get imported into the character
    const data = foundry.utils.deepClone(super.getRollData());

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type !== 'character') return;

    if (data.derivedSkills) {
      delete data.skills;
      data.skills = {};
      for (let [k, v] of Object.entries(data.derivedSkills)) {
        let newKey = generateSkillKey(k); // .replace(" ", "_")
        data.skills[newKey] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== 'npc') return;

    // Process additional NPC data here.
  }

}