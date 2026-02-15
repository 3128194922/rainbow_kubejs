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
    "dungeonsdelight.cleaver"
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
    const victim = event.entity;
    const attacker = event.source.actual;
    const source = event.source;
    if(victim.level.isClientSide()) return;
    try
    {    
    // 武器特效 (仅玩家)
    handleWeaponEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 饰品特效 (仅玩家)
    handleCuriosEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //玩家受伤事件
    onPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //非玩家受伤事件
    onNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 宠物伤害逻辑
    handleNonPlayerDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //自定义属性流派
    customAttributeDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    // 核心充能逻辑
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
    const victim = event.entity;
    const attacker = event.source.actual;
    const source = event.source;

    try
    {
    //玩家受伤前事件
    onBeforePlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);

    //非玩家受伤前事件
    onBeforeNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage);
    }
    catch(e)
    {
        console.log('LivingAttackEvent报错:')
        console.log(e)
    }
})
