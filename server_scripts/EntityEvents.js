// priority: 500
// 监听伤害事件
EntityEvents.hurt(event => {
    const { entity, source } = event;
    // 玩家免疫伤害逻辑
    if (entity.isPlayer()) {
        if (!entity.level.isClientSide && entity.hasEffect("rainbow:democratic_save")) {
            event.cancel(); // 取消伤害
            return; // 提前返回避免后续处理
        }
    }

    // 黏液棒攻击逻辑
    if (source.player && entity) {
        if (source.player.getMainHandItem().id === "rainbow:slime_rod") {
            // 移除受害者所有护甲
            ["chest", "feet", "head", "legs"].forEach(slot => {
                if (entity.getItemBySlot(slot) && !entity.getItemBySlot(slot).isEmpty()) {
                    entity.block.popItem(entity.getItemBySlot(slot).id); // 掉落护甲
                    entity.getItemBySlot(slot).shrink(1); // 移除护甲
                }
            });

            // 消耗黏液棒耐久
            source.player.getMainHandItem().shrink(1);
        }
    }
});
//实体生成事件
EntityEvents.spawned(event => {
    let entity = event.getEntity();
    let level = event.getLevel();
    let inControl = ["youkaisfeasts:deer","youkaisfeasts:crab"]
    if (level.isClientSide()) return;
    if (!entity) return;

    let id = entity.getEncodeId();
    if (id == null) return;

    // 只检测传送门实体
/*    if (id.toString() === "gateways:endless_gateway" || id.toString() === "gateways:normal_gateway") {
        let pos = entity.getBlock().pos;

        let targetStructures = ["skyarena:ice_arena", "skyarena:sky_arena"];

        let inside = isInsideStructure(pos, level, targetStructures);

        if (inside) {
            return;
        }

        event.cancel();
    }
*/
    if(id.toString() == "minecraft:bee")
        {
            entity.persistentData.putString("like_food",Item.of(global.foodlist[Math.floor(randomInRange(0,global.foodlist.length - 1))]).getDisplayName().getString())
        }
    if(id.toString() === "alexscaves:nuclear_bomb")
        {
            let pos = entity.getBlock().pos;

            level.server.tell(`警告：侦测到核弹打击！坐标：${pos.x} ${pos.y} ${pos.z}`)

            console.log(`警告：侦测到核弹打击！坐标：${pos.x} ${pos.y} ${pos.z}`)
        }

    if (inControl.indexOf(id.toString()) != -1) 
        {
            let pos = entity.getBlock().pos;   // 实体位置
            event.cancel();                   // 取消原始实体生成
        }

    if(id.toString() == "shifted_lens:flying_fish")
        {
            let newEntity = level.createEntity("alexsmobs:flying_fish")
            newEntity.setPosition(entity.x,entity.y,entity.z)
            newEntity.spawn()
            event.cancel()
        }
});

EntityEvents.death(event => {
    const server = event.getServer();
    const entity = event.getEntity();
    const attacker = event.getSource().getPlayer();

    //tnt背包
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
        server.runCommandSilent(`/summon alexscaves:nuclear_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
        server.runCommandSilent(`/playsound alexscaves:nuclear_siren voice @a ~ ~ ~`)
    }
    //赌徒骰子
    if (hasCurios(attacker, "rainbow:dice") && !attacker.cooldowns.isOnCooldown("rainbow:dice")) {
        const lucky = attacker.getAttribute("minecraft:generic.luck").getValue();
        const mainHandItem = attacker.getItemInHand("main_hand").getId();
        const offHandItem = attacker.getItemInHand("off_hand").getId();
        if (randomBool(lucky / 10.0)) {
            attacker.cooldowns.removeCooldown(mainHandItem);
            attacker.cooldowns.removeCooldown(offHandItem);
            attacker.cooldowns.addCooldown("rainbow:dice",SecoundToTick(6))
        }
    }
    //怪物猎人勋章
    if (hasCurios(attacker, "rainbow:monster_charm")) {
        attacker.potionEffects.add("neapolitan:berserking", SecoundToTick(5), 0, false, false)
    }
})
