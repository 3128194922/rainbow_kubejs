// Priority: 5000
/**
 * 处理玩家攻击实体时的饰品附火效果
 * @param {Internal.AttackEntityEvent} event
 * @param {Internal.Player} entity
 * @param {Internal.Entity} target
 * @param {Object} context 攻击事件上下文
 */

// 流浪软糖包：Java 类与软糖列表缓存
/*let gummyListCache = null

function getGummyList() {
    if (gummyListCache != null) return gummyListCache
    try {
        let tagKey = ItemTags.create(new ResourceLocation('collectorsreap', 'gummies'))
        let tag = ForgeRegistries.ITEMS.tags().getTag(tagKey)
        if (tag == null) return null
        let list = []
        let iterator = tag.iterator()
        while (iterator.hasNext()) {
            let item = iterator.next()
            if (item != null) list.push(item)
        }
        if (list.length === 0) return null
        gummyListCache = list
        return gummyListCache
    } catch (e) {
        console.log('[流浪软糖包] 获取软糖列表失败: ' + e)
        return null
    }
}*/

function handleAttackCurios(event, entity, target, context) {
    // 第三阶段：复用攻击事件内的饰品索引，避免每个饰品判断都重新扫描 Curios 槽位。
    let curioIndex = null;
    let curioCodes = null;
    try {
        curioIndex = context != null ? context.attackerCurioIndex : null;
        if (curioIndex == null) {
            curioIndex = buildCurioIndex(entity);
            if (context != null) {
                context.attackerCurioIndex = curioIndex;
            }
        }
        curioCodes = global.FORGE_ATTACK_CURIO_CODES;
    } catch (err) {
        console.log("[攻击饰品分发] 初始化索引失败: " + err);
    }

    let hasAttackCurio = function(itemId, code) {
        return curioIndex != null && curioCodes != null && curioCodes[itemId] === code && curioIndex[itemId] != null;
    };

    // 末影手套：攻击时为目标附着末影火 3秒
    if (hasAttackCurio('rainbow:ender_glove', 1)) {
        if (global.SFire) {
            global.SFire.setOnFire(target, 3, "endergetic:ender");
        }
    }
    // 生灵手套：攻击时为目标附着生灵火 3秒
    if (hasAttackCurio('rainbow:living_gauntlet', 2)) {
        if (global.SFire) {
            global.SFire.setOnFire(target, 3, "dungeonsdelight:living");
        }
    }
    // 天秤座：攻击时交换双方药水效果
    if (hasAttackCurio('rainbow:libra', 3)) {
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
    if(hasAttackCurio('rainbow:gold_glove', 4))
    {
        try {
            if(target.isPlayer()) return; // 目标为玩家时不触发点金效果
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

    // 流浪软糖包：攻击概率触发随机软糖食用效果，2s冷却，幸运8时最大25%
    if (hasAttackCurio('rainbow:wandering_gummy_pack', 5)) {
        try {
            // 冷却检查（原版 cooldown 机制，2s）
            if (entity.cooldowns.isOnCooldown('rainbow:wandering_gummy_pack')) return

            // 幸运值影响概率：幸运8时最大25%，线性缩放
            let luck = entity.getAttribute("minecraft:generic.luck").getValue()
            if (luck <= 0) return
            let chance = 0.05 + Math.min(luck / 8, 1.0) * 0.20

            if (Math.random() < chance) {
                // 随机选取一种软糖
                //let gummyList = getGummyList()
                let gummyList = ['collectorsreap:glow_berry_gummy', 'collectorsreap:wild_berry_gummy', 'collectorsreap:pink_dragon_fruit_gummy', 'collectorsreap:bullet_pepper_gummy', 'collectorsreap:melon_gummy', 'collectorsreap:lime_gummy', 'collectorsreap:pomegranate_gummy', 'collectorsreap:yucca_gummy', 'collectorsreap:carrot_gummy', 'collectorsreap:passion_fruit_gummy', 'collectorsreap:apple_gummy', 'collectorsreap:aloe_gummy', 'collectorsreap:lucuma_gummy']
                if (gummyList == null) return

                let gummyItem = gummyList[Math.floor(Math.random() * gummyList.length)]
                let gummyStack = new ItemStack(gummyItem, 1)
                let foodProps = gummyStack.getFoodProperties(entity)

                if (foodProps != null) {
                    let effects = foodProps.getEffects()
                    for (let i = 0; i < effects.size(); i++) {
                        let pair = effects.get(i)
                        let effectInstance = pair.getFirst()
                        let probability = pair.getSecond()
                        if (Math.random() < probability) {
                            entity.potionEffects.add(
                                effectInstance.getEffect(),
                                effectInstance.getDuration(),
                                effectInstance.getAmplifier()
                            )
                        }
                    }
                }

                // 设置冷却（2s）
                entity.cooldowns.addCooldown('rainbow:wandering_gummy_pack', SecoundToTick(2))
            }
        } catch (err) {
            console.log("[流浪软糖包] 错误: " + err)
        }
    }

}
