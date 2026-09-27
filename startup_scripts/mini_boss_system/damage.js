// priority: 0
// ============================================================
// 迷你Boss词条系统 - 伤害类词条（LivingHurtEvent 管线实现）
// ============================================================
// 暗影(Shadow)/刺客(Assassin)/狂怒(Fury)/刚性(Rigidity) 需要修改伤害数值，
// KubeJS 的 EntityEvents.hurt 只能取消不能改量，因此接入 ForgeEvents 伤害管线，
// 由 startup_scripts/ForgeEvents/main.js 的 LivingHurtEvent 主入口调用 handleMiniBossPowers。
// 注意：startup 与 server 是两个脚本包（作用域隔离），这里的 mbHasPower/mbGetPowerLevel
// 为本地实现，等级数据由 server_scripts/mini_boss_system/main.js 写入 persistentData。

/**
 * 迷你Boss判定 + 词条标记
 * @param {Object} entity - 待判定实体
 * @param {string} power - 词条 key（如 "Shadow"）
 * @returns {boolean} 是否为持有该词条的迷你Boss
 */
function mbHasPower(entity, power) {
    if (!entity || !entity.isAlive()) return false;
    let pd = entity.persistentData;
    return pd.getBoolean('isMiniBoss') && pd.getBoolean('_mb_p_' + power);
}

/**
 * 读取词条等级（main.js 抽取时写入 _mb_lvl_<key>），旧数据或未存储时默认 1 级
 * @param {Object} entity - 迷你Boss实体
 * @param {string} power - 词条 key
 * @returns {number} 词条等级
 */
function mbGetPowerLevel(entity, power) {
    if (!entity || !entity.isAlive()) return 1;
    let lvl = entity.persistentData.getInt('_mb_lvl_' + power);
    if (lvl <= 0) return 1;
    return lvl;
}

/**
 * 计算实体所处亮度（0~15）：方块光与 天光-天色变暗 取大值
 * @param {Object} entity - 待计算实体
 * @returns {number} 亮度 0~15
 */
function mbLightLevel(entity) {
    let level = entity.level;
    let pos = new BlockPos(Math.floor(entity.x), Math.floor(entity.y + 0.5), Math.floor(entity.z));
    let blockLight = level.getBrightness(LightLayer.BLOCK, pos);
    let skyLight = level.getBrightness(LightLayer.SKY, pos);
    // 夜晚/雷暴时天光按天色变暗衰减（僵尸白日燃烧同理）
    let light = Math.max(blockLight, skyLight - level.getSkyDarken());
    if (light < 0) light = 0;
    if (light > 15) light = 15;
    return light;
}

/**
 * 迷你Boss伤害类词条，由 ForgeEvents/main.js 的 LivingHurtEvent 主入口调用
 * @param {Object} event - LivingHurtEvent（可 setAmount 修改伤害）
 * @param {Object} attacker - 攻击者（环境伤害时为 null）
 * @param {Object} victim - 受击者
 */
function handleMiniBossPowers(event, attacker, victim) {
    let amount = event.getAmount();
    if (amount <= 0) return;
    let changed = false;

    // ---- 攻击方词条：暗影 / 刺客 / 狂怒 ----
    if (attacker && attacker != victim && attacker.isAlive()) {
        // 暗影（固定1级）：伤害加成 = 15 - 攻击者所处亮度（全暗 +15，全亮 +0）
        if (mbHasPower(attacker, 'Shadow')) {
            amount += 15 - mbLightLevel(attacker);
            changed = true;
        }
        // 刺客（1-5级）：攻击者隐身时伤害加成 = 等级 × 2（5级 = 10）
        if (mbHasPower(attacker, 'Assassin') && attacker.hasEffect(MobEffects.INVISIBILITY)) {
            amount += mbGetPowerLevel(attacker, 'Assassin') * 2;
            changed = true;
        }
        // 狂怒（固定1级）：血量越低伤害越高，加成比例 = 1 - 当前血量/最大血量，最大 +100%
        if (mbHasPower(attacker, 'Fury')) {
            let max = attacker.getMaxHealth();
            if (max > 0) {
                let ratio = attacker.getHealth() / max;
                if (ratio < 0) ratio = 0;
                amount *= 1 + (1 - ratio);
                changed = true;
            }
        }
    }

    // ---- 受击方词条：刚性（固定1级） ----
    if (mbHasPower(victim, 'Rigidity')) {
        if (amount < 15) {
            // 低于15点：受伤减少80%
            amount *= 0.2;
            changed = true;
        } else if (amount > 15) {
            // 高于15点：受伤增加80%
            amount *= 1.8;
            changed = true;
        }
        // 恰好等于15点：不增不减
    }

    if (changed) {
        event.setAmount(amount);
    }
}
