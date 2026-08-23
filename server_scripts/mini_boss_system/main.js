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
    // DTM 法术特性（详见 dtm_traits.js）
    Frost: "冰霜",
    Quake: "岩爆",
    Blast: "连发",
    Trapper: "地雷",
    Snare: "诱捕",
    Clone: "分身",
    Wind: "狂风",
    Venom: "剧毒",
    Haunt: "鬼火",
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

// ==================== Boss 判定 ====================
// 复用 Field-Guide 的实体类型标签 fieldguide:bosses 识别真正的 boss，
// 命中标签的实体不会被 miniboss 转化、也不会被赋予词条。
const FG_TagKey = Java.loadClass('net.minecraft.tags.TagKey');
const FG_Registries = Java.loadClass('net.minecraft.core.registries.Registries');
const FG_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
const FG_BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries');
const FG_BOSS_TAG = FG_TagKey.create(FG_Registries.ENTITY_TYPE, new FG_ResourceLocation('fieldguide', 'bosses'));

function isBossEntity(entity) {
    try {
        let key = FG_BuiltInRegistries.ENTITY_TYPE.getResourceKey(entity.getType());
        if (!key || !key.isPresent()) return false;
        let holder = FG_BuiltInRegistries.ENTITY_TYPE.getHolder(key.get());
        if (!holder || !holder.isPresent()) return false;
        return holder.get().is(FG_BOSS_TAG);
    } catch (er) {
        return false;
    }
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
            // 真正的 boss（Field-Guide fieldguide:bosses 标签）不参与 miniboss 转化/词条
            if (isBossEntity(entity)) return;
            //entity.server.runCommandSilent(`/dyeing paint add static mini_boss ${uuid} 80FF0000`)
            // 特效 id 使用 mini_boss_ 专属前缀，dyeing/main.js 清理时据此永久保留该特效（不依赖实体是否已加载）
            entity.server.runCommandSilent(`/dyeing uv add scroll mini_boss_creeper_armor ${uuid} minecraft:textures/entity/creeper/creeper_armor.png 0.01 0.01 1`)
            entity.persistentData.putBoolean("isMiniBoss", true);
            let powers = rollPowers();
            entity.persistentData.putString("POWER", JSON.stringify(powers));
            powers.forEach(p => entity.persistentData.putBoolean('_mb_p_' + p, true));
            // 不再使用 setCustomName 显示词条（自定义名字会触发原版持久化导致怪物无法被刷新离场）
            // 词条改由 Jade 信息栏显示（见 startup_scripts/client_scripts 的 mini_boss_system/Jade.js）
            //entity.modifyAttribute("generic.max_health","mini_boss",Health*3,"addition")
            entity.setAttributeBaseValue("generic.max_health", Health * 3);
            entity.setHealth(entity.getMaxHealth());
            // DTM 法术:把抽到的 DTM 词条注入 DTMMobData,由 mod 自动施法(定义于 dtm_traits.js,priority 1)
            if (typeof global.applyDTMPowersToMiniBoss === "function") {
                global.applyDTMPowersToMiniBoss(entity);
            }
        }
    }
});