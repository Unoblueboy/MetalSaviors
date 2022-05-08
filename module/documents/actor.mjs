import { 
  attributeCalculator, 
  healthCalculator, 
  enduranceCalculator,
  derivedAttributeCalculator } from "./helpers/Calculators.mjs"

import { ActorSkill } from "./helpers/ActorSkill.mjs";

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
    this._prepareCharacterItemsData(actorData, itemsData)

    console.log("END prepareBaseData", itemsData);
  }

  _prepareCharacterItemsData(actorData, itemsData){
    if (actorData.type !== 'character') return;

    let updateOccurred = false;
    let differentialUpdate = {};

    console.log("BEGIN _prepareCharacterItemsData", JSON.parse(JSON.stringify(actorData.data)), updateOccurred);
    
    // Check for new items
    let insertionItemNames = new Set();
    for (const item of itemsData){
      if (CONFIG.METALSAVIORS.skillTypes.includes(item.type)){
        const itemName = item.name;
        let idList = (actorData.data.skills[itemName] ?? []).map(x => x.id)

        if (!Object.keys(actorData.data.skills).includes(itemName)){
          actorData.data.skills[itemName] = [{
            id: item._id,
            name: item.name,
          }]
          insertionItemNames.add(itemName);
          updateOccurred = true;
        } else if (!idList.includes(item._id)) {
          actorData.data.skills[itemName].push(
            {
            id: item._id,
            name: item.name,
            }
          )
          insertionItemNames.add(itemName);
          updateOccurred = true;
        }
      }
    }
    insertionItemNames.forEach(itemName => {
      differentialUpdate[`data.skills.${itemName}`] = [...actorData.data.skills[itemName]];
    });

    // check for deletions
    for (const baseItemName of [...Object.keys(actorData.data.skills)]){
      const baseItemArray = actorData.data.skills[baseItemName];
      let deletionOccurred = false;
      for (let i = baseItemArray.length-1; i>= 0; i--) {
        let baseItemData = baseItemArray[i]
        var item = this.items.get(baseItemData.id);
        if (!item) {
          baseItemArray.splice(i, 1);
          updateOccurred = true;
          deletionOccurred = true;
        }
      }
      if (baseItemArray.length == 0) {
        differentialUpdate[`data.skills.-=${baseItemName}`] = "Yeeted";
        delete actorData.data.skills[baseItemName];
        updateOccurred = true;
      } else if (deletionOccurred) {
        differentialUpdate[`data.skills.${baseItemName}`] = baseItemArray;
      }
    }

    console.log("END _prepareCharacterItemsData", actorData.data, "\n", differentialUpdate, "\n", updateOccurred);
    if (updateOccurred) {
      this.update(differentialUpdate);
    }
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

    console.log("END _prepareCharacterData", actorData);
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
    const data = super.getRollData();

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

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
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