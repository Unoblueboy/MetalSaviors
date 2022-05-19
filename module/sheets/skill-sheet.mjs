/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MetalSaviorsSkillSheet extends ItemSheet {
    /** @override */
    get template() {
        const path = "systems/metalsaviors/templates/item";
        return `${path}/skill-${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.item.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        context.data = itemData.data;

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
        if (this.item.type !== "atbSkill") return;
        for (const [attribute, bonus] of Object.entries(context.data.attributeBonuses)) {
            context.data.attributeBonuses[attribute] = {
                value: bonus
            }
            context.data.attributeBonuses[attribute].label = game.i18n.localize(CONFIG.METALSAVIORS.attributes[attribute]) ?? attribute;
        }

        for (const [derivedAttribute, bonus] of Object.entries(context.data.derivedAttributeBonuses)) {
            context.data.derivedAttributeBonuses[derivedAttribute] = {
                value: bonus
            }
            context.data.derivedAttributeBonuses[derivedAttribute].label = game.i18n.localize(CONFIG.METALSAVIORS.derivedAttributes[derivedAttribute]) ?? derivedAttribute;
        }
    }


    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Roll handlers, click handlers, etc. would go here.
    }
}