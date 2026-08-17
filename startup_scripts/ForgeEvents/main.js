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
//玩家 受伤时 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {
    let victim = event.entity;
    let attacker = event.source.actual;
    let source = event.source;
    if(victim.level.isClientSide()) return;
    try
{
    //抛射体无敌帧重置（最高优先级：抛射体命中后立即清零 invulnerableTime，修复多重射击）
    handleProjectileIFrame(event, victim, source);

    //背刺判定（最高优先级：隐匿状态下从目标背后攻击，伤害×2）
    handleBackstabDamage(event, attacker, victim);
    
    //极限证
    handleDespairInsigniaDeath(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);
    
    //冻结代码
    handleFreezeEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 武器特效
    handleWeaponEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 饰品特效
    handleCuriosEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //  玩家受伤事件
    onPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //  非玩家受伤事件
    onNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //  实体受伤事件
    onEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 宠物伤害逻辑
    handleNonPlayerDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //  自定义属性流派
    customAttributeDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 核心充能逻辑 (含狂怒面具：每累计100点伤害获得冷却缩减效果)
    handleCoreCharging(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);
    }
    catch(e)
    {
        console.log('LivingHurtEvent报错:')
        console.log(e)
    }
})
//玩家 受伤前 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingAttackEvent", event => {
    let victim = event.entity;
    let attacker = event.source.actual;
    let source = event.source;

    try
    {
    //玩家受伤前事件
    onBeforePlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //非玩家受伤前事件
    onBeforeNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //实体受伤前事件
    onBeforeNonEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);
    }
    catch(e)
    {
        console.log('LivingAttackEvent报错:')
        console.log(e)
    }
})
//玩家 受伤后 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingDamageEvent", event => {
    let victim = event.entity;
    let attacker = event.source.actual;
    let source = event.source;
    if(victim.level.isClientSide()) return;

    try
    {

    // 玩家受伤后
    onPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 非玩家受伤后
    onNonPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 实体受伤后
    onEntityDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 圣经伤害抵消（纹饰盔甲每件 -1 伤害，最多 -4，最低为 0）
    handleTheBible(event, attacker, victim, source);
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
    let entity = event.getEntity();
    let target = event.getTarget();

    if (entity.level.clientSide) return;
    if (entity.getType() == null || target.getType() == null) return;

    try
    {
        // 武器攻击实现
        handleAttackWeapon(event, entity, target);

        // 饰品攻击实现
        handleAttackCurios(event, entity, target);
    }
    catch(e)
    {
        console.log('AttackEntityEvent报错:')
        console.log(e)
    }
})
