export function attributeCalculator(actorData, data){
    for (let [key, attribute] of Object.entries(data.attributes)) {
        attribute.value = attribute.baseValue + attribute.otherBonuses;
      }
}

export function healthCalculator(actorData, data){
  data.health.maxValue = data.attributes.hrd.value;
}

export function enduranceCalculator(actorData, data){
  data.endurance.maxValue = data.endurance.baseValue + data.attributes.hrd.value;
}