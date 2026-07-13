// priority: 500
// 抛射体撞击事件（占位）
ForgeEvents.onEvent("net.minecraftforge.event.entity.ProjectileImpactEvent", event => {
})

// 玩家放置方块事件
ForgeEvents.onEvent("net.minecraftforge.event.level.BlockEvent$EntityPlaceEvent", event => {
    try {
        let entity = event.getEntity()

        if (entity.level.clientSide) return;

/*
        if (entity && entity.getType && entity.getType() == "minecraft:falling_block" && entity.persistentData.KJS_IceProjectile) {
            let pos = (typeof event.getPos === "function") ? event.getPos() : entity.block.pos
            let radius = 4
            entity.level.getEntitiesWithin(AABB.ofBlock(pos).inflate(radius)).forEach(t => {
                if (!t || !t.isLiving() || !t.isAlive()) return
                if (entity.persistentData.OwnerName && t.isPlayer() && t.getName().getString() == entity.persistentData.OwnerName) return
                t.setTicksFrozen(200)
            })
        }*/
    } catch (e) {
        console.log("玩家放置方块事件出现问题：")
        console.log(e)
    }
})

// 玩家破坏方块速度事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerEvent$BreakSpeed", event => {
    try {
        let block = event.state.getBlock();
        let entity = event.getEntity()

        //if (entity.level.clientSide) return; // 有bug，暂时注释

        // 检测黑曜石和特定镐子（霜冻金属镐加速挖掘）
        if (event.originalSpeed >= 8.0 && entity.getItemInHand("main_hand").id == "rainbow:frostium_pickaxe") {
            // 修改破坏速度（原始值×16）
            event.newSpeed = 16 * event.originalSpeed;
        }
        
    } catch (e) {
        console.log("玩家破坏方块事件出现问题：")
        console.log(e)
    }
});

// 玩家右键实体事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerInteractEvent$EntityInteract", event => {
    try {
        let Player = event.getEntity();
        let Item = event.getItemStack();
        let Entity = event.getTarget();

        if (Entity.level.clientSide) return;
        /*
        // 示例：剪刀剪苦力怕（已注释）
        if (Player.isPlayer() && Player.isShiftKeyDown() && Item.getId() == "minecraft:shears" && Entity.getType() == "minecraft:creeper") {
            Entity.block.popItem("rainbow:greenblock")
        }*/
    } catch (e) {
        console.log("玩家右键生物事件出现问题：")
        console.log(e)
    }
});

// 监听实体仇恨变更事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingChangeTargetEvent", event => {
    try {
        let entity_A = event.getEntity() // 产生仇恨的实体
        let entity_B = event.getNewTarget() // 新的目标

        if (!entity_B) return

        // 佩戴对应生物面具的玩家不会被该种生物攻击
        if (entity_B.isLiving() && entity_B.isPlayer()) {
            if (entity_B.getItemBySlot("head").id == "species:wicked_mask" && entity_B.getItemBySlot("head").getNbt().getString("id") == entity_A.getType()) {
                event.setNewTarget(null) // 取消仇恨
            }
        }

        // 监守者不会攻击带有幽匿亲和的玩家
        if (entity_A.getType().equals("minecraft:warden") && entity_B.isPlayer()) {
            if (getCuriosItem(entity_B, 'rainbow:sculk_affinity') !== null) {
                event.setNewTarget(null)
            }
        }
    } catch (e) {
        console.log(e);
    }

})

/*
//tag武器（已注释）
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingAttackEvent",event=>{
        let player = event.source.player;
        let monster = event.entity;
        // ...
})
*/

