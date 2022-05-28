export default class MetalSaviorsCombatant extends Combatant {
	_onCreate(data, options, userID) {
		super._onCreate(data, options, userID);
		this.setFlag("metalsaviors", "remainingActions", this.actor.getActionsPerRound());
		this.setFlag("metalsaviors", "turnDone", false);
	}
}
