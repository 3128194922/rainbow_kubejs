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

    //  玩家受伤事件
    if (context.victimIsPlayer) {
        onPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    //  非玩家受伤事件
    if (!context.victimIsPlayer) {
        onNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    //  实体受伤事件
    onEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 宠物伤害逻辑
    if (attacker != null && context.attackerIsLiving && !context.attackerIsPlayer) {
        handleNonPlayerDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
    }

    //  自定义属性流派
    customAttributeDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);

    // 核心充能逻辑（仅保留连射核心等仍使用旧充能表的饰品）
    handleCoreCharging(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context);
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

    }
    catch(e)
    {
        console.log('LivingDamageEvent报错:')
        console.log(e)
    }
})
//物品动态属性修改事件 主入口
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        if (!item || item.getNbt() == null) return;

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
        if (entity.level.clientSide) return;
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
