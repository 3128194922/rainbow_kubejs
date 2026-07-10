
StartupEvents.registry("mob_effect", event => {
    // 半怪物化
    // 效果：增加进食收益，累加持续时间，满5分钟转化
    event.create("rainbow:monstering")
        .beneficial()
        .color(0x7F00FF)
        .displayName("半怪物化")

    // 怪物化
    // 效果：属性大幅提升，进食收益更高，消耗饥饿值
    event.create("rainbow:monster")
        .beneficial()
        .color(0xFF0000)
        .displayName("怪物化")
        // +30% 速度
        .modifyAttribute("minecraft:generic.movement_speed", "monster_speed", 0.3, "multiply_base")
        // +50% 攻击伤害
        .modifyAttribute("minecraft:generic.attack_damage", "monster_damage", 0.5, "multiply_base")
        // +20 最大生命值
        .modifyAttribute("minecraft:generic.max_health", "monster_health", 20, "addition")
        .effectTick((entity, amplifier) => {
            if (entity.isPlayer() && !entity.level.isClientSide()) {
                let player = entity;
                
                // 基础消耗 (原地不动也会消耗)
                let exhaustion = 0.02; 
                
                // 动作额外消耗 (模拟大幅增加饥饿消耗)
                if (player.isSprinting()) exhaustion += 0.05;
                if (player.isSwimming()) exhaustion += 0.05;
                if (player.horizontalCollision) exhaustion += 0.01; // 爬墙或碰撞
                
                player.addExhaustion(exhaustion);
                
                // 如果饥饿值归零，效果自动解除
                if (player.foodLevel <= 0) {
                    player.removeEffect("rainbow:monster");
                    player.tell("§c你太饿了，怪物化状态解除了。");
                }
            }
        })
});
