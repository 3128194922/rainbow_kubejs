// priority: 10000
// 定义远程伤害类型列表
const range_damage = [
    'atmospheric.passionFruitSeed',
    'soulBullet',
    'arrow',
    'lead_bolt',
    'create.potato_cannon'
];
// 定义投掷伤害类型列表
const thrown_damage = [
    'thrown',
    'trident',
    "dungeonsdelight.cleaver",
    'spirit_dinosaur'
];
// 定义魔法伤害类型列表
const soure_magic = [
    "indirectMagic",
    "magic"
];
// 定义爆炸伤害类型列表
const boom_damage = [
    "explosion.player",
    "explosion"
];

// CombatRoll 翻滚回传：葵花宝典佩戴者被动获得下一次伤害免疫。
ForgeEvents.onEvent("net.combatroll.forge.event.CombatRollEvent", event => {
    try {
        handleSunflowerCombatRollEvent(event);
    } catch (e) {
        console.log('[葵花宝典] CombatRollEvent入口出错: ' + e);
        console.log(e);
    }
});

//玩家 受伤时 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {
    try
{
    let context = createDamageContext(event);
    if (context == null) return;
    let victim = context.victim;
    let attacker = context.attacker;
    let source = context.source;
    if(victim.level.isClientSide()) return;

    // 派生伤害已经持有攻击预算；已结算分摊只进入最终扣血/债务阶段。
    let rebalanceHit = rebalanceActiveHit(victim, source);
    if (rebalanceHit != null && rebalanceHit.kind == 'share') return;
    if (rebalanceHit == null) {
    //抛射体无敌帧重置（最高优先级：抛射体命中后立即清零 invulnerableTime，修复多重射击）
    handleProjectileIFrame(event, victim, source, context);

    //背刺判定（最高优先级：隐匿状态下从目标背后攻击，伤害×2）
    handleBackstabDamage(event, attacker, victim, context);

    // 狂怒面具：记录本次非跳劈暴击窗口，供 LivingDamageEvent 发放暴击回血。
    markFuryCritical(event, attacker, victim, context);
    
    // 极限证章：佩戴者造成的全部伤害降低50%。
    handleDespairInsigniaDeath(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    
    //冻结代码
    handleFreezeEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 武器特效
    handleWeaponEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 饰品特效
    handleCuriosEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 攻击方通用加成只计算一次，再按相同预算进行神圣三段分解。
    onEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    customAttributeDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    if (rebalanceSplitDamage(event, attacker, victim, source, context)) return;
    } else if (rebalanceHit.kind == 'holy' && rebalanceHit.parent != null) {
        context.isRangeDamage = rebalanceHit.parent.isRangeDamage;
        context.isThrownDamage = rebalanceHit.parent.isThrownDamage;
    }

    //  玩家受伤事件
    if (context.victimIsPlayer) {
        onPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    //  非玩家受伤事件
    if (!context.victimIsPlayer) {
        onNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    // 宠物伤害逻辑
    if (attacker != null && context.attackerIsLiving && !context.attackerIsPlayer) {
        handleNonPlayerDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    // 核心充能逻辑（仅保留连射核心等仍使用旧充能表的饰品）
    handleCoreCharging(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 迷你Boss适应仅对已记录类型按等级减免25%/50%/75%。
    handleMiniBossPowers(event, attacker, victim, source);
    }
    catch(e)
    {
        console.log('LivingHurtEvent报错:')
        console.log(e)
    }
})
//玩家 受伤前 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingAttackEvent", event => {
    try
    {
    let context = createDamageContext(event);
    if (context == null) return;
    let victim = context.victim;
    let attacker = context.attacker;
    let source = context.source;

    //玩家/非玩家受伤前事件：根据上下文只进入一个分支。
    if (context.victimIsPlayer) {
        onBeforePlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    } else {
        onBeforeNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    //实体受伤前事件
    onBeforeNonEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }
    catch(e)
    {
        console.log('LivingAttackEvent报错:')
        console.log(e)
    }
})
//玩家 受伤后 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingDamageEvent", event => {
    try
    {
    let context = createDamageContext(event);
    if (context == null) return;
    let victim = context.victim;
    let attacker = context.attacker;
    let source = context.source;
    if(victim.level.isClientSide()) return;

    // 分摊伤害已完成原受击者的减伤，不再触发装备抵消或攻击派生；仍允许头骨接收债务。
    let rebalanceFinalHit = rebalanceActiveHit(victim, source);
    if (rebalanceFinalHit != null && rebalanceFinalHit.kind == 'share') {
        handleAncientSkullDamage(event, victim, source, context);
        return;
    }

    // 异星陨石：实际远程伤害触发拦截冲击波。
    alienMeteorIntercept(event, victim, source, context);

    // 玩家受伤后
    if (context.victimIsPlayer) {
        onPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    // 非玩家受伤后
    if (!context.victimIsPlayer) {
        onNonPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    // 实体受伤后
    onEntityDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 狂怒状态：每次实际造成伤害回复5点，非跳劈暴击额外回复20点。
    handleFuryMaskAttack(event, attacker, victim);

    // 圣经伤害抵消（纹饰盔甲每件 -1 伤害，最多 -4，最低为 0）
    if (context.victimIsPlayer) {
        handleTheBible(event, attacker, victim, source, context);
    }

    // 大胃袋（受伤时消耗饱和度抵消伤害，逻辑在 handleBigStomach.js）
    if (context.victimIsPlayer) {
        handleBigStomach(event, victim, context);
    }

    // 护甲/保护及圣经/大胃袋结算后转移25%；剩余部分才进入古圣头骨债务。
    if (context.victimIsPlayer) rebalanceShareDamage(event, victim, source, context);
    // 有限法球链：饮料→吐根→亵渎；神圣三段分别进入这个入口。
    rebalanceProcDamage(event, attacker, victim, source, context);

    // 古圣头骨：佩戴者受到的最终伤害转为债务并取消扣血（逻辑在 handleAncientSkull.js）
    handleAncientSkullDamage(event, victim, source, context);

    }
    catch(e)
    {
        console.log('LivingDamageEvent报错:')
        console.log(e)
    }
})

// 动能核心：成功触发 Apothic 闪避时释放固定 6 点基础伤害的范围爆破。
ForgeEvents.onEvent('com.morecallback.event.ApothicDodgeEvent', event => {
    try {
        onPlayerKineticCoreDodge(event);
    } catch (e) {
        console.log('[动能核心] 闪避事件处理入口出错：' + e);
        console.log(e);
    }
});

// 圣主之血：火焰易伤无视目标药水免疫强制附着。双事件覆盖两类免疫机制
// （逻辑在 handleHolyBlood.js）：anka/vzling Boss 覆写 addEffect 丢弃有害效果 → 高优先级事件；
// 常规 canBeAffected 免疫（灾变Boss等）→ MobEffectImmuneEvent。
/*ForgeEvents.onEvent('com.morecallback.event.MobEffectHighPriorityEvent', event => {
    try {
        handleHolyBloodForceAttach(event);
    } catch (e) {
        console.log('[圣主之血] MobEffectHighPriorityEvent入口出错：' + e);
        console.log(e);
    }
});*/
ForgeEvents.onEvent('com.morecallback.event.MobEffectImmuneEvent', event => {
    try {
        handleHolyBloodForceAttach(event);
    } catch (e) {
        console.log('[圣主之血] MobEffectImmuneEvent入口出错：' + e);
        console.log(e);
    }
});

//物品动态属性修改事件 主入口
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        // 无 NBT 的普通物品也需要进入处理器，以便读取提尔锋的主手属性。
        if (!item) return;

        handleItemAttributeModifier(event);
    } catch (e) {
        console.log(e);
    }
});
//玩家攻击实体事件 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.AttackEntityEvent", event => {
    try
    {
        let context = createAttackContext(event);
        if (context == null) return;
        let entity = context.attacker;
        let target = context.target;
        // Forge 攻击入口必须调用 KubeJS 1.20.1 可用的 isClientSide() 方法。
        if (entity.level.isClientSide()) return;
        if (entity.getType() == null || target.getType() == null) return;

        // 武器攻击实现
        handleAttackWeapon(event, entity, target, context);

        // 饰品攻击实现
        handleAttackCurios(event, entity, target, context);
    }
    catch(e)
    {
        console.log('AttackEntityEvent报错:')
        console.log(e)
    }
})
