export class CombatAction {
	constructor({ type, actionCost = 0, dSpeed = 0, dInit = 0, dExtraMomentum = 0 }) {
		this.type = type;
		this.actionCost = actionCost;
		this.dSpeed = dSpeed;
		this.dInit = dInit;
		this.dExtraMomentum = dExtraMomentum;
	}
}
