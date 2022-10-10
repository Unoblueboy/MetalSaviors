// Import document classes.
import { MetalSaviorsActor } from "./documents/Actor/actor.mjs";
import { MetalSaviorsItem } from "./documents/Item/item.mjs";
import { MetalSaviorsCav } from "./documents/Item/cav.mjs";
import { MetalSaviorsItemProxy } from "./documents/Item/itemProxy.mjs";
import { MetalSaviorsCombatant } from "./documents/Combat/Combatant.mjs";
import { MetalSaviorsCombat } from "./documents/Combat/Combat.mjs";
// Import sheet classes.
import { MetalSaviorsCharacterSheet } from "./sheets/actor/character-sheet.mjs";
import { MetalSaviorsItemSheet } from "./sheets/item/item-sheet.mjs";
import { MetalSaviorsSkillSheet } from "./sheets/item/skill-sheet.mjs";
import { MetalSaviorsInfantrySheet } from "./sheets/actor/infantry-sheet.mjs";
import { MetalSaviorsVehicleSheet } from "./sheets/actor/vehicle-sheet.mjs";
import { MetalSaviorsPikeSheet } from "./sheets/actor/pike-sheet.mjs";
import { MetalSaviorsWeaponSheet } from "./sheets/item/weapon-sheet.mjs";
import { MetalSaviorsCavSheet } from "./sheets/actor/cav-sheet.mjs";
import { MetalSaviorsModuleSheet } from "./sheets/item/module-sheet.mjs";
// Import ui classes.
import { MetalSaviorsCombatTracker } from "./documents/Combat/CombatTracker.mjs";
import { MetalSaviorsCombatExcessActionsDialog } from "./documents/Combat/Dialogs/CombatExcessActionsDialog.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { METALSAVIORS } from "./helpers/config.mjs";
import { MetalSaviorsDroneSheet } from "./sheets/actor/drone-sheet.mjs";
import { MetalSaviorsChatMessage } from "./documents/ChatMessage/chatMessage.mjs";
import { MetalSaviorsBlankSheet } from "./sheets/actor/blank-sheet.mjs";
import { MetalSaviorsConceptSheet } from "./sheets/item/concept-sheet.mjs";
import { MetalSaviorsToken } from "./documents/Scenes/Token/Token.mjs";
import { GridOverlayLayer } from "./documents/Scenes/Layers/GridOverlayLayer.mjs";
import { MetalSaviorsActorProxy } from "./documents/Actor/actorProxy.mjs";
import { MetalSaviorsCharacter } from "./documents/Actor/character.mjs";

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
		MetalSaviorsCombatExcessActionsDialog,
		rollItemMacro,
	};

	// Add custom constants for configuration.
	CONFIG.METALSAVIORS = METALSAVIORS;

	// Set Debug = true
	CONFIG.debug.documents = true;

	// Define custom Document classes
	CONFIG.Actor.documentClass = MetalSaviorsActorProxy;
	CONFIG.Item.documentClass = MetalSaviorsItemProxy;
	CONFIG.Combat.documentClass = MetalSaviorsCombat;
	CONFIG.Combatant.documentClass = MetalSaviorsCombatant;
	CONFIG.ChatMessage.documentClass = MetalSaviorsChatMessage;
	CONFIG.Token.objectClass = MetalSaviorsToken;
	CONFIG.ui.combat = MetalSaviorsCombatTracker;
	CONFIG.time.roundTime = 10;
	addGridOverlayLayer();

	// Add new data-dtypes
	window.Dice = (value) => {
		if (Roll.validate(value)) {
			return value;
		}
		return null;
	};

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("metalsaviors", MetalSaviorsCharacterSheet, {
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
	Actors.registerSheet("metalsaviors", MetalSaviorsCavSheet, {
		types: ["cav"],
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
	Items.registerSheet("metalsaviors", MetalSaviorsWeaponSheet, {
		types: ["weapon"],
		makeDefault: true,
	});
	Items.registerSheet("metalsaviors", MetalSaviorsConceptSheet, {
		types: ["concept"],
		makeDefault: true,
	});
	Items.registerSheet("metalsaviors", MetalSaviorsModuleSheet, {
		types: ["module"],
		makeDefault: true,
	});

	// Add system settings
	game.settings.register("metalsaviors", "facingOverlayLength", {
		name: "Facing Overlay Length",
		hint:
			"The length of the facing overlay displayed when a token is hovered over. " +
			"If the length is 0, then no facing overlays will be displayed",
		scope: "client",
		config: true,
		type: Number,
		range: {
			min: 0,
			max: 100,
			step: 1,
		},
		default: 10,
		onChange: () => {
			if (!game.scenes.active) return;
			game.scenes.active.tokens.forEach((x) => x.object.refresh());
		},
	});
	game.settings.register("metalsaviors", "facingOverlayOpacity", {
		name: "Facing Overlay Opacity",
		hint:
			"The Opacity of the facing overlay displayed when a token is hovered over. " +
			"If the Opacity is 0, then no facing overlays will be displayed",
		scope: "client",
		config: true,
		type: Number,
		range: {
			min: 0,
			max: 100,
		},
		default: 50,
		onChange: () => {
			if (!game.scenes.active) return;
			game.scenes.active.tokens.forEach((x) => x.object.refresh());
		},
	});
	game.settings.register("metalsaviors", "weaponRangeOverlayOpacity", {
		name: "Weapon Range Overlay Opacity",
		hint:
			"The Opacity of the weapon range overlay displayed when a token is hovered over. " +
			"If the Opacity is 0, then no weapon range overlays will be displayed",
		scope: "client",
		config: true,
		type: Number,
		range: {
			min: 0,
			max: 100,
		},
		default: 50,
		onChange: () => {
			if (!game.scenes.active) return;
			game.scenes.active.tokens.forEach((x) => x.object.refresh());
		},
	});

	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
});

function addGridOverlayLayer() {
	CONFIG.Canvas.layers.gridOverlay = {
		layerClass: GridOverlayLayer,
		group: "interface",
	};
}

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
	return Object.keys(json ?? {}).length;
});

