export function generateSkillKey(skillName) {
	return skillName.replaceAll(/[ :\.;]/g, "_");
}
