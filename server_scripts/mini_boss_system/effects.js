// priority: 0
// ============================================================
// 迷你Boss词条系统 - 事件驱动词条效果
// ============================================================
// 本文件实现 4 个事件驱动的词条：缴械(Disarm)、寄生(Parasite)、
// 适应(Adapt)、自爆(Explode)；Goal 驱动的词条（挖掘/自愈/援军/领袖/隐匿）在 IA.js。
// 复用共享作用域中 IA.js 定义的 hasPower / getPowerLevel / findSafeSpawnPos。
// 词条等级由 main.js 转化时写入 _mb_lvl_<key>，词条标记为 _mb_p_<key>。
//
// ⚠ DamageSource 在 KubeJS 1.20.1 的 Rhino 映射（DamageSourceMixin @RemapForJS）：
//   伤害来源实体必须用 source.getActual()（原版 getEntity），直接实体用 source.getImmediate()
//   （原版 getDirectEntity），类型名用 source.getType()（原版 getMsgId）；
//   调用 source.getEntity() 会报 "Cannot find function getEntity" 错误。

/**
 * 缴械：迷你Boss攻击时按 等级×0.05 概率把目标的盔甲和主副手物品卸载为掉落物
 * 独立于目标是否免疫伤害判定（攻击方视角）
 * @param {Object} event - EntityEvents.hurt 事件
 */
function mbDisarm(event) {
    const { entity, source } = event;
    let attacker = source.getActual();
    // 无效攻击者、自伤、攻击者非迷你Boss直接返回
    if (!attacker || attacker == entity || !attacker.isAlive()) return;
    if (!hasPower(attacker, 'Disarm')) return;
    let lvl = getPowerLevel(attacker, 'Disarm');
    // 等级影响卸甲概率：等级 × 0.05（1级=5%，5级=25%）
    if (Math.random() >= lvl * 0.05) return;
    // 创造/旁观模式玩家不缴械
    if (entity.isPlayer() && (entity.isCreative() || entity.isSpectator())) return;
    // 卸载主副手与四件盔甲槽位为掉落物
    let slots = [EquipmentSlot.MAINHAND, EquipmentSlot.OFFHAND, EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET];
    let dropped = 0;
    slots.forEach(slot => {
        let stack = entity.getItemBySlot(slot);
        if (!stack || stack.isEmpty()) return;
        let itemEntity = entity.spawnAtLocation(stack);
        if (itemEntity) {
            // 40 tick 拾取延迟，防止目标原地立刻捡回
            itemEntity.pickupDelay = 40;
        }
        entity.setItemSlot(slot, ItemStack.EMPTY);
        dropped++;
    });
    if (dropped > 0) {
        try { entity.level.playSound(null, entity.x, entity.y, entity.z, 'minecraft:entity.item.break', 'players', 0.8, 0.6) } catch (er) {}
    }
}

/**
 * 驱散：迷你Boss攻击时按 等级×0.05 概率清除目标的正面药水效果
 * @param {Object} event - EntityEvents.hurt 事件
 */
function mbDispel(event) {
    const { entity, source } = event;
    let attacker = source.getActual();
    // 无效攻击者、自伤、攻击者非迷你Boss直接返回
    if (!attacker || attacker == entity || !attacker.isAlive()) return;
    if (!hasPower(attacker, 'Dispel')) return;
    let lvl = getPowerLevel(attacker, 'Dispel');
    // 等级影响驱散概率：等级 × 0.05（1级=5%，5级=25%）
    if (Math.random() >= lvl * 0.05) return;
    // 先收集正面效果再统一移除，避免遍历时修改目标的效果表
    let toRemove = [];
    entity.getActiveEffects().forEach(inst => {
        try {
            if (inst.getEffect().getCategory() == MobEffectCategory.BENEFIT) toRemove.push(inst.getEffect());
        } catch (er) {}
    });
    if (toRemove.length == 0) return;
    toRemove.forEach(effect => {
        try { entity.removeEffect(effect); } catch (er) {}
    });
    try { entity.level.playSound(null, entity.x, entity.y, entity.z, 'minecraft:block.glass.break', 'players', 0.6, 1.4) } catch (er) {}
}

