//玩家 受伤时 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {
    const victim = event.entity;
    const attacker = event.source.actual;
    const source = event.source;

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
    //玩家受伤事件
    onPlayerHurt(event, attacker, source, range_damage, thrown_damage, soure_magic, boom_damage);
    //非玩家受伤事件
    onNonPlayerHurt(event, attacker, source, range_damage, thrown_damage, soure_magic, boom_damage);

    
})
//玩家 受伤前 主入口
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingAttackEvent", event => {
    
})