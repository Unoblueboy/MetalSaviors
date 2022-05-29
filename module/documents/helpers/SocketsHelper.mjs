export function isExecutingGm() {
	if (!game.user.isGM) return false;

	// if the logged in user is the active GM with the lowest user id
	const isExecutingGm = game.users
		.filter((user) => user.isGM && user.isActive)
		.every((other) => other.data._id > game.user.data._id);

	return isExecutingGm;
}
