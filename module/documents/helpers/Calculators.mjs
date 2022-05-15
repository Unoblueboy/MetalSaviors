export function attributeCalculator(actorData, data){
    for (let [key, attribute] of Object.entries(data.attributes)) {
        attribute.value = attribute.baseValue + attribute.otherBonuses;
      }
}

export function healthCalculator(actorData, data){
  data.health.maxValue = data.attributes.hrd.value;
  data.health.max = data.health.maxValue;
  data.health.value = data.health.curValue;
}

export function enduranceCalculator(actorData, data){
  data.endurance.maxValue = data.endurance.baseValue + data.attributes.hrd.value;
  data.endurance.max = data.endurance.maxValue;
  data.endurance.value = data.endurance.curValue;
}

export function derivedAttributeCalculator(actorData, data){
  let dAttributes = data.derivedAttributes;
  let attributes = data.attributes;

  dAttributes.damageModifier.baseValue = _calculateBaseDamageModifier(attributes.pow.value);
  if (dAttributes.damageModifier.otherBonuses !== null) {
    dAttributes.damageModifier.value = `${dAttributes.damageModifier.baseValue} + ${dAttributes.damageModifier.otherBonuses}`;
  }
  else{
    dAttributes.damageModifier.value = dAttributes.damageModifier.baseValue;
  }

  dAttributes.toHitModifier.baseValue = _calculateToHitModifier(attributes.pow.value);
  dAttributes.toHitModifier.value = 
    dAttributes.toHitModifier.baseValue + 
    dAttributes.toHitModifier.otherBonuses;

  dAttributes.skillModifier.baseValue = _calculateSkillModifier(attributes.int.value);
  dAttributes.skillModifier.value = 
    dAttributes.skillModifier.baseValue + 
    dAttributes.skillModifier.otherBonuses;

  dAttributes.reactionModifier.baseValue = _calculateReactionModifier(attributes.bea.value);
  dAttributes.reactionModifier.value = 
    dAttributes.reactionModifier.baseValue + 
    dAttributes.reactionModifier.otherBonuses;

  dAttributes.initiativeModifier.baseValue = _calculateInitiativeModifier(attributes.spd.value);
  dAttributes.initiativeModifier.value = 
    dAttributes.initiativeModifier.baseValue + 
    dAttributes.initiativeModifier.otherBonuses;

  dAttributes.spacesMoved.baseValue = _calculateSpacesMoved(attributes.spd.value);
  dAttributes.spacesMoved.value = 
    dAttributes.spacesMoved.baseValue + 
    dAttributes.spacesMoved.otherBonuses;

  dAttributes.cavInitiativeModifier.baseValue = _calculateCavInitiativeModifier(attributes.fin.value, attributes.spd.value);
  dAttributes.cavInitiativeModifier.value = 
    dAttributes.cavInitiativeModifier.baseValue + 
    dAttributes.cavInitiativeModifier.otherBonuses;
}

function _calculateBaseDamageModifier(power){
  if (power <= 10){
    return "0";
  }
  if (power <= 15){
    return "1d6";
  }
  if (power <= 20){
    return "2d6";
  }
  return "3d6";
}

function _calculateToHitModifier(power){
  if (power <= 5){
    return -2;
  }
  if (power <= 10){
    return 0;
  }
  if (power <= 15){
    return 1;
  }
  if (power <= 20){
    return 2;
  }
  return 3;
}

function _calculateSkillModifier(intelligence){
  if (intelligence <= 10){
    return 0;
  }
  if (intelligence <= 13){
    return 4;
  }
  if (intelligence <= 16){
    return 8;
  }
  if (intelligence <= 19){
    return 10;
  }
  return 12;
}

function _calculateReactionModifier(beauty){
  if (beauty <= 0){
    return -6;
  }
  if (beauty <= 4){
    return -3;
  }
  if (beauty <= 9){
    return 0;
  }
  if (beauty <= 14){
    return 1;
  }
  if (beauty <= 19){
    return 2;
  }
  return 3;
}

function _calculateInitiativeModifier(speed){
  if (speed <= 0){
    return -6;
  }
  if (speed <= 4){
    return -3;
  }
  if (speed <= 9){
    return 0;
  }
  if (speed <= 14){
    return 1;
  }
  if (speed <= 19){
    return 2;
  }
  return 3;
}

function _calculateSpacesMoved(speed){
  if (speed <= 0){
    return 1;
  }
  if (speed <= 4){
    return 2;
  }
  if (speed <= 9){
    return 3;
  }
  if (speed <= 14){
    return 4;
  }
  if (speed <= 19){
    return 5;
  }
  return 6;
}

function _calculateCavInitiativeModifier(finesse, speed){
  let avg = Math.round((finesse+speed)/2)

  if (avg <= 0){
    return -6;
  }
  if (avg <= 4){
    return -3;
  }
  if (avg <= 9){
    return 0;
  }
  if (avg <= 14){
    return 1;
  }
  if (avg <= 19){
    return 2;
  }
  return 3;
}

export function skillsCalculator(actorData, data) {
  const skills = data.skills;
  const dSkills = {};

  for (const baseSkillsObject of Object.values(skills)){
    console.log("baseSkillsObject", baseSkillsObject);
    if (baseSkillsObject.baseStats.skillType !== "learnedSkill") {
      continue;
    }

    for (const [skillName, baseSkillData] of Object.entries(baseSkillsObject.baseStats)) {
      if (skillName === "skillType") {
        continue;
      }
      dSkills[skillName] = {
        ...baseSkillData,
        "name": skillName,
        "numAcquired": 0,
      }
    }

    for (const [id, skillData] of Object.entries(baseSkillsObject)) {
      const skillName = skillData.name;
      
      if (id === "baseStats") {
        continue;
      }

      dSkills[skillName]["numAcquired"] += 1;
    }
  }

  for (const derivedSkill of Object.values(dSkills)){
    derivedSkill.value = _calculateSkillValue(derivedSkill, data)
  }

  data.derivedSkills = dSkills;

  console.log("dskills", dSkills, "skills", skills);
}

function _calculateSkillValue(derivedSkill, data) {
  if (derivedSkill.override) {
    return derivedSkill.overrideValue;
  }

  let lvl = data.level.value;
  let derivedAttributes = data.derivedAttributes;
  let numAcquiredBonus = (derivedSkill.numAcquired - 1) * 10
  return derivedSkill.baseValue 
  + numAcquiredBonus
  + derivedSkill.otherBonuses
  + derivedSkill.levelIncrease * lvl
  + derivedAttributes.skillModifier.value;
}