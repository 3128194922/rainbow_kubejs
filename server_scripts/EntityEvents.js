// priority: 500
// ==========================================
// 👹 实体事件处理脚本
// ==========================================

// 监听实体受伤事件
EntityEvents.hurt(event => {
    const { entity, source } = event;

    // 黏液棒攻击逻辑
    if (source.player && entity) {
        // 如果攻击者手持黏液棒
        if (source.player.getMainHandItem().id === "rainbow:slime_rod") {
            // 移除受害者所有护甲（头、胸、腿、脚）
            ["chest", "feet", "head", "legs"].forEach(slot => {
                let armorItem = entity.getItemBySlot(slot);
                if (armorItem && !armorItem.isEmpty()) {
                    entity.popItem(armorItem.id); // 掉落护甲
                    armorItem.shrink(1); // 移除护甲
                }
            });

            // 消耗黏液棒耐久
            source.player.getMainHandItem().shrink(1);
        }
    }
    //撼俑免疫动能伤害（不然会崩溃）
    if(entity.getType() == "species:quake" && source.getType() == "generic")
        {
            event.cancel(); // 取消伤害
        }

    //大哥怒了！
    if (source.player) {
        let nbt = entity.nbt;
        let germoniumState = nbt.getString("Germonium");
        let luck = source.player.getAttribute("minecraft:generic.luck").getValue();

        if (germoniumState && germoniumState === "normal" && luck < 0) {
            // 获取玩家幸运值并计算触发概率 (绝对值/100)
            let probability = Math.abs(luck) / 100.0;

            // 只有满足概率才触发
            if (randomBool(probability)) {
                // 50% 概率决定形态
                let isInfernium = randomBool(0.5);
                let newForm = isInfernium ? "infernium" : "celestium";
                
                // 更新 NBT
                entity.mergeNbt({ Germonium: newForm });
                
                Utils.server.scheduleInTicks(1,event=>{
                    // 恢复满血
                    entity.setHealth(entity.getMaxHealth());
                })
            }
        }
    }
});

// 实体生成事件
EntityEvents.spawned(event => {
    let entity = event.getEntity();
    let level = event.getLevel();
    // 禁止生成的实体列表
    let inControl = ["youkaisfeasts:deer","youkaisfeasts:crab"]
    if (level.isClientSide()) return;
    if (!entity) return;

    let id = entity.getEncodeId();
    if (id == null) return;

    // --- 蜜蜂喜好食物设置 ---
    if(id.toString() == "minecraft:bee")
        {
            // 随机为蜜蜂分配一个喜好的食物，存储在 persistentData 中
            entity.persistentData.putString("like_food",Item.of(global.foodlist[Math.floor(randomInRange(0,global.foodlist.length - 1))]).getDisplayName().getString())
        }
    
    // --- 核弹侦测 ---
    if(id.toString() === "alexscaves:nuclear_bomb")
        {
            let pos = entity.getBlock().pos;

            level.server.tell(`警告：侦测到核弹打击！坐标：${pos.x} ${pos.y} ${pos.z}`)

            console.log(`警告：侦测到核弹打击！坐标：${pos.x} ${pos.y} ${pos.z}`)
        }

    // --- 禁止特定实体生成 ---
    if (inControl.indexOf(id.toString()) != -1) 
        {
            let pos = entity.getBlock().pos;   // 实体位置
            event.cancel();                   // 取消原始实体生成
        }

    // --- 飞鱼替换 ---
    // 将 shifted_lens:flying_fish 替换为 alexsmobs:flying_fish
    if(id.toString() == "shifted_lens:flying_fish")
        {
            let newEntity = level.createEntity("alexsmobs:flying_fish")
            newEntity.setPosition(entity.x,entity.y,entity.z)
            newEntity.spawn()
            event.cancel()
        }
});

// 实体死亡事件
EntityEvents.death(event => {
    const server = event.getServer();
    const entity = event.getEntity();
    const attacker = event.getSource().getPlayer();

    // --- 自爆背包逻辑 ---
    // 检查玩家或实体背部饰品栏是否有爆炸物，死后触发爆炸
    if (hasCurios(entity, "minecraft:tnt")) {
        server.runCommandSilent(`/summon minecraft:tnt ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
    } else if (hasCurios(entity, "oreganized:shrapnel_bomb")) {
        server.runCommandSilent(`/summon oreganized:shrapnel_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
    } else if (hasCurios(entity, "savage_and_ravage:spore_bomb")) {
        server.runCommandSilent(`/summon savage_and_ravage:spore_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
    }else if(hasCurios(entity,'alexscaves:nuclear_bomb'))
    {
        // 核弹背包
        server.runCommandSilent(`/summon alexscaves:nuclear_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
        server.runCommandSilent(`/playsound alexscaves:nuclear_siren voice @a ~ ~ ~`)
    }
    
    // --- 攻击者触发逻辑 ---
    if (!attacker) return;

    // 赌徒骰子：击杀时概率重置主副手物品冷却
    if (hasCurios(attacker, "rainbow:dice") && !attacker.cooldowns.isOnCooldown("rainbow:dice")) {
        const lucky = attacker.getAttribute("minecraft:generic.luck").getValue();
        const mainHandItem = attacker.getItemInHand("main_hand").getId();
        const offHandItem = attacker.getItemInHand("off_hand").getId();
        // 幸运值越高，触发概率越高
        if (randomBool(lucky / 10.0)) {
            attacker.cooldowns.removeCooldown(mainHandItem);
            attacker.cooldowns.removeCooldown(offHandItem);
            attacker.cooldowns.addCooldown("rainbow:dice",SecoundToTick(6))
        }
    }
    // 怪物猎人勋章：击杀获得狂暴效果
    if (hasCurios(attacker, "rainbow:monster_charm")) {
        attacker.potionEffects.add("neapolitan:berserking", SecoundToTick(5), 0, false, false)
    }
})
