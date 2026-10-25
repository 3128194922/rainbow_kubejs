// priority: 0
// ============================================================
// 迷你Boss词条系统 - 事件驱动词条效果
// ============================================================
// 本文件实现事件驱动的词条：缴械(Disarm)、驱散(Dispel)、寄生(Parasite)、
// 适应(Adapt)、吸血(Drain)、自爆(Explode)；Goal 驱动的词条在 IA.js。
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
 * 吸血：迷你Boss造成伤害后按伤害的 50% 恢复自身（固定1级）
 * 已被适应记录的伤害类型不会回血，因为 Forge LivingHurtEvent 会把该次伤害设为0
 * @param {Object} event - EntityEvents.hurt 事件
 */
function mbDrain(event) {
    const { entity, source } = event;
    let attacker = source.getActual();
    // 无效攻击者、自伤、攻击者非迷你Boss直接返回
    if (!attacker || attacker == entity || !attacker.isAlive()) return;
    if (!hasPower(attacker, 'Drain')) return;
    // EntityEvents.hurt 先触发；已记录的适应类型随后会被 Forge 伤害管线归零，因此这里跳过吸血。
    if (entity.persistentData.getBoolean('_mb_p_Adapt')) {
        let damageType = source.getType();
        let pd = entity.persistentData;
        let savedTypes = pd.getString('_mb_adapt_types');
        if (savedTypes) {
            try {
                let types = JSON.parse(savedTypes);
                if (!Array.isArray(types)) types = [];
                let cap = Math.min(getPowerLevel(entity, 'Adapt'), 2);
                // 旧存档可能已有3种已适应类型；这里先应用新上限，再判断是否该跳过吸血。
                if (types.length > cap) {
                    types = types.slice(0, cap);
                    pd.putString('_mb_adapt_types', JSON.stringify(types));
                }
                if (damageType && types.indexOf(damageType) >= 0) return;
            } catch (er) {
                console.log('[MiniBoss 适应] 吸血前读取记录失败: ' + er);
            }
        }
    }
    let amount = event.damage;
    if (!amount || amount <= 0) return;
    try {
        // 恢复造成伤害的 50%
        attacker.heal(amount * 0.5);
    } catch (er) {
        console.log('[MiniBoss 吸血] ' + er);
    }
}

// ==================== 受击事件：缴械 / 驱散 / 寄生 / 吸血 ====================
EntityEvents.hurt(event => {
    let entity = event.entity;
    if (!entity || !entity.isAlive()) return;
    // 缴械：攻击方视角，独立判定（目标是否迷你Boss均可）
    try { mbDisarm(event); } catch (er) { console.log('[MiniBoss 缴械] ' + er); }
    // 驱散：攻击方视角，按概率清除目标正面药水效果
    try { mbDispel(event); } catch (er) { console.log('[MiniBoss 驱散] ' + er); }
    // 普通受击目标不会进入迷你Boss被打方效果；先结算攻击方吸血再返回。
    // miniboss 目标则继续执行寄生与攻击方吸血；适应归零在 Forge 伤害管线中处理。
    if (!entity.persistentData.getBoolean('isMiniBoss')) {
        try { mbDrain(event); } catch (er) { console.log('[MiniBoss 吸血] ' + er); }
        return;
    }
    // 寄生：受到攻击召唤蠹虫（免疫的攻击也算受到攻击）
    try { mbParasite(entity, event.source); } catch (er) { console.log('[MiniBoss 寄生] ' + er); }
    // 吸血：攻击方造成伤害50%回血；已适应的重复伤害类型在 mbDrain 中跳过。
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
