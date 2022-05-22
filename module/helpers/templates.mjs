/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	return loadTemplates([
		// Actor partials.
		"systems/metalsaviors/templates/actor/parts/actor-features.hbs",
		"systems/metalsaviors/templates/actor/parts/actor-items.hbs",
		"systems/metalsaviors/templates/actor/parts/actor-effects.hbs",
		"systems/metalsaviors/templates/actor/parts/actor-attributes.hbs",
		"systems/metalsaviors/templates/actor/parts/actor-skills.hbs",
		"systems/metalsaviors/templates/actor/parts/actor-cav.hbs",
	]);
};