// 监听效果过期事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Expired', event => {
    try {
        let entity = event.entity;
        let level = entity.level;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();

        // 下班时间到了，实体消失
        if (effectId === "effect.rainbow.off_work_time") {
            entity.discard()
        }

        // 虚化效果到期，移除油漆层
        if (effectId === "effect.rainbow.void") {
            entity.server.runCommandSilent("/dyeing paint remove " + entity.uuid + " void_effect")
        }

        if (effectId === "effect.rainbow.short_buff") {
            let item = entity.getItemInHand("main_hand");
            if (item.id == 'species:crankbow') {
                if (item.nbt.getBoolean("IsUsing") == true) {
                    item.nbt.putInt("Speed", 0);
                    // 计算朝向与起始位置
                    let viewVector = entity.getViewVector(1.0)
                    let length = Math.sqrt(viewVector.x() * viewVector.x() + viewVector.y() * viewVector.y() + viewVector.z() * viewVector.z())
                    let nor_x = viewVector.x() / length
                    let nor_y = viewVector.y() / length
                    let nor_z = viewVector.z() / length
                    let new_x = entity.x + nor_x * 1.5
                    let new_y = entity.y + entity.getEyeHeight()
                    let new_z = entity.z + nor_z * 1.5

                    let ice_chunk = level.createEntity("savage_and_ravage:ice_chunk")
                    ice_chunk.setPosition(new_x, new_y + 1, new_z)
                    ice_chunk.setMotion(nor_x * 1.3, nor_y * 1.3 + 0.2, nor_z * 1.3)
                    ice_chunk.setCaster(entity)
                    ice_chunk.spawn()
                }
            }
        }
    }
    catch (e) {
        console.log("监听buff过期出现问题：")
        console.log(e)
    }
});

// 监听效果赋予事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Added', event => {
    try {
        let entity = event.entity;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();

        // 虚化效果添加时，显示半透明油漆层（使用效果色的半透明版本）
        if (effectId === "effect.rainbow.void") {
            entity.server.runCommandSilent("/dyeing paint add static void_effect " + entity.uuid + " 80FFFFFF")
        }

        // 玩家专用逻辑：防化服免疫中毒/辐照/凋零
        if (!entity.isPlayer()) return;
        if (effectId.toString() == "effect.minecraft.poison" || effectId.toString() == "effect.alexscaves.irradiated" || effectId.toString() == "effect.minecraft.wither") {
            if (entity.getItemBySlot("head").id == 'alexscaves:hazmat_mask'
                && entity.getItemBySlot("chest").id == 'alexscaves:hazmat_chestplate'
                && entity.getItemBySlot("legs").id == 'alexscaves:hazmat_leggings'
                && entity.getItemBySlot("feet").id == 'alexscaves:hazmat_boots') {
                event.setCanceled(true);
            }
        }

    }
    catch (e) {
        console.log("监听buff赋予出现问题：")
        console.log(e)
    }
});

// 虚空炼成系统：物品掉入虚空后转化为指定产物
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityLeaveLevelEvent", (event) => {
    try {
        let { entity, level } = event;
        // 确保是物品掉入虚空
        if (level.clientSide || !entity.item || entity.getY() > level.getMinBuildHeight()) return;

        let inputItemId = entity.item.id;
        let inputCount = entity.item.count;

        // 配方列表：输入 → 输出
        let voidTransmuteRecipes = {
            'rainbow:raw_voidore': 'createutilities:void_steel_ingot'
        };

        // 检查是否有对应配方
        let outputItemId = voidTransmuteRecipes[inputItemId];
        if (!outputItemId) return;

        // 创建转化后的掉落物实体，数量对应
        let resultEntity = entity.block.createEntity("item");
        resultEntity.item = Item.of(outputItemId, inputCount);  // 👈 保留原始数量
        resultEntity.y = level.getMinBuildHeight() - 20;

        // 设置向上漂浮运动效果
        let riseSpeed = (entity.fallDistance - 43) / 50;
        resultEntity.setDeltaMovement(new Vec3d(0, riseSpeed, 0));
        resultEntity.setNoGravity(true);
        resultEntity.setGlowing(true);

        resultEntity.spawn();
    } catch (e) {
        console.log("虚空炼成系统出现问题：")
        console.log(e)
    }
});


