export class Enum {
	constructor(value) {
		this.value = value;
	}

	static getAllEnumValues() {
		return Object.values(this);
	}

	static getAllEnumEntries() {
		return Object.fromEntries(Object.entries(this));
	}

	static filter(func) {
		return Object.fromEntries(Object.entries(this).filter(([key, value]) => func(key, value)));
	}

	static parseValue(value) {
		return Object.values(this).find((x) => x.value === value) ?? null;
	}
}

Enum.prototype.toString = function dogToString() {
	return this.value;
};
