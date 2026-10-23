// priority: 0
// 迷你 Boss 词条转化：供负幸运受击与血月自然生成共用。
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
    Parasite: "寄生",
    Adapt: "适应",
    Explode: "自爆",
    Disarm: "缴械",
    HeavyArmor: "重装",
    Dispel: "驱散",
    Shadow: "暗影",
    Assassin: "刺客",
    Rigidity: "刚性",
    Fury: "狂怒",
    Drain: "吸血",
    // DTM 法术特性（详见 dtm_traits.js）——暂时禁用，恢复时取消注释
    /*Frost: "冰霜",
    Quake: "岩爆",
    Blast: "连发",
    Trapper: "地雷",
    Snare: "诱捕",
    Clone: "分身",
    Wind: "狂风",
    Venom: "剧毒",
    Haunt: "鬼火",*/
};

// 词条等级范围：key → [最小等级, 最大等级]
// 等级影响：挖掘=挖掘速度(耗时÷等级)、自愈=回血量(1.0×等级/秒)、援军=援军数量(=等级)
//           寄生=蠹虫数量(=等级)、适应=伤害类型记录容量(=等级，最高2级)、自爆=爆炸强度(等级×5)
//           缴械=卸甲概率(等级×0.05)、重装=护甲加成(等级×5)、驱散=驱散概率(等级×0.05)
//           刺客=隐身攻击加成(等级×2)、吸血=造成伤害50%回血(固定1级)
// 暗影/刚性/狂怒/吸血 固定 1 级（算法与等级无关）；领袖/隐匿 固定 1 级；
// 演化 固定 1 级（按实体类型分化：爬行者弹跳/蜘蛛网/骷髅速度/女巫药水/史莱姆体型）；
// 未列出的词条（如 DTM 特性）默认 1 级
const POWER_LEVEL_RANGE = {
    Dig: [1, 2],
    Regenerate: [1, 3],
    Reinforce: [1, 3],
    Leader: [1, 1],
    Stealth: [1, 1],
    Evolve: [1, 1],
    Parasite: [1, 3],
    Adapt: [1, 2],
    Explode: [1, 5],
    Disarm: [1, 5],
    HeavyArmor: [1, 5],
    Dispel: [1, 5],
    Shadow: [1, 1],
    Assassin: [1, 5],
    Rigidity: [1, 1],
    Fury: [1, 1],
    Drain: [1, 1],
};

// 词条标签与等级范围共享给 startup 端 Jade 显示；放在等级表声明后，避免 const 暂时性死区。
try {
    global.MB_POWER_LABELS_JSON = JSON.stringify(POWER);
    global.MB_POWER_RANGES_JSON = JSON.stringify(POWER_LEVEL_RANGE);
} catch (er) {
    console.log('[MiniBoss] 标签与等级范围共享失败: ' + er);
}

/**
 * 为词条随机掷一个等级（在 POWER_LEVEL_RANGE 范围内，未知词条固定 1 级）
 * @param {string} key - 词条 key（如 "Dig"）
 * @returns {number} 词条等级
 */
