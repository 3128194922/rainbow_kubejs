// priority: 0
// 监听实体受伤事件
/**
 * 根据概率返回 true 或 false
 * @param {number} probability - 概率值（0 ≤ probability ≤ 1）
 * @returns {boolean} 
 */
function randomBool(probability) {
    return Math.random() < probability;
}

const POWER = {
    Dig: "挖掘",
    Regenerate: "自愈",
    Reinforce: "援军",
    Leader: "领袖",
    Stealth: "隐匿",
    Evolve: "演化",
};

/**
 * 从 POWER 对象中随机返回一个词条 key
 * @returns {string} 随机的词条 key（如 "Dig"）
 */
function getRandomPower() {
    let keys = Object.keys(POWER);
    return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * 返回 1~4 的随机整数，决定本次抽取次数
 * @returns {number} 1 ~ 4
 */
function getRandomDrawCount() {
    return Math.floor(Math.random() * 4) + 1;
}

/**
 * 按随机次数抽取 POWER 词条，抽到相同的仅消耗次数不重复添加
 * @returns {string[]} 去重后的词条 key 数组
 */
function rollPowers() {
    let count = getRandomDrawCount();
    let result = [];
    for (let i = 0; i < count; i++) {
        let power = getRandomPower();
        if (!result.includes(power)) {
            result.push(power);
        }
    }
    return result;
}

EntityEvents.hurt(event => {
    const { entity, source } = event;
    if (entity instanceof TamableAnimal) return;
    if (source.player) {
        let uuid = entity.getUuid().toString();
        let luck = source.player.getAttribute("minecraft:generic.luck").getValue();
        if(luck >= 0) return;
        let isInfernium = randomBool(Math.abs(luck) / 100);
        let Health = entity.getAttribute("generic.max_health").getValue();

        if (entity.isAlive() && !entity.isPlayer() && !entity.persistentData.getBoolean("isMiniBoss") && !entity.persistentData.getBoolean("_mb_reinforce_spawned")) {
            //entity.server.runCommandSilent(`/dyeing paint add static mini_boss ${uuid} 80FF0000`)
            entity.server.runCommandSilent(`/dyeing uv add scroll creeper_armor ${uuid} minecraft:textures/entity/creeper/creeper_armor.png 0.01 0.01 1`)
            entity.persistentData.putBoolean("isMiniBoss", true);
            let powers = rollPowers();
            entity.persistentData.putString("POWER", JSON.stringify(powers));
            powers.forEach(p => entity.persistentData.putBoolean('_mb_p_' + p, true));
            entity.setCustomName(Text.red(JSON.stringify(powers.map(k => POWER[k]))));
            //entity.modifyAttribute("generic.max_health","mini_boss",Health*3,"addition")
            entity.setAttributeBaseValue("generic.max_health", Health * 3);
            entity.setHealth(entity.getMaxHealth());
        }
    }
});