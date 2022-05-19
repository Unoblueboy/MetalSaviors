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
    console.log("Prepare Actor Data");
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
    const allSkillItems = itemsData.filter(itm => itm.type === "learnedSkill")
    // Check for new items
    for (const item of allSkillItems){
      const baseItemName = item.name;
      const itemId = item._id;

      let idList = [...Object.keys((actorData.data.skills[baseItemName] ?? {}))]
      const newSkill=this._generateNewSkill(item);

      if (!Object.keys(actorData.data.skills).includes(baseItemName)){
        // New Base Item Added that wasn't previously there
        actorData.data.skills[baseItemName] = {
          baseStats: this._generateBaseData(item),
        };
        actorData.data.skills[baseItemName][itemId] = newSkill;
        differentialUpdate[`data.skills.${baseItemName}`] = {
          baseStats: this._generateBaseData(item),
          [`${itemId}`]: newSkill
        };
        continue;
      }
      if (!idList.includes(itemId)) {
        // New Base Item Added was previously there
        actorData.data.skills[baseItemName][itemId] = newSkill;
        differentialUpdate[`data.skills.${baseItemName}.${itemId}`] = newSkill;
        continue;
      }
      
      // Base Item existed previously, check for skill name updates
      const itemName = actorData.data.skills[baseItemName][itemId].name;
      if ((itemName !== baseItemName) && !Object.keys(actorData.data.skills[baseItemName].baseStats).includes(itemName)) {
        actorData.data.skills[baseItemName].baseStats[itemName] = {
          baseValue: item.data.baseValue,
          levelIncrease: item.data.levelIncrease,
          otherBonuses: 0,
          override: false,
          overrideValue: 0,
        }
      }
    }

    // check for deletions
    for (const baseItemName of [...Object.keys(actorData.data.skills)]){
      const itemCollection = actorData.data.skills[baseItemName];
      console.log(itemCollection);
      for (const [id, itemData] of Object.entries(itemCollection)) {
        if (id === "baseStats") {
          for (const itemName of Object.keys(itemData)) {
            if (itemName == "skillType") {
              continue;
            }

            if (Object.values(itemCollection).every(itm => itm.name !== itemName)){
              delete actorData.data.skills[baseItemName].baseStats[itemName];
              differentialUpdate[`data.skills.${baseItemName}.baseStats.-=${itemName}`] = "Yeeted";
            }
          }
          continue;
        }

        var baseItem = this.items.get(id);
        if (!baseItem) {
          delete itemCollection[id];
          differentialUpdate[`data.skills.${baseItemName}.-=${id}`] = "Yeeted";
        }
      }
      //may have baseStats Key
      if (Object.keys(itemCollection).length <= 1) {
        differentialUpdate[`data.skills.-=${baseItemName}`] = "Yeeted";
        delete actorData.data.skills[baseItemName];
      }

      // TODO: Consider deletion of keys in BaseStats for generic skills
    }
    
    if (Object.keys(differentialUpdate).length > 0) {
      this.update(differentialUpdate);
    }
    console.log("differentialUpdate", differentialUpdate);
  }

  _generateBaseData(item) {
    return {
      [`${item.name}`] :{
        baseValue: item.data.baseValue,
        levelIncrease: item.data.levelIncrease,
        otherBonuses: 0,
        override: false,
        overrideValue: 0,
      },
      skillType: item.type
    };
  }

  _generateNewSkill(item) {
    return {
      id: item._id,
      name: item.name,
      background: '',
      backgroundBonuses: 0,
      isBackgroundSkill: false
    };
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