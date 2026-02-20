// priority: 500
// =============================================
// 🛠️ Forge 事件处理脚本
// 作用：处理底层的 Forge 事件，包括玩家伤害、方块交互、属性修改、实体AI等
// =============================================

// =============================================
// 🧱 模块1：防御逻辑（受击方）
// 处理玩家受到伤害时的减免、特效触发等逻辑
// =============================================
// 已迁移至 ForgeEvents/onPlayerHurt.js 和 ForgeEvents/onNonPlayerHurt.js

// =============================================
// ⚔️ 模块2：武器伤害逻辑
// 处理玩家攻击时的特殊武器效果
// =============================================
// 已迁移至 ForgeEvents/handleWeaponEffects.js

// =============================================
// 💍 模块3：饰品与状态逻辑
// 处理攻击者佩戴饰品或拥有特定状态时的效果
// =============================================
// 已迁移至 ForgeEvents/handleCuriosEffects.js

// =============================================
// 🔋 模块3.6：饰品充能逻辑
// 处理玩家造成伤害时为特定饰品充能
// =============================================
// 已迁移至 ForgeEvents/handleCoreCharging.js

// =============================================
// 🔋 模块3.7：非玩家受伤逻辑
// 处理非玩家受伤
// =============================================
// 已迁移至 ForgeEvents/onNonPlayerHurt.js

// =============================================
// 💍 模块4：独特伤害类型流派
// 处理爆炸、魔法、投掷流派的伤害结算
// =============================================
// 已迁移至 ForgeEvents/customAttributeDamage.js

// =============================================
// ⚔️ 玩家受伤事件（主入口）
// =============================================
// 已迁移至 ForgeEvents/main.js


// 抛射体撞击事件（占位）
ForgeEvents.onEvent("net.minecraftforge.event.entity.ProjectileImpactEvent", event => {
})

// 玩家放置方块事件
ForgeEvents.onEvent("net.minecraftforge.event.level.BlockEvent$EntityPlaceEvent", event => {
    try {
        let entity = event.getEntity()

        if (entity.level.clientSide) return;

        // 禁止在 backroom 维度放置方块
        if (entity.level.name.getString() === "backroom:backroom") {
            event.setCanceled(true);
        }
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
        // 禁止在 backroom 维度挖掘
        if (entity.level.name.getString() === "backroom:backroom") {
            event.newSpeed = 0 * event.originalSpeed;
        }
    } catch (e) {
        console.log("玩家破坏方块事件出现问题：")
        console.log(e)
    }
});

// 玩家攻击实体事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.AttackEntityEvent", event => {
    try {
        let entity = event.getEntity();
        let target = event.getTarget();

        if (entity.level.clientSide) return;

        if (entity.getType() != null && target.getType() != null) {
            // 泰拉刃：增加充能等级
            if (entity.getItemInHand("main_hand") === 'rainbow:terasword') {
                if (!entity.getItemInHand("main_hand").nbt.power) {
                    entity.getItemInHand("main_hand").nbt.power = 1;
                }
                else {
                    if (entity.getItemInHand("main_hand").nbt.power < 4) {
                        entity.getItemInHand("main_hand").nbt.power = entity.getItemInHand("main_hand").nbt.power + 1;
                    }
                    else {
                        return;
                    }
                }
            }
            // 动力剑：充能逻辑
            if (entity.getItemInHand("main_hand") === 'rainbow:baseball_power') {
                console.log(entity.getItemInHand("main_hand").getNbt().getInt("Power"))
                if (!entity.getItemInHand("main_hand").getNbt().getInt("Power")) {
                    entity.getItemInHand("main_hand").getNbt().putInt("Power", 4)
                } else {
                    entity.getItemInHand("main_hand").getNbt().putInt("Power", entity.getItemInHand("main_hand").getNbt().getInt("Power") - 1)
                }

                // 充能耗尽，变回普通棒球棍
                if (entity.getItemInHand("main_hand").getNbt().getInt("Power") == 1) {
                    entity.setItemInHand("main_hand", "rainbow:baseball_bat")
                    entity.cooldowns.addCooldown("rainbow:baseball_bat", SecoundToTick(40))
                }
            }
            // 决斗剑：初始化类型
            if (entity.getItemInHand("main_hand") === 'rainbow:duel') {
                if (!entity.getItemInHand("main_hand").nbt.type) {
                    entity.getItemInHand("main_hand").nbt.type = none;
                }
            }
        }
    } catch (e) {
        console.log("玩家攻击事件出现问题：")
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

const AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier');

// 物品动态属性修改事件
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        if (!item || item.getNbt() == null) return;

        // 邪恶面具：根据 maskId 动态添加属性
        if (item.id === "species:wicked_mask" && slotType === "head") {
            let maskId = item.getNbt().getString("id")
            let attrs = global.MobMaskAttributeConfig[maskId]

            // ✅ 统一为数组，自动兼容 0、1、多个
            if (!attrs) return
            if (!Array.isArray(attrs)) attrs = [attrs]

            attrs.forEach(attr => {
                if (!attr || !attr.attribute) return
                event.addModifier(
                    attr.attribute,
                    new AttributeModifier(
                        attr.UUID,
                        attr.ID,
                        attr.NUMBER,
                        attr.OPERATION
                    )
                )
            })
        }

        // 🍳 饕餮之锅：食物数量影响攻击力
        let foodnum = item.getNbt().getInt("foodnumber") || 0;
        if (item.id === "rainbow:eldritch_pan" && slotType === "mainhand") {
            event.addModifier(
                "generic.attack_damage",
                new AttributeModifier(
                    'e93f7408-d7f1-4df1-a28f-43c2e16b004e',
                    'eldritch_pan',
                    1 * foodnum,
                    "addition"
                )
            );
        }
        /*
                // 🗡️ 饕餮剑：剑数量影响攻击力
                let swordnum = item.getNbt().getInt("swordnumber") || 0;
                if (item.id === "rainbow:eldritch_sword" && slotType === "mainhand") {
                    event.addModifier(
                        "generic.attack_damage",
                        new AttributeModifier(
                            'a1234567-b890-1234-c567-d89012345678', // 随机 UUID
                            'eldritch_sword',
                            1 * swordnum,
                            "addition"
                        )
                    );
                }
        */
        // 🗡️ 群系之刃：群系系数影响攻击力
        let biomenum = item.getNbt().getInt("biomenum") || 0;
        if (item.id === "rainbow:biome_of_sword" && slotType === "mainhand") {
            event.addModifier(
                "generic.attack_damage",
                new AttributeModifier(
                    'b6ea6b0f-a294-44d5-a5af-8793b02b19c4',
                    'biome_of_sword',
                    1 * biomenum,
                    "addition"
                )
            );
        }

    } catch (e) {
        console.log(e);
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
        if (!entity.isPlayer()) return;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();
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

/*
// 堕落之心逻辑（已注释）
// ...
*/

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
        if (!entity.isPlayer()) return;
        if (!event.getEffectInstance()) return;
        let buffId = event.getEffectInstance().getDescriptionId();
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

        // 牺牲护符：击杀计数逻辑
        let item = getCuriosItem(player, "rainbow:oceantooth_necklace");
        if (!item) return;

        let nbt = item.getOrCreateTag();

        // 读取计数
        let kills = nbt.getInt("kill");

        if (kills < 100) {
            nbt.putInt("kill", kills + 1);
        } else {
            nbt.putInt("kill", 0);
            item.setDamageValue(item.getDamageValue() + Integer.valueOf("100"))
            // 这里应该有生成战利品的逻辑，但目前只提示
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

        // 牺牲护符：击杀计数逻辑
        let item = getCuriosItem(player, "rainbow:infernotooth_necklace");
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
