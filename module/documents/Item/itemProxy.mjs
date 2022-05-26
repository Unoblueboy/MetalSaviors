import { MetalSaviorsItem } from "./item.mjs";
import { MetalSaviorsSkill } from "./skill.mjs";
import { MetalSaviorsCav } from "./cav.mjs";

//Provide a type string to class object mapping to keep our code clean
const itemMappings = {
	item: MetalSaviorsItem,
	feature: MetalSaviorsSkill,
	learnedSkill: MetalSaviorsSkill,
	atbSkill: MetalSaviorsSkill,
	combatTraining: MetalSaviorsSkill,
	weaponProficiency: MetalSaviorsSkill,
	pilotLicense: MetalSaviorsSkill,
	cav: MetalSaviorsCav,
};

export const MetalSaviorsItemProxy = new Proxy(function () {}, {
	//Will intercept calls to the "new" operator
	construct: function (target, args) {
		const [data] = args;

		//Handle missing mapping entries
		if (!itemMappings.hasOwnProperty(data.type))
			throw new Error(
				"Unsupported Entity type for create(): " + data.type
			);

		//Return the appropriate, actual object from the right class
		return new itemMappings[data.type](...args);
	},

	//Property access on this weird, dirty proxy object
	get: function (target, prop, receiver) {
		switch (prop) {
			case "create":
			case "createDocuments":
				//Calling the class' create() static function
				return function (data, options) {
					if (data.constructor === Array) {
						//Array of data, this happens when creating Actors imported from a compendium
						return data.map((i) =>
							itemMappings[i.type].create(i, options)
						);
					}

					if (!itemMappings.hasOwnProperty(data.type))
						throw new Error(
							"Unsupported Entity type for create(): " + data.type
						);

					return itemMappings[data.type].create(data, options);
				};

			case Symbol.hasInstance:
				//Applying the "instanceof" operator on the instance object
				return function (instance) {
					return Object.values(itemMappings).some(
						(i) => instance instanceof i
					);
				};

			default:
				//Just forward any requested properties to the base Item class
				return Item[prop];
		}
	},
});