/**
 * 寄生：迷你Boss受到攻击时在附近召唤 等级 数量的蠹虫并使其仇恨攻击者
 * 内置 40 tick 冷却，防止连击武器瞬间刷爆蠹虫
 * @param {Object} entity - 受击的迷你Boss
 * @param {Object} source - 伤害来源
 */
function mbParasite(entity, source) {
    if (!entity.persistentData.getBoolean('_mb_p_Parasite')) return;
    let pd = entity.persistentData;
    // 40 tick 冷却（规则12：获取时间用 level.getTime()）
    let now = entity.level.getTime();
    let last = pd.getLong('_mb_parasite_t');
    if (now - last < 40) return;
    pd.putLong('_mb_parasite_t', now);

    let lvl = getPowerLevel(entity, 'Parasite');
    let level = entity.level;
    let attacker = source.getActual();
    for (let i = 0; i < lvl; i++) {
        try {
            let fish = level.createEntity('minecraft:silverfish');
            if (!fish) continue;
            // 标记为寄生召唤物，防止被转化成迷你Boss（main.js 转化条件排除）
            fish.persistentData.putBoolean('_mb_parasite_spawned', true);
            // 每只围绕宿主随机偏移找安全落点，找不到则落在宿主脚下
            let ox = (Math.random() - 0.5) * 3;
            let oz = (Math.random() - 0.5) * 3;
            let safe = findSafeSpawnPos(level, entity.x + ox, entity.y, entity.z + oz);
            if (safe) {
                fish.setPos(safe.x, safe.y, safe.z);
            } else {
                fish.setPos(entity.x, entity.y, entity.z);
            }
            fish.spawn();
            // 蠹虫仇恨攻击者
            if (attacker && attacker.isAlive()) {
                try { fish.setTarget(attacker); } catch (er) {}
            }
        } catch (er) {
            console.log('[MiniBoss 寄生] 蠹虫生成失败: ' + er);
        }
    }
    try { level.playSound(null, entity.x, entity.y, entity.z, 'minecraft:entity.silverfish.ambient', 'hostile', 1.0, 0.7) } catch (er) {}
}

/**
 * 适应记录：迷你Boss记录伤害类型（容量=等级，记录满后不再记录、不覆盖）
 * 只做记录与判定，不直接 cancel —— event.cancel() 会抛 EventExit 控制流异常，
 * 必须由外层 handler 在所有 try-catch 之外调用
 * @param {Object} entity - 受击的迷你Boss
 * @param {Object} source - 伤害来源
 * @returns {boolean} 该伤害类型是否已被记录（已记录则免疫）
 */
function mbAdaptRecord(entity, source) {
    if (!entity.persistentData.getBoolean('_mb_p_Adapt')) return false;
    // 1.20.1 DamageSource.getType() 返回类型名（player/arrow/explosion/fall 等）
    let dmgType = source.getType();
    if (!dmgType) return false;
    let pd = entity.persistentData;
    let types = [];
    let str = pd.getString('_mb_adapt_types');
    if (str) {
        try { types = JSON.parse(str); } catch (e) { types = []; }
    }
    if (!Array.isArray(types)) types = [];
    // 已记录的类型 → 免疫（由外层 cancel）
    if (types.indexOf(dmgType) >= 0) return true;
    // 新类型 → 容量未满则记录，记录满后不再记录、不覆盖
    let cap = getPowerLevel(entity, 'Adapt');
    if (types.length < cap) {
        types.push(dmgType);
        pd.putString('_mb_adapt_types', JSON.stringify(types));
    }
    return false;
}

