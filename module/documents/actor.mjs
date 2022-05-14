import { 
  attributeCalculator, 
  healthCalculator, 
  enduranceCalculator,
  derivedAttributeCalculator,
  skillsCalculator } from "./helpers/Calculators.mjs"

import {generateSkillKey} from "../helpers/KeyGenerator.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MetalSaviorsActor extends Actor {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
    const actorData = this.data;
    const itemsData = [...this.items].map(x => x.data);
    this._prepareCharacterSkillsData(actorData, itemsData)
  }

  _prepareCharacterSkillsData(actorData, itemsData){
    if (actorData.type !== 'character') return;

    let differentialUpdate = {};
    
    // Check for new items
    for (const item of itemsData){
      if (CONFIG.METALSAVIORS.skillTypes.includes(item.type)){
        const itemName = item.name;
        console.log(itemName)
        let idList = [...Object.keys((actorData.data.skills[itemName] ?? {}))]
        const newSkill={
          id: item._id,
          name: itemName,
          background: '',
          backgroundBonuses: 0,
          isBackgroundSkill: false
        };

        if (!Object.keys(actorData.data.skills).includes(itemName)){
          actorData.data.skills[itemName] = {baseStats: {
            baseValue: item.data.baseValue,
            levelIncrease: item.data.levelIncrease
          }};
          actorData.data.skills[itemName][item._id] = newSkill;
          differentialUpdate[`data.skills.${itemName}`] = {
            "baseStats": {
              baseValue: item.data.baseValue,
            levelIncrease: item.data.levelIncrease
            },
            [`${item._id}`]: newSkill
          };
          // differentialUpdate[`data.skills.${itemName}.${item._id}`] = newSkill;
        } else if (!idList.includes(item._id)) {
          actorData.data.skills[itemName][item._id] = newSkill;
          differentialUpdate[`data.skills.${itemName}.${item._id}`] = newSkill;
        }
      }
    }

    // check for deletions
    for (const baseItemName of [...Object.keys(actorData.data.skills)]){
      const baseItemCollection = actorData.data.skills[baseItemName];
      console.log(baseItemCollection);
      for (const [id, baseItemData] of Object.entries(baseItemCollection)) {
        if (id === "baseStats") {
          continue;
        }

        var item = this.items.get(id);
        if (!item) {
          delete baseItemCollection[id];
          differentialUpdate[`data.skills.${baseItemName}.-=${id}`] = "Yeeted";
        }
      }
      //may have baseStats Key
      if (Object.keys(baseItemCollection).length <= 1) {
        differentialUpdate[`data.skills.-=${baseItemName}`] = "Yeeted";
        delete actorData.data.skills[baseItemName];
      } 
    }
    if (Object.keys(differentialUpdate).length > 0) {
      this.update(differentialUpdate);
    }
    console.log("differentialUpdate", differentialUpdate);
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