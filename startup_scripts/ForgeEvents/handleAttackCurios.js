// Priority: 5000
/**
 * 处理玩家攻击实体时的饰品附火效果
 * @param {Internal.AttackEntityEvent} event
 * @param {Internal.Player} entity
 * @param {Internal.Entity} target
 */
function handleAttackCurios(event, entity, target) {
    // 末影手套：攻击时为目标附着末影火 3秒
    if (hasCurios(entity, 'rainbow:ender_glove')) {
        if (global.SFire) {
            global.SFire.setOnFire(target, 3, "endergetic:ender");
        }
    }
    // 生灵手套：攻击时为目标附着生灵火 3秒
    if (hasCurios(entity, 'rainbow:living_gauntlet')) {
        if (global.SFire) {
            global.SFire.setOnFire(target, 3, "dungeonsdelight:living");
        }
    }
    // 天秤座：攻击时交换双方药水效果
    if (hasCurios(entity, 'rainbow:libra')) {
        try {
            let playerEffects = entity.potionEffects.getActive();
            let targetEffects = target.potionEffects.getActive();
            for (let effect of targetEffects) {
                entity.potionEffects.add(effect.getEffect(), effect.getDuration(), effect.getAmplifier());
            }
            for (let effect of playerEffects) {
                target.potionEffects.add(effect.getEffect(), effect.getDuration(), effect.getAmplifier());
            }
        } catch (err) {
            console.log("[天秤座] 错误: " + err);
        }
    }
    //点金手套：概率点金对方，概率受玩家幸运值影响。点金效果：附着金块材质+冻结3秒后解冻移除
    if(hasCurios(entity, 'rainbow:gold_glove'))
    {
        try {
            let luck = entity.getAttribute("minecraft:generic.luck").getValue();
            if(luck < 0) return; // 幸运值为负时不触发点金效果
            let chance = luck/25; // 幸运值越高，点金概率越高，最大幸运值25时为100%
            if (Math.random() < chance) {
                let uuid = target.uuid.toString();
                let paintId = "gold_glove_effect";
                // 附着金块材质（静态UV）
                entity.server.runCommandSilent("/dyeing uv add static " + paintId + " " + uuid + " minecraft:textures/block/raw_gold_block.png 1.0 false false 8.0 8.0");

                // 冻结生物
                if (global.freezeEntity) {
                    global.freezeEntity(target);
                }
                // 3秒（60tick）后解冻并移除UV
                entity.server.scheduleInTicks(60, function() {
                    try {
                        if (global.unfreezeEntity) {
                            global.unfreezeEntity(target);
                        }
                        entity.server.runCommandSilent("/dyeing uv remove " + uuid + " " + paintId);
                    } catch (err) {
                        console.log("[点金手套] 解冻/移除错误: " + err);
                    }
                });
            }
        } catch (err) {
            console.log("[点金手套] 错误: " + err);
        }
    }

}