/**
 * 吸血：迷你Boss造成伤害后按伤害的 50% 恢复自身（固定1级）
 * 必须放在 handler 末尾：若受击方适应词条免疫本次攻击（event.cancel 中断执行），则不回血
 * @param {Object} event - EntityEvents.hurt 事件
 */
function mbDrain(event) {
    const { entity, source } = event;
    let attacker = source.getActual();
    // 无效攻击者、自伤、攻击者非迷你Boss直接返回
    if (!attacker || attacker == entity || !attacker.isAlive()) return;
    if (!hasPower(attacker, 'Drain')) return;
    let amount = event.damage;
    if (!amount || amount <= 0) return;
    try {
        // 恢复造成伤害的 50%
        attacker.heal(amount * 0.5);
    } catch (er) {
        console.log('[MiniBoss 吸血] ' + er);
    }
}

// ==================== 受击事件：缴械 / 驱散 / 寄生 / 适应 ====================
EntityEvents.hurt(event => {
    let entity = event.entity;
    if (!entity || !entity.isAlive()) return;
    // 缴械：攻击方视角，独立判定（目标是否迷你Boss均可）
    try { mbDisarm(event); } catch (er) { console.log('[MiniBoss 缴械] ' + er); }
    // 驱散：攻击方视角，按概率清除目标正面药水效果
    try { mbDispel(event); } catch (er) { console.log('[MiniBoss 驱散] ' + er); }
    // 被打方视角：寄生/适应仅对迷你Boss生效
    if (!entity.persistentData.getBoolean('isMiniBoss')) return;
    // 寄生：受到攻击召唤蠹虫（免疫的攻击也算受到攻击）
    try { mbParasite(entity, event.source); } catch (er) { console.log('[MiniBoss 寄生] ' + er); }
    // 适应：最后判定免疫（规则11：event.cancel() 直接中断执行，必须放在 handler 末尾，
    // 且不能被外层 try-catch 包裹，否则 EventExit 控制流异常被吞、取消不生效）
    let immune = false;
    try { immune = mbAdaptRecord(entity, event.source); } catch (er) { console.log('[MiniBoss 适应] ' + er); }
    if (immune) event.cancel();
    // 吸血：攻击方造成伤害 50% 回血（cancel 中断时不会执行到这里，免疫攻击不回血）
    try { mbDrain(event); } catch (er) { console.log('[MiniBoss 吸血] ' + er); }
});

/**
 * 按序列化名查找爆炸破坏模式枚举（StringRepresentable）
 * 枚举常量名（BLOCKS 等）在混淆生产环境无法直接按名访问，但序列化名是数据字符串
 * 始终为 "none"/"blocks"/"mob"/"tnt"/"trigger"，遍历 values() 反查最稳健
 * @param {string} name - 序列化名（如 "blocks"）
 * @returns {Object|null} 对应枚举值，找不到返回 null
 */
function getExplosionMode(name) {
    let modes = LevelExplosionInteraction.values();
    for (let i = 0; i < modes.length; i++) {
        try {
            if (String(modes[i].getSerializedName()) == name) return modes[i];
        } catch (er) {}
    }
    return null;
}

// ==================== 死亡事件：自爆 ====================
EntityEvents.death(event => {
    try {
        let entity = event.entity;
        if (!entity || !entity.persistentData.getBoolean('isMiniBoss')) return;
        if (!entity.persistentData.getBoolean('_mb_p_Explode')) return;
        // 等级影响爆炸强度：等级 × 5（1级=5，略强于TNT；5级=25）
        let strength = getPowerLevel(entity, 'Explode') * 5;
        // 破坏方块模式按序列化名反查；找不到时降级为默认模式（仅伤害实体不破坏方块）
        let boom = entity.level.createExplosion(entity.x, entity.y, entity.z)
            .exploder(entity)
            .strength(strength)
            .causesFire(false);
        let mode = getExplosionMode('blocks');
        if (mode) boom = boom.explosionMode(mode);
        boom.explode();
    } catch (er) {
        console.log('[MiniBoss 自爆] ' + er);
    }
});