function rollPowerLevel(key) {
    let range = POWER_LEVEL_RANGE[key];
    // 未知词条（如恢复 DTM 特性后）没有配置范围，固定 1 级
    if (!range) return 1;
    let min = range[0];
    let max = range[1];
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
// TagKey / Registries / ResourceLocation / BuiltInRegistries 统一由 server_scripts/CONST.js 提供。
const FG_BOSS_TAG = TagKey.create(Registries.ENTITY_TYPE, new ResourceLocation('fieldguide', 'bosses'));

function isBossEntity(entity) {
    try {
        // KubeJS 6 的 getType() 返回字符串 ID，先构造注册表键再查询实体类型标签。
        let key = ResourceKey.create(Registries.ENTITY_TYPE, new ResourceLocation(String(entity.getType())));
        let holder = BuiltInRegistries.ENTITY_TYPE.getHolder(key);
        if (!holder || !holder.isPresent()) return false;
        // Rhino 对 Holder.is(TagKey/ResourceLocation) 的重载选择有歧义，改由标签集合判断成员。
        let tag = BuiltInRegistries.ENTITY_TYPE.getTag(FG_BOSS_TAG);
        return tag != null && tag.isPresent() && tag.get().contains(holder.get());
    } catch (er) {
        console.log('[MiniBoss] 真正 Boss 标签判断失败: ' + er);
        return false;
    }
}

// 负幸运攻击与血月自然生成共用这套转化，避免词条/等级/外观规则分叉。
function convertToMiniBoss(entity) {
    if (entity == null || entity instanceof TamableAnimal || !entity.isAlive() || entity.isPlayer()) return false;
    if (entity.persistentData.getBoolean("isMiniBoss") || entity.persistentData.getBoolean("_mb_reinforce_spawned") || entity.persistentData.getBoolean("_mb_parasite_spawned")) return false;
    // 真正的 boss（Field-Guide fieldguide:bosses 标签）不参与 miniboss 转化/词条。
    if (isBossEntity(entity)) return false;
    let uuid = entity.getUuid().toString();
    let Health = entity.getAttribute("generic.max_health").getValue();
            //entity.server.runCommandSilent(`/dyeing paint add static mini_boss ${uuid} 80FF0000`)
            // 特效 id 使用 mini_boss_ 专属前缀，dyeing/main.js 清理时据此永久保留该特效（不依赖实体是否已加载）
            entity.server.runCommandSilent(`/dyeing uv add scroll mini_boss_creeper_armor ${uuid} rainbow:textures/miniboss/miniboss_armor.png 0.01 0.01 1`)
            entity.persistentData.putBoolean("isMiniBoss", true);
            let powers = rollPowers();
            entity.persistentData.putString("POWER", JSON.stringify(powers));
            powers.forEach(p => entity.persistentData.putBoolean('_mb_p_' + p, true));
            // 词条等级系统：为每个词条掷等级，存 POWER_LEVELS（key→等级 JSON，供 Jade 显示）
            // 以及 _mb_lvl_<key>（int，供 IA.js 快速读取）
            let powerLevels = {};
            powers.forEach(p => {
                let lvl = rollPowerLevel(p);
                powerLevels[p] = lvl;
                entity.persistentData.putInt('_mb_lvl_' + p, lvl);
            });
            entity.persistentData.putString("POWER_LEVELS", JSON.stringify(powerLevels));
            // 不再使用 setCustomName 显示词条（自定义名字会触发原版持久化导致怪物无法被刷新离场）
            // 词条改由 Jade 信息栏显示（见 startup_scripts/client_scripts 的 mini_boss_system/Jade.js）
            // 演化词条：史莱姆体型增大 1 级，血量基数随体型变大（须在血量×3之前执行，
            // 因为 setSize 会重设 max_health 基础值）
            if (powerLevels.Evolve && String(entity.getType()) == 'minecraft:slime') {
                try {
                    entity.setSize(entity.getSize() + 1, true);
                    // 血量基数取体型增大后的值，保证最终血量 = 新体型血量 × 3
                    Health = entity.getMaxHealth();
                } catch (er) {
                    console.log('[MiniBoss 演化] 史莱姆体型增大失败: ' + er);
                }
            }
            //entity.modifyAttribute("generic.max_health","mini_boss",Health*3,"addition")
            entity.setAttributeBaseValue("generic.max_health", Health * 3);
            entity.setHealth(entity.getMaxHealth());
            // 重装词条：护甲加成 = 等级 × 5（追加到基础值，随 NBT 持久化，不覆盖原护甲）
            if (powerLevels.HeavyArmor) {
                try {
                    let armorBase = entity.getAttributeBaseValue("generic.armor");
                    entity.setAttributeBaseValue("generic.armor", armorBase + powerLevels.HeavyArmor * 5);
                } catch (er) {
                    console.log('[MiniBoss 重装] 护甲加成失败: ' + er);
                }
            }
            // 演化词条：骷髅获得永久速度提升（速度II，无粒子）
            if (powerLevels.Evolve && String(entity.getType()) == 'minecraft:skeleton') {
                try {
                    entity.potionEffects.add('minecraft:speed', -1, 1, false, false);
                } catch (er) {
                    console.log('[MiniBoss 演化] 骷髅速度提升失败: ' + er);
                }
            }
            // DTM 法术:把抽到的 DTM 词条注入 DTMMobData,由 mod 自动施法(定义于 dtm_traits.js,priority 1)
            // ——暂时禁用,恢复时取消注释
            //if (typeof global.applyDTMPowersToMiniBoss === "function") {
            //    global.applyDTMPowersToMiniBoss(entity);
            //}
    return true;
}

EntityEvents.hurt(event => {
    try {
        // 当前 Rhino 在事件回调中解构 entity 会报重复声明，直接读取事件字段。
        let target = event.entity;
        let source = event.source;
        if (target instanceof TamableAnimal || !source.player) return;
        let luck = source.player.getAttribute("minecraft:generic.luck").getValue();
        if (luck >= 0) return;
        // 保留原脚本的负幸运触发行为；本次仅抽取共用转化流程。
        let isInfernium = randomBool(Math.abs(luck) / 100);
        convertToMiniBoss(target);
    } catch (error) {
        console.log('[MiniBoss] 负幸运转化失败: ' + error);
    }
});
