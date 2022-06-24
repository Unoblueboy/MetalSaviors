export class CombatSpeedHelper {
	static getMovementSpeedString(movementSpeed) {
		switch (movementSpeed) {
			case 0:
				return "Halt";
			case 1:
				return "Walking";
			case 2:
				return "Pacing";
			case 3:
				return "Galloping";
			case 4:
				return "Sprinting";
			default:
				return null;
		}
	}

	static getMovementSpeedKey(movementSpeed) {
		switch (movementSpeed) {
			case 0:
				return "halt";
			case 1:
				return "walk";
			case 2:
				return "pace";
			case 3:
				return "gallop";
			case 4:
				return "sprint";
			default:
				return null;
		}
	}

	static getMovementSpeedIntFromKey(movementSpeed) {
		switch (movementSpeed) {
			case "halt":
				return 0;
			case "walk":
				return 1;
			case "pace":
				return 2;
			case "gallop":
				return 3;
			case "sprint":
				return 4;
			default:
				return -1;
		}
	}
}
