import { Enum } from "../Enums.js";

export class WeaponRange extends Enum {
	static PointBlank = new WeaponRange("Point Blank");
	static Close = new WeaponRange("Close");
	static Medium = new WeaponRange("Medium");
	static Long = new WeaponRange("Long");
	static Extreme = new WeaponRange("Extreme");
}
