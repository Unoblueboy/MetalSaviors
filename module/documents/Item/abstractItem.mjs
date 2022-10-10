export class MetalSaviorsAbstractItem extends Item {
	_preCreate(data, options, user) {
		super._preCreate(data, options, user);

		this.updateSource({
			"ownership.default": game.settings.get("metalsaviors", "defaultItemPermission"),
		});
	}
}