// 监听左键空击事件（已注释大部分逻辑）
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickEmpty', event => {
    /* 
    // 剑气/投射物逻辑
    // ...
    */
})

// 监听效果移除事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Remove', event => {
    try {
        let entity = event.getEntity();
        if (!event.getEffectInstance()) return;
        let buffId = event.getEffectInstance().getDescriptionId();

        // 虚化效果被移除时，移除油漆层
        if (buffId == "effect.rainbow.void") {
            entity.server.runCommandSilent("/dyeing paint remove " + entity.uuid + " void_effect")
        }

        if (!entity.isPlayer()) return;

        let item_main = entity.getItemInHand("main_hand").getId();
        let item_off = entity.getItemInHand("off_hand").getId();

        // 嗜血效果移除逻辑：如果没有打伞，则会被点燃
        if (buffId == "effect.species.bloodlust") {
            if (item_main == 'artifacts:umbrella' || item_off == 'artifacts:umbrella') {
                event.setCanceled(true);
            }
            else {
                entity.secondsOnFire = 100;
                event.setCanceled(true);
            }
        }

    } catch (e) {
        console.log("监听玩家获取buff出现问题：")
        console.log(e)
    }
})

// 监听睡觉事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerSleepInBedEvent', event => {
    try {
        let player = event.getEntity();
        if (!player.isPlayer()) return;
        // 10% 概率做噩梦
        if (randomBool(0.1)) {
            player.tell("你做了个噩梦")
        }
    }
    catch (e) {
        console.log("监听睡觉出现问题：")
        console.log(e)
    }
});

// 监听死亡事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
    try {
        let player = event.getSource().getPlayer();
        if (event.getEntity().getLevel().isClientSide()) return;
        if (!player || !player.isPlayer()) return;

        // 宝箱吊坠：击杀计数逻辑
        let item = getCuriosItem(player, "rainbow:treasure_necklace");
        if (!item) return;

        let nbt = item.getOrCreateTag();

        // 读取计数
        let kills = nbt.getInt("kill");

        if (kills < 100) {
            nbt.putInt("kill", kills + 1);
        } else {
            nbt.putInt("kill", 0);
            item.setDamageValue(item.getDamageValue() + Integer.valueOf("100"))
            // 宝箱吊坠满 100 击杀：从战利品表生成奖励
            try {
                let pos = player.block.getPos();
                player.server.runCommandSilent("loot spawn " + pos.getX() + " " + pos.getY() + " " + pos.getZ() + " loot rainbow:treasure_necklace");
            } catch (lootErr) {
                console.log("宝箱吊坠战利品生成出现问题：");
                console.log(lootErr);
            }
        }

    } catch (e) {
        console.log("监听死亡出现问题：");
        console.log(e);
    }
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
    try {
        let player = event.getSource().getPlayer();
        if (event.getEntity().getLevel().isClientSide()) return;
        if (!player || !player.isPlayer()) return;

        // 大师球储存灵魂
        let item = getCuriosItem(player, "rainbow:dead_river");
        if (!item) return;

        if (player.getItemInHand("main_hand").id == 'species:spectralibur') return;

        let nbt = item.getOrCreateTag();

        let Souls = nbt.getInt("Souls");

        if (Souls == null) {
            nbt.putInt("Souls", 0)
        }
        else {
            nbt.putInt("Souls", Souls + 1)
        }

    } catch (e) {
        console.log("监听死亡出现问题：");
        console.log(e);
    }
});

//DamageSorce()
//怪物看到玩家事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingVisibilityEvent', event => {
    try {
        let target = event.entity;         // 被看的实体
        let observer = event.getLookingEntity(); // 观察者

        if (!target || !observer) return;

    } catch (e) {
        console.log("监听看见出现问题：");
        console.log(e);
    }
});
