// Import document classes.
import { MetalSaviorsActor } from "./documents/Actor/actor.mjs";
import { MetalSaviorsItem } from "./documents/Item/item.mjs";
import { MetalSaviorsCav } from "./documents/Item/cav.mjs";
import { MetalSaviorsItemProxy } from "./documents/Item/itemProxy.mjs";
import { MetalSaviorsCombatant } from "./documents/Combat/Combatant.mjs";
import { MetalSaviorsCombat } from "./documents/Combat/Combat.mjs";
// Import sheet classes.
import { MetalSaviorsActorSheet } from "./sheets/actor/actor-sheet.mjs";
import { MetalSaviorsItemSheet } from "./sheets/item/item-sheet.mjs";
import { MetalSaviorsSkillSheet } from "./sheets/item/skill-sheet.mjs";
import { MetalSaviorsCavSheet } from "./sheets/item/cav-sheet.mjs";
import { MetalSaviorsInfantrySheet } from "./sheets/actor/infantry-sheet.mjs";
import { MetalSaviorsVehicleSheet } from "./sheets/actor/vehicle-sheet.mjs";
import { MetalSaviorsPikeSheet } from "./sheets/actor/pike-sheet.mjs";
import { MetalSaviorsWeaponSheet } from "./sheets/item/weapon-sheet.mjs";
// Import ui classes.
import { MetalSaviorsCombatTracker } from "./documents/Combat/CombatTracker.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { METALSAVIORS } from "./helpers/config.mjs";
import { MetalSaviorsDroneSheet } from "./sheets/actor/drone-sheet.mjs";
import { MetalSaviorsChatMessage } from "./documents/ChatMessage/chatMessage.mjs";
import { MetalSaviorsBlankSheet } from "./sheets/actor/blank-sheet.mjs";
import { MetalSaviorsConceptSheet } from "./sheets/item/concept-sheet.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
	// Add utility classes to the global game object so that they're more easily
	// accessible in global contexts.
	game.metalsaviors = {
		MetalSaviorsActor,
		MetalSaviorsItem,
		MetalSaviorsCav,
		rollItemMacro,
	};

	// Add custom constants for configuration.
	CONFIG.METALSAVIORS = METALSAVIORS;

	// Define custom Document classes
	CONFIG.Actor.documentClass = MetalSaviorsActor;
	CONFIG.Item.documentClass = MetalSaviorsItemProxy;
	CONFIG.Combat.documentClass = MetalSaviorsCombat;
	CONFIG.Combatant.documentClass = MetalSaviorsCombatant;
	CONFIG.ChatMessage.documentClass = MetalSaviorsChatMessage;
	CONFIG.ui.combat = MetalSaviorsCombatTracker;
	CONFIG.time.roundTime = 10;

	// Add new data-dtypes
	window.Dice = (value) => {
		if (Roll.validate(value)) {
			return value;
		}
		return null;
	};

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("metalsaviors", MetalSaviorsActorSheet, {
		makeDefault: true,
	});
	Actors.registerSheet("metalsaviors", MetalSaviorsInfantrySheet, {
		types: ["infantry"],
		makeDefault: true,
	});
	Actors.registerSheet("metalsaviors", MetalSaviorsVehicleSheet, {
		types: ["vehicle"],
		makeDefault: true,
	});
	Actors.registerSheet("metalsaviors", MetalSaviorsPikeSheet, {
		types: ["pike"],
		makeDefault: true,
	});
	Actors.registerSheet("metalsaviors", MetalSaviorsDroneSheet, {
		types: ["drone"],
		makeDefault: true,
	});
	Actors.registerSheet("metalsaviors", MetalSaviorsBlankSheet, {
		types: ["blank"],
		makeDefault: true,
	});

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("metalsaviors", MetalSaviorsItemSheet, {
		makeDefault: true,
	});
	Items.registerSheet("metalsaviors", MetalSaviorsSkillSheet, {
		types: ["learnedSkill", "atbSkill", "combatTraining", "weaponProficiency", "pilotLicense"],
		makeDefault: true,
	});
	Items.registerSheet("metalsaviors", MetalSaviorsCavSheet, {
		types: ["cav"],
		makeDefault: true,
	});
	Items.registerSheet("metalsaviors", MetalSaviorsWeaponSheet, {
		types: ["weapon"],
		makeDefault: true,
	});
	Items.registerSheet("metalsaviors", MetalSaviorsConceptSheet, {
		types: ["concept"],
		makeDefault: true,
	});

	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper("concat", function () {
	var outStr = "";
	for (var arg in arguments) {
		if (typeof arguments[arg] != "object") {
			outStr += arguments[arg];
		}
	}
	return outStr;
});

Handlebars.registerHelper("toLowerCase", function (str) {
	return str.toLowerCase();
});

Handlebars.registerHelper("len", function (json) {
	return Object.keys(json).length;
});

Handlebars.registerHelper("and", function (cond1, cond2) {
	return cond1 && cond2;
});

Handlebars.registerHelper("or", function (cond1, cond2) {
	return cond1 || cond2;
});

Handlebars.registerHelper("not", function (cond) {
	return !cond;
});

Handlebars.registerHelper("any", function (...args) {
	for (var i = 0; i < args.length - 1; i++) {
		if (args[i]) {
			return true;
		}
	}
	return false;
});

Handlebars.registerHelper("all", function (...args) {
	for (var i = 0; i < args.length - 1; i++) {
		if (!args[i]) {
			return false;
		}
	}
	return true;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

	Hooks.on("dropActorSheetData", (actor, sheet, data) =>
		MetalSaviorsActor.EnforceStrictItemUniqueness(actor, sheet, data)
	);
	Hooks.on("dropActorSheetData", (actor, sheet, data) => MetalSaviorsActor.EnforceItemUniqueness(actor, sheet, data));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
	if (data.type !== "Item") return;
	if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
	const item = data.data;

	// Create the macro command
	const command = `game.metalsaviors.rollItemMacro("${item.name}");`;
	let macro = game.macros.find((m) => m.name === item.name && m.command === command);
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: "script",
			img: item.img,
			command: command,
			flags: { "metalsaviors.itemMacro": true },
		});
	}
	game.user.assignHotbarMacro(macro, slot);
	return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
	const speaker = ChatMessage.getSpeaker();
	let actor;
	if (speaker.token) actor = game.actors.tokens[speaker.token];
	if (!actor) actor = game.actors.get(speaker.actor);
	const item = actor ? actor.items.find((i) => i.name === itemName) : null;
	if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

	// Trigger the item roll
	return item.roll();
}
