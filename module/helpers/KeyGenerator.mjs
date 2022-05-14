export function generateSkillKey(skillName){
    return skillName.replace(" ", "_").replace(":", "_");
}