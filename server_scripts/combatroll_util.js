// priority: 1000
// ==========================================
// CombatRoll 翻滚机制判定函数库（global 全局函数）
// 数据源仅限服务端可查询部分：属性 / 附魔 / 服务端配置 / 翻滚无敌窗口
// ------------------------------------------
// 重要说明（机制边界）：
//   CombatRoll 的实时翻滚状态（是否翻滚中、剩余可用次数、冷却进度、
//   按键按下、BetterCombat 上抬、客户端 itemUseCooldown）全部由客户端独占
//   （RollManager / MinecraftClientMixin），服务端不持有这些数据，
//   因此本库无法也不判定这些项。
//   服务端唯一可观测的"刚翻滚"信号是 LivingEntity 上的 invulnerableTicks
//   （翻滚无敌窗口，由 RollPublish 包触发 setRollInvulnerableTicks）。
// ==========================================
// 用法示例（任意 server_scripts 文件均可直接调用）：
//   let info = global.getCombatRollInfo(player);     // 综合信息
//   let ok  = global.combatRollCanRoll(player);      // {canRoll, reasons}
//   let dist= global.combatRollGetDistance(player);  // 有效翻滚距离
// ==========================================

// ---------- 基础 Java 类（内部，闭包捕获） ----------
let CR_ResourceLocation  = Java.loadClass('net.minecraft.resources.ResourceLocation');
let CR_EnchantmentHelper = Java.loadClass('net.minecraft.world.item.enchantment.EnchantmentHelper');
let CR_MojangAttributes  = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes');
let CR_LivingEntityCls   = Java.loadClass('net.minecraft.world.entity.LivingEntity');
let CR_FluidTags         = Java.loadClass('net.minecraft.tags.FluidTags');

// ---------- CombatRoll mod 类（内部，懒加载，未安装时为 null） ----------
let _CR = null;        // net.combatroll.CombatRoll
let _CR_Ench = null;   // net.combatroll.api.Enchantments_CombatRoll
let _CR_Checked = false;
let _loadCombatRollClasses = function () {
    if (_CR_Checked) return;
    _CR_Checked = true;
    try { _CR = Java.loadClass('net.combatroll.CombatRoll'); } catch (e) { _CR = null; }
    try { _CR_Ench = Java.loadClass('net.combatroll.api.Enchantments_CombatRoll'); } catch (e) { _CR_Ench = null; }
};

/**
 * CombatRoll 是否已加载
 * @returns {boolean}
 */
global.combatRollIsLoaded = function () {
    _loadCombatRollClasses();
    return _CR != null;
};

/**
 * 读取服务端配置 ServerConfig（mod 未加载返回 null）
 * @returns {object|null}
 */
global.combatRollGetConfig = function () {
    _loadCombatRollClasses();
    if (!_CR) return null;
    try { return _CR.config; } catch (e) { return null; }
};

/**
 * 配置快照（mod 未加载返回 null）
 * @returns {object|null}
 */
global.combatRollGetConfigSnapshot = function () {
    let cfg = global.combatRollGetConfig();
    if (!cfg) return null;
    return {
        roll_cooldown: cfg.roll_cooldown,
        roll_duration: cfg.roll_duration,
        invulnerable_ticks_upon_roll: cfg.invulnerable_ticks_upon_roll,
        food_level_required: cfg.food_level_required,
        exhaust_on_roll: cfg.exhaust_on_roll,
        additional_roll_distance: cfg.additional_roll_distance,
        allow_rolling_while_airborn: cfg.allow_rolling_while_airborn,
        allow_rolling_while_weapon_cooldown: cfg.allow_rolling_while_weapon_cooldown,
        allow_jump_while_rolling: cfg.allow_jump_while_rolling,
        allow_auto_jump_while_rolling: cfg.allow_auto_jump_while_rolling
    };
};

// ---------- 内部：经 Forge 注册表取属性 / 附魔对象 ----------
let _crAttr = function (id) {
    try { return ForgeRegistries.ATTRIBUTES.getValue(new CR_ResourceLocation(id)); }
    catch (e) { return null; }
};
let _crEnch = function (id) {
    try { return ForgeRegistries.ENCHANTMENTS.getValue(new CR_ResourceLocation(id)); }
    catch (e) { return null; }
};

/**
 * 装备附魔等级（与 mod 内部 EnchantmentHelper.getEquipmentLevel 一致：装备中的最高等级）
 * @param {Internal.Player} player
 * @param {string} enchId 如 'combatroll:longfooted'
 * @returns {number} 未加载/无附魔返回 0
 */
global.combatRollGetEnchantmentLevel = function (player, enchId) {
    let ench = _crEnch(enchId);
    if (ench == null) return 0;
    try { return CR_EnchantmentHelper.getEquipmentLevel(ench, player.minecraftEntity); }
    catch (e) { return 0; }
};

/**
 * 原始属性值（不含附魔加成；mod 未加载返回 null）
 * @param {Internal.Player} player
 * @param {string} attrId 如 'combatroll:distance'
 * @returns {number|null}
 */
global.combatRollGetRawAttribute = function (player, attrId) {
    let attr = _crAttr(attrId);
    if (attr == null) return null;
    try {
        let inst = player.minecraftEntity.getAttribute(attr);
        if (inst == null) return null;
        return inst.getValue();
    } catch (e) { return null; }
};

/**
 * 调用 mod 附魔的 apply()，按服务端实时附魔配置计算（与 mod 1:1 一致）
 * mod 未加载时按默认 bonus_per_level 兜底：
 *   longfooted: ADD +1/级 ; acrobat: MULTIPLY +10%/级 ; multi_roll: ADD +1/级
 */
let _applyCrEnch = function (fieldName, base, level) {
    _loadCombatRollClasses();
    if (!_CR_Ench) {
        if (fieldName === 'DISTANCE') return base + level * 1;
        if (fieldName === 'RECHARGE') return base * (1 + level * 0.1);
        if (fieldName === 'COUNT')    return base + level * 1;
        return base;
    }
    try {
        let ench = fieldName === 'DISTANCE' ? _CR_Ench.DISTANCE
                 : fieldName === 'RECHARGE' ? _CR_Ench.RECHARGE
                 : _CR_Ench.COUNT;
        if (ench == null) return base;
        return ench.apply(base, level);
    } catch (e) { return base; }
};

/**
 * 有效翻滚距离（distance 属性 + longfooted 附魔）
 * @returns {number|null}
 */
global.combatRollGetDistance = function (player) {
    let base = global.combatRollGetRawAttribute(player, 'combatroll:distance');
    if (base == null) return null;
    let lvl = global.combatRollGetEnchantmentLevel(player, 'combatroll:longfooted');
    return _applyCrEnch('DISTANCE', base, lvl);
};

/**
 * 有效充能速度（recharge 属性 * (1 + acrobat*0.1)）
 * @returns {number|null}
 */
global.combatRollGetRecharge = function (player) {
    let base = global.combatRollGetRawAttribute(player, 'combatroll:recharge');
    if (base == null) return null;
    let lvl = global.combatRollGetEnchantmentLevel(player, 'combatroll:acrobat');
    return _applyCrEnch('RECHARGE', base, lvl);
};

/**
 * 有效最大翻滚次数（count 属性 + multi_roll 附魔）
 * @returns {number|null}
 */
global.combatRollGetMaxRolls = function (player) {
    let base = global.combatRollGetRawAttribute(player, 'combatroll:count');
    if (base == null) return null;
    let lvl = global.combatRollGetEnchantmentLevel(player, 'combatroll:multi_roll');
    return Math.round(_applyCrEnch('COUNT', base, lvl));
};

/**
 * 单次充能冷却时长（tick）= round(roll_cooldown * 20 * (20 / recharge))
 * 默认配置下为 80 tick = 4 秒
 * @returns {number|null}
 */
global.combatRollGetCooldownTicks = function (player) {
    let cfg = global.combatRollGetConfig();
    if (!cfg) return null;
    let recharge = global.combatRollGetRecharge(player);
    if (recharge == null || recharge <= 0) return null;
    return Math.round(cfg.roll_cooldown * 20 * (20 / recharge));
};

/**
 * 翻滚持续时长（tick，期间禁止攻击/使用物品/破坏方块）
 * @returns {number|null}
 */
global.combatRollGetRollDurationTicks = function () {
    let cfg = global.combatRollGetConfig();
    return cfg ? cfg.roll_duration : null;
};

/**
 * 翻滚时赋予的无敌 tick 数（配置项，默认 0）
 * @returns {number|null}
 */
global.combatRollGetInvulnerableConfigTicks = function () {
    let cfg = global.combatRollGetConfig();
    return cfg ? cfg.invulnerable_ticks_upon_roll : null;
};

/**
 * 翻滚施加的水平速度大小（未计液体/摩擦修正）
 * 计算式：0.475 * (有效距离 + additional_roll_distance)
 * @returns {number|null}
 */
global.combatRollGetVelocityMagnitude = function (player) {
    let cfg = global.combatRollGetConfig();
    if (!cfg) return null;
    let dist = global.combatRollGetDistance(player);
    if (dist == null) return null;
    return 0.475 * (dist + cfg.additional_roll_distance);
};

// ---------- 翻滚无敌窗口（反射读取 mixin 字段 invulnerableTicks） ----------
let _crInvulnField = undefined; // undefined=未查; null=不存在; object=Field
let _crGetInvulnField = function () {
    if (_crInvulnField !== undefined) return _crInvulnField;
    try {
        let f = CR_LivingEntityCls.getDeclaredField('invulnerableTicks');
        f.setAccessible(true);
        _crInvulnField = f;
    } catch (e) {
        _crInvulnField = null;
    }
    return _crInvulnField;
};

/**
 * 玩家剩余的翻滚无敌 tick（服务端可观测的"刚翻滚"信号）
 * @returns {number} >0 表示处于翻滚无敌中；-1 表示无法读取（mod 未加载/字段不可达）
 */
global.combatRollGetInvulnerableTicks = function (player) {
    let f = _crGetInvulnField();
    if (!f) return -1;
    try { return f.getInt(player.minecraftEntity); }
    catch (e) { return -1; }
};

/**
 * 玩家当前是否处于翻滚无敌窗口内
 * @returns {boolean}
 */
global.combatRollIsInvulnerable = function (player) {
    return global.combatRollGetInvulnerableTicks(player) > 0;
};

// ---------- onGround 兼容读取（Mojang 为 public 字段 onGround，部分环境另有 isOnGround()） ----------
let _crOnGround = function (mc) {
    try { return mc.onGround; } catch (e) {}
    try { return mc.isOnGround(); } catch (e) {}
    return true; // 无法判定则不据此阻断
};

/**
 * 服务端可判定的翻滚前置条件（与 mod 的 tryRolling() 中服务端同步项一致）
 * 返回 {canRoll, reasons}。canRoll=true 仅代表"服务端必要条件满足"，
 * 不等于客户端一定会翻滚（客户端还要求：按键、未在翻滚中、有剩余次数、冷却完毕等）
 * @param {Internal.Player} player
 * @returns {{canRoll:boolean, reasons:string[]}}
 */
global.combatRollCanRoll = function (player) {
    let reasons = [];
    let cfg = global.combatRollGetConfig();
    if (!cfg) return { canRoll: false, reasons: ['CombatRoll 未加载'] };
    let mc = player.minecraftEntity;

    // 1. 空中判定
    if (!cfg.allow_rolling_while_airborn) {
        if (!_crOnGround(mc)) reasons.push('处于空中(且未允许空中翻滚)');
    }
    // 2. 饱食度
    try {
        if (mc.getFoodData().getFoodLevel() <= cfg.food_level_required)
            reasons.push('饱食度不足(需 > ' + cfg.food_level_required + ')');
    } catch (e) {}
    // 3. 游泳 / 匍匐
    try {
        if (mc.isSwimming()) reasons.push('游泳中');
        if (mc.isCrawling()) reasons.push('匍匐中');
    } catch (e) {}
    // 4. 骑乘
    try { if (mc.getVehicle() != null) reasons.push('骑乘中'); } catch (e) {}
    // 5. 使用物品 / 格挡
    try {
        if (mc.isUsingItem()) reasons.push('正在使用物品');
        if (mc.isBlocking()) reasons.push('正在格挡');
    } catch (e) {}
    // 6. 武器冷却
    if (!cfg.allow_rolling_while_weapon_cooldown) {
        try { if (mc.getAttackStrengthScale(0) < 0.95) reasons.push('武器冷却未满(<95%)'); } catch (e) {}
    }
    // 7. 移动速度属性 > 0（与 isRollAvailable 一致）
    try {
        if (mc.getAttributeValue(CR_MojangAttributes.MOVEMENT_SPEED) <= 0)
            reasons.push('移动速度属性为0');
    } catch (e) {}

    return { canRoll: reasons.length === 0, reasons: reasons };
};

/**
 * 获取玩家 CombatRoll 翻滚机制的综合信息（服务端可查询部分）
 * mod 未加载返回 null
 * @param {Internal.Player} player
 * @returns {object|null}
 */
global.getCombatRollInfo = function (player) {
    if (!global.combatRollIsLoaded()) return null;
    let cooldownTicks = global.combatRollGetCooldownTicks(player);
    return {
        loaded: true,
        distance: global.combatRollGetDistance(player),               // 有效距离
        recharge: global.combatRollGetRecharge(player),               // 有效充能
        maxRolls: global.combatRollGetMaxRolls(player),               // 最大次数
        enchantments: {
            longfooted: global.combatRollGetEnchantmentLevel(player, 'combatroll:longfooted'),
            acrobat:    global.combatRollGetEnchantmentLevel(player, 'combatroll:acrobat'),
            multi_roll: global.combatRollGetEnchantmentLevel(player, 'combatroll:multi_roll')
        },
        cooldownTicks: cooldownTicks,                          // 单次充能冷却(tick)
        cooldownSeconds: cooldownTicks == null ? null : cooldownTicks / 20,
        rollDurationTicks: global.combatRollGetRollDurationTicks(),  // 翻滚持续(tick)
        invulnerableConfigTicks: global.combatRollGetInvulnerableConfigTicks(), // 配置的无敌tick
        velocityMagnitude: global.combatRollGetVelocityMagnitude(player),       // 翻滚水平速度大小
        invulnerableTicksLeft: global.combatRollGetInvulnerableTicks(player),  // 剩余无敌tick(-1=不可读)
        isInvulnerable: global.combatRollIsInvulnerable(player),               // 是否处于翻滚无敌窗口
        canRoll: global.combatRollCanRoll(player),                    // {canRoll, reasons}
        cooldownRemainingTicks: global.combatRollGetCooldown(player),  // 服务端侧冷却剩余 tick
        onCooldown: global.combatRollIsOnCooldown(player),           // 服务端侧是否冷却中
        config: global.combatRollGetConfigSnapshot()
    };
};

// ==========================================
// 主动触发 / 冷却管理（服务端侧）
// ------------------------------------------
// 边界说明：
//   CombatRoll 的真实冷却 / 剩余次数 / 是否翻滚中 由客户端独占（RollManager），
//   服务端无法读写。下面的"冷却"是本库维护的【服务端侧冷却】，用于自定义系统
//   门控强制翻滚 / 完美闪避，与客户端 CombatRoll 冷却相互独立、不会同步。
//   强制翻滚只复刻服务端可见效果：施加速度 + 翻滚无敌窗口 + 饱食消耗 + 服务端冷却；
//   不播放翻滚动画（动画为客户端独占）。
// ==========================================

// ---------- 服务端侧冷却映射：uuid -> 结束 gameTime ----------
let _crCooldownMap = {};
let _crNow = function (player) {
    try { let t = player.level.getGameTime(); if (t) return t; } catch (e) {}
    try { return player.server.getTickCount(); } catch (e) {}
    try { return player.server.overworld().getGameTime(); } catch (e) {}
    return 0;
};
let _crPlayerKey = function (player) {
    try { return player.getUuid().toString(); } catch (e) { return String(player); }
};

/**
 * 设置服务端侧翻滚冷却（tick）。ticks<=0 表示清除冷却（就绪）。
 * 省略 ticks 时默认取该玩家计算出的单次充能冷却（combatRollGetCooldownTicks）。
 * @param {Internal.Player} player
 * @param {number} [ticks]
 * @returns {number} 实际设置的 tick 数
 */
global.combatRollSetCooldown = function (player, ticks) {
    if (!player) return 0;
    let key = _crPlayerKey(player);
    if (ticks == null) {
        let cd = global.combatRollGetCooldownTicks(player);
        ticks = (cd == null) ? 80 : cd;
    }
    if (ticks <= 0) { delete _crCooldownMap[key]; return 0; }
    _crCooldownMap[key] = _crNow(player) + ticks;
    return ticks;
};

/**
 * 获取当前服务端侧翻滚冷却剩余 tick（0 = 已就绪）
 * @param {Internal.Player} player
 * @returns {number}
 */
global.combatRollGetCooldown = function (player) {
    if (!player) return 0;
    let key = _crPlayerKey(player);
    let end = _crCooldownMap[key];
    if (end == null) return 0;
    let left = end - _crNow(player);
    return left > 0 ? left : 0;
};

/**
 * 是否处于服务端侧翻滚冷却中
 * @param {Internal.Player} player
 * @returns {boolean}
 */
global.combatRollIsOnCooldown = function (player) {
    return global.combatRollGetCooldown(player) > 0;
};

/**
 * 清除服务端侧翻滚冷却
 * @param {Internal.Player} player
 */
global.combatRollResetCooldown = function (player) {
    if (!player) return;
    delete _crCooldownMap[_crPlayerKey(player)];
};

// ---------- 内部：读取当前 deltaMovement（method/field 兼容） ----------
let _crGetDelta = function (mc) {
    try { let d = mc.getDeltaMovement(); return [d.x, d.y, d.z]; } catch (e) {}
    try { let d = mc.deltaMovement; return [d.x, d.y, d.z]; } catch (e) {}
    return [0, 0, 0];
};

// ---------- 内部：调用 RollInvulnerable.setRollInvulnerableTicks（mixin 方法） ----------
let _crSetInvuln = function (mc, ticks) {
    try { mc.setRollInvulnerableTicks(ticks); return true; }
    catch (e) { return false; }
};

/**
 * 计算翻滚施加的水平速度向量（复刻 mod 的方向/距离/液体/摩擦修正）
 * @param {Internal.Player} player
 * @param {number} forward  前后输入（-1..1，默认 1）
 * @param {number} sideways 左右输入（-1..1，默认 0）
 * @returns {{x:number,y:number,z:number}|null} mod 未加载返回 null
 */
global.combatRollComputeVelocity = function (player, forward, sideways) {
    let cfg = global.combatRollGetConfig();
    if (!cfg) return null;
    let dist = global.combatRollGetDistance(player);
    if (dist == null) return null;
    let mc = player.minecraftEntity;
    let f = (forward == null) ? 1 : forward;
    let s = (sideways == null) ? 0 : sideways;
    let dirX, dirZ;
    if (f === 0 && s === 0) { dirX = 0; dirZ = 1; }
    else { let len = Math.sqrt(s * s + f * f); dirX = s / len; dirZ = f / len; }
    let yaw;
    try { yaw = player.getYaw(); } catch (e) { yaw = 0; }
    // Vec3d.rotateY(-yaw)：x'=x*cos+z*sin ; z'=z*cos-x*sin
    let rad = (-1.0) * yaw * Math.PI / 180;
    let cos = Math.cos(rad), sin = Math.sin(rad);
    let rx = dirX * cos + dirZ * sin;
    let rz = dirZ * cos - dirX * sin;
    let mag = 0.475 * (dist + cfg.additional_roll_distance);
    let vx = rx * mag;
    let vz = rz * mag;
    // 水中：按水深衰减（min(height,1) * 0.5）
    try {
        if (mc.isInWater()) {
            let h = mc.getFluidHeight(CR_FluidTags.WATER);
            if (h > 1) h = 1;
            vx *= h * 0.5; vz *= h * 0.5;
        }
    } catch (e) {}
    // 岩浆中：固定 0.3
    try { if (mc.isInLava()) { vx *= 0.3; vz *= 0.3; } } catch (e) {}
    // 站立方块比草地更滑：按 (草地摩擦/当前摩擦)^2 衰减
    try {
        let below = mc.level.getBlockState(mc.blockPosition().below()).getBlock();
        let slip = below.getFriction();
        let grassSlip = 0.6; // 草地摩擦默认值
        if (slip > grassSlip) { let m = grassSlip / slip; vx *= m * m; vz *= m * m; }
    } catch (e) {}
    return { x: vx, y: 0, z: vz };
};

/**
 * 玩家完美闪避：触发翻滚无敌窗口（服务端 mixin 的 invulnerableTicks）
 * @param {Internal.Player} player
 * @param {number} [ticks] 无敌 tick 数；省略时取配置 invulnerable_ticks_upon_roll，
 *                         若配置为 0 则默认取 roll_duration 作为闪避窗口
 * @returns {{success:boolean, invulnerableTicks:number}}
 */
global.combatRollPerfectDodge = function (player, ticks) {
    let cfg = global.combatRollGetConfig();
    let inv;
    if (ticks == null) inv = cfg ? cfg.invulnerable_ticks_upon_roll : 0;
    else inv = ticks;
    if (!inv || inv < 0) inv = cfg ? cfg.roll_duration : 8; // 配置无无敌时，默认闪避窗口
    let ok = _crSetInvuln(player.minecraftEntity, inv);
    return { success: ok, invulnerableTicks: ok ? inv : 0 };
};

/**
 * 玩家使用了翻滚（服务端强制触发，复刻 RollPublish 的服务端效果）
 *  - 施加翻滚速度（复刻方向/距离/液体/摩擦修正）
 *  - 触发翻滚无敌窗口（配置 invulnerable_ticks_upon_roll，忠实于 mod）
 *  - 增加饱食消耗（配置 exhaust_on_roll）
 *  - 启动服务端侧冷却
 * 注意：不播放客户端翻滚动画（动画为客户端独占）。
 * @param {Internal.Player} player
 * @param {object} [opts]
 *   opts.forward {number}        前后输入（默认 1）
 *   opts.sideways {number}       左右输入（默认 0）
 *   opts.applyVelocity {boolean} 是否施加速度（默认 true）
 *   opts.invulnTicks {number}    覆盖无敌 tick
 *   opts.exhaust {number}        覆盖饱食消耗
 *   opts.setCooldown {boolean}   是否启动服务端冷却（默认 true）
 *   opts.cooldownTicks {number}  覆盖冷却 tick
 * @returns {{velocity:{x,y,z}|null, invulnerableTicks:number, exhaust:number, cooldownTicks:number}}
 */
global.combatRollTrigger = function (player, opts) {
    opts = opts || {};
    let cfg = global.combatRollGetConfig();
    let mc = player.minecraftEntity;
    let res = { velocity: null, invulnerableTicks: 0, exhaust: 0, cooldownTicks: 0 };

    // 1) 施加翻滚速度
    if (opts.applyVelocity !== false) {
        let v = global.combatRollComputeVelocity(player,
            opts.forward == null ? 1 : opts.forward,
            opts.sideways == null ? 0 : opts.sideways);
        if (v) {
            try {
                let cur = _crGetDelta(mc);
                player.setDeltaMovement(new Vec3d(cur[0] + v.x, cur[1] + v.y, cur[2] + v.z));
                player.hurtMarked = true;
            } catch (e) {}
            res.velocity = v;
        }
    }
    // 2) 翻滚无敌窗口（取配置值，忠实于 mod 的 RollPublish 处理）
    let inv = (opts.invulnTicks != null) ? opts.invulnTicks
            : (cfg ? cfg.invulnerable_ticks_upon_roll : 0);
    if (_crSetInvuln(mc, inv)) res.invulnerableTicks = inv;
    // 3) 饱食消耗
    let ex = (opts.exhaust != null) ? opts.exhaust : (cfg ? cfg.exhaust_on_roll : 0);
    if (ex) {
        try { mc.getFoodData().addExhaustion(ex); res.exhaust = ex; } catch (e) {}
    }
    // 4) 服务端侧冷却
    if (opts.setCooldown !== false) {
        let cd = (opts.cooldownTicks != null) ? opts.cooldownTicks
                : global.combatRollGetCooldownTicks(player);
        if (cd == null) cd = 80;
        global.combatRollSetCooldown(player, cd);
        res.cooldownTicks = cd;
    }
    return res;
};