Handlebars.registerHelper("and", function (cond1, cond2) {
	return !!cond1 && !!cond2;
});

Handlebars.registerHelper("or", function (cond1, cond2) {
	return !!cond1 || !!cond2;
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
/*  Socket Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("socketlib.ready", () => {
	globalThis.socket = globalThis.socketlib.registerSystem("metalsaviors");

	globalThis.socket.register("Actor.Copy", MetalSaviorsActor.copy);
	globalThis.socket.register("Combat.pushHistory", MetalSaviorsCombat.pushHistory);
	globalThis.socket.register("Combat.nextTurn", MetalSaviorsCombat.nextTurn);
	globalThis.socket.register("Combat.previousTurn", MetalSaviorsCombat.previousTurn);
	globalThis.socket.register("Combat.endPlayerRound", MetalSaviorsCombat.endPlayerRound);
	globalThis.socket.register("Combat.spendExcessActions", MetalSaviorsCombat.spendExcessActions);
	globalThis.socket.register(
		"CombatExcessActionsDialog.closeAllDialogs",
		MetalSaviorsCombatExcessActionsDialog.closeAllDialogs
	);
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

	Hooks.on("dropActorSheetData", (actor, sheet, data) => MetalSaviorsCharacter.AddCavActor(actor, sheet, data));

	checkModuleRequirements();
});

function checkModuleRequirements() {
	const requiredModules = [...game.system.relationships.requires];
	for (const requiredModule of requiredModules) {
		const installedModule = game.modules.get(requiredModule.id);
		if (!installedModule) {
			ui.notifications.error(`The module ${requiredModule.id} is not installed. This is required for the system
            Metal Saviors to work, please install and restart this world.`);
			continue;
		}

		if (!installedModule.active) {
			ui.notifications.warn(`The module ${requiredModule.title} is not enabled. This is required for the system
            Metal Saviors to work, please enable.`);
			continue;
		}
	}
}

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
