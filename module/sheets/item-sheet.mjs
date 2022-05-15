/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["metalsaviors", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/metalsaviors/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();
    
    console.log("Context pre manip", foundry.utils.deepClone(context));

    // Use a safe clone of the item data for further operations.
    const itemData = JSON.parse(JSON.stringify(context.item.data));

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;

    // Add localisation data for attributeSkills
    this._prepareAtbSkills(context);

    // Add some rendering options to the context
    this.renderOptions = this.renderOptions ?? {
      isEditing: false
    };
    context.renderOptions = this.renderOptions;

    return context;
  }

  _prepareAtbSkills(context) {
    for (const [attribute, bonus] of Object.entries(context.data.attributeBonuses)) {
      context.data.attributeBonuses[attribute] = {value: bonus}
      context.data.attributeBonuses[attribute].label = game.i18n.localize(CONFIG.METALSAVIORS.attributes[attribute]) ?? attribute;
    }

    for (const [derivedAttribute, bonus] of Object.entries(context.data.derivedAttributeBonuses)) {
      context.data.derivedAttributeBonuses[derivedAttribute] = {value: bonus}
      context.data.derivedAttributeBonuses[derivedAttribute].label = game.i18n.localize(CONFIG.METALSAVIORS.derivedAttributes[derivedAttribute]) ?? derivedAttribute;
    }
  }


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Edit Button
    html.find('.edit-button').click(ev => {
      this.renderOptions.isEditing = !this.renderOptions.isEditing;
      this.render(true);
    });

    html.find('.delete-skill-bonus').click(ev => {
      const dataset = ev.currentTarget.dataset;
      console.log(ev.currentTarget);
      const skillName = dataset.skillName;
      console.log(skillName);
      this.item.update({[`data.skillBonuses.-=${skillName}`]: "Yeeted"})
    });

    html.find('.add-skill-bonus').click(ev => {
      const target = ev.currentTarget;
      const input = $(target).parent().parent().find("td input")[0];
      const inpValue = input?.value;

      if (!inpValue || inpValue ==="") {
        return;
      }

      this.item.update({[`data.skillBonuses.${inpValue}`]: 0})
    });
    // Roll handlers, click handlers, etc. would go here.
  }
}
