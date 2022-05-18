import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

import {generateSkillKey} from "../helpers/KeyGenerator.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MetalSaviorsActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["metalsaviors", "sheet", "actor"],
      template: "systems/metalsaviors/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/metalsaviors/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Add some rendering options to the context
    this.renderOptions = this.renderOptions ?? {
      isEditing: false
    };
    context.renderOptions = this.renderOptions;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.attributes)) {
      v.label = game.i18n.localize(CONFIG.METALSAVIORS.attributes[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const skills = {
      "learnedSkills": {},
      "atbSkills": {}
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      switch(i.type){
        case 'item':
          gear.push(i);
          break;
        case 'feature':
          features.push(i);
          break;
        case 'learnedSkill':
          skills.learnedSkills[i._id] = i;
          break;
        case 'atbSkill':
          skills.atbSkills[i._id] = i;
          break;
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.skills = skills;

    context.skillsData = {
      learnedSkills: {}
    }
    // rearrange skills for data manipulation
    for (const [baseSkillName, skillCollection] of Object.entries(context.data.skills)) {
      console.log("skillCollection", skillCollection)
      for (const [skillName, baseStats] of Object.entries(skillCollection.baseStats)) {
        if (skillName === "skillType") {
          continue;
        }
        
        context.skillsData.learnedSkills[skillName] = {
          "baseStats": {
            ...baseStats,
            name: skillName,
            baseName: baseSkillName,
          }
        }
        for (const [skillId, skill] of Object.entries(skillCollection)) {
          if (skillId === "baseStats") {
            continue;
          }

          if (skill.name !== skillName) {
            console.log(skillName, skill);
            continue;
          }

          context.skillsData.learnedSkills[skillName][skillId] = skill;
        }
        
      }
    }
   }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Delete Skill
    html.find('.skill-delete').click(ev => {
      const dataset = ev.currentTarget.dataset;
      const skill = this.actor.items.get(dataset.skillId);
      skill.delete();
    });

    // Show Hide editable skill info
    html.find('.base-skill-main-row').click(ev => {
      if (!this.renderOptions.skills){
        this.renderOptions.skills = {};
      }
      const skillsRenderOptions = this.renderOptions.skills;

      const dataset = ev.currentTarget.dataset;
      const skillName = dataset.skillName;
      if (!skillsRenderOptions[skillName]){
        skillsRenderOptions[skillName] = {};
      }
      skillsRenderOptions[skillName].renderAdditionalInfo = !skillsRenderOptions[skillName].renderAdditionalInfo;
      this.render(true);
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Edit Button
    html.find('.edit-button').click(ev => {
      this.renderOptions.isEditing = !this.renderOptions.isEditing;
      this.render(true);
    });

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
      if (dataset.rollType == 'skill') {
        this._rollSkill(dataset.skillName)
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[roll] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  _rollSkill(skillName) {
    let skillKey = generateSkillKey(skillName)
    let roll = new Roll(`d100cs<=@skills.${skillKey}.value`, this.actor.getRollData());
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    roll.evaluate({async:false});
    
    
    const stringContent = this._getRollSkillStringContent(roll);
    roll.toMessage({
      content: stringContent,
      speaker: speaker,
      rollMode: rollMode,
      flavor: `[Skill] ${skillName}`,
    });
    return roll;
  }

  _getRollSkillStringContent(roll) {
    const dieRoll = roll.terms[0].results[0].result;
    
    const isSuccess = roll.total === 1;
    const isCritical = (dieRoll % 11) === 0;
    const resultString = (isCritical ? "Critical " : "") + (isSuccess ? "Success" : "Failure")
    const stringContent = `<div class="dice-roll"><div class="dice-result">
    <div class="dice-formula">${roll.formula}</div>
    <div class="dice-tooltip" style="display: none;">
<section class="tooltip-part">
    <div class="dice">
        <header class="part-header flexrow">
            <span class="part-formula">${roll.formula}</span>
            
            <span class="part-total">${resultString}</span>
        </header>
        <ol class="dice-rolls">
            <li class="roll die d100${isSuccess ? " success" : ""}">${dieRoll}</li>
        </ol>
    </div>
</section>
</div>

    <h4 class="dice-total">${resultString}</h4>
</div></div>`;

    return stringContent;
  }

}
