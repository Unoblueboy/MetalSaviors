import { CalculateSkillValue } from "./Calculators.mjs"

export class SkillHelper {
    static prepareDerivedLearnedSkillData(item) {
        if (item.type !== 'learnedSkill') return;

        console.log("prepareDerivedLearnedSkillData", item);

        const skillData = item.data;
        const actorData = item.actor?.data ?? {};
        item.data.data.value = CalculateSkillValue(skillData, actorData);
    }
}