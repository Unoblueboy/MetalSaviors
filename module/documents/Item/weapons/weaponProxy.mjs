import { MetalSaviorsMeleeWeapon } from "./meleeWeapon.mjs";
import { MetalSaviorsRangedWeapon } from "./rangedWeapon.mjs";

//Provide a type string to class object mapping to keep our code clean
const weaponMappings = {
	melee: MetalSaviorsMeleeWeapon,
	ranged: MetalSaviorsRangedWeapon,
};

// throughout, we will assume if no weapon data is present, then it is a melee weapon

export const MetalSaviorsWeaponProxy = new Proxy(function () {}, {
	//Will intercept calls to the "new" operator
	construct: function (target, args) {
		const [data] = args;

		//Handle missing mapping entries
		if (!weaponMappings.hasOwnProperty(_getWeaponType(data)))
			throw new Error("Unsupported Entity type for create(): " + _getWeaponType(data));

		//Return the appropriate, actual object from the right class
		return new weaponMappings[_getWeaponType(data)](...args);
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
						return data.map((i) => weaponMappings[_getWeaponType(i.data)].create(i, options));
					}

					if (!weaponMappings.hasOwnProperty(_getWeaponType(data)))
						throw new Error("Unsupported Entity type for create(): " + _getWeaponType(data));

					return weaponMappings[_getWeaponType(data)].create(data, options);
				};

			case Symbol.hasInstance:
				//Applying the "instanceof" operator on the instance object
				return function (instance) {
					return Object.values(weaponMappings).some((i) => instance instanceof i);
				};

			default:
				//Just forward any requested properties to the base Item class
				return Item[prop];
		}
	},
});

function _getWeaponType(data) {
	return !data.data ? "melee" : data.data.type;
}
