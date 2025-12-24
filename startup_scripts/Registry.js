// priority: 1010
const ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack")

/*StartupEvents.registry("enchantment", event => {
    event.create("rainbow:livingrepair", "basic")
        .category("breakable")
        .maxLevel(3)
        .postHurt((source, target, level) => {
            if (source.isLiving()) {
                // 获取治疗量并计算应恢复的耐久值
                let healAmount = source.getAttribute("attributeslib:healing_received").getValue();
                let durabilityToRestore = healAmount * level;
                
                // 获取主手物品（假设是武器）
                let weapon = source.getMainHandItem();
                
                if (!weapon.isEmpty()) {
                    // 计算并设置新的耐久值
                    let currentDamage = weapon.getDamageValue();
                    let newDamage = Math.max(0, currentDamage - durabilityToRestore);
                    weapon.setDamageValue(newDamage);
                    
                    // 更新物品
                    source.setMainHandItem(weapon);
                }
            }
        })
        .displayName("生命修复");
});*/
StartupEvents.registry("enchantment", (event) => {
    //屹立不倒
    event.create("rainbow:last_stand")
        .rarity("rare")
        .armor()
        .maxLevel(2)

    // 生灵火 - 火焰附加
    event.create("rainbow:living_fire_aspect")
        .rarity("rare")
        .maxLevel(2)
        .weapon()

    // 末影火 - 火焰附加
    event.create("rainbow:ender_fire_aspect")
        .rarity("rare")
        .maxLevel(2)
        .weapon()
});
StartupEvents.registry("block", event => {
    //event.create(方块id, 方块类型)
    event.create("rainbow:luckyblock", "basic").requiresTool(true).grassSoundType().tagBlock("minecraft:mineable/shovel").defaultCutout().box(3, 0, 3, 13, 10, 13)
    //棱镜
    //event.create("rainbow:prism", "basic").requiresTool(true).tagBlock("minecraft:mineable/shovel").displayName("棱镜方块").stoneSoundType()
    //始冰
    event.create("rainbow:origin_ice_ore", "basic").material(getMaterialJS("STONE")).requiresTool().tagBlock(getMinecraftToolTag("镐")).tagBlock(getMinecraftToolTag("铁")).stoneSoundType()
    //虚空矿
    event.create("rainbow:void_ore", "basic").material(getMaterialJS("STONE")).requiresTool().tagBlock(getMinecraftToolTag("镐")).tagBlock(getMinecraftToolTag("铁")).stoneSoundType()
    //绿幕方块
    //event.create("rainbow:greenblock", "basic").opaque(true).suffocating(false).redstoneConductor(false).transparent(true)
})
StartupEvents.registry("fluid", event => {
    //黄铜液体
    event.create("rainbow:brass_fluid").thickTexture(0xF3E03B).noBucket().noBlock()
    //铜液体
    event.create("rainbow:copper_fluid").thickTexture(0xFA842B).noBucket().noBlock()
    //710液体
    event.create("rainbow:oil").thickTexture("BLACK")
        .density(2200)
        .viscosity(2200)
        .rarity('rare')
        //.noBucket()
        .noBlock()

    //液态逻辑
    event.create("rainbow:number_water")
        .stillTexture("rainbow:fluid/number_water")
        .flowingTexture("rainbow:fluid/number_water")
        .temperature(1000)
        .viscosity(1500)
        .density(6000)
        .bucketColor("GREEN")
        //.noBucket()
        .noBlock()
        .rarity('rare')
})
//物品增加
StartupEvents.registry("item", event => {

    //副本
    for (let i = 1; i <= 1; i++) {
        event.create(`rainbow:instance_pass${i}`, 'basic')
            .texture('rainbow:item/instance_pass')
            .tag('rainbow:instance_pass');
    }

    //牢大饮料
    event.create('rainbow:ice_tea', 'basic')
        .tooltip("§6获得曼巴之力，攻击带有根据速度的伤害加成和肘击音效")
        .tooltip("§7想你了，牢大")
        .maxStackSize(1)
        .rarity('epic')
        .useAnimation('drink')
        .use((level, player, hand) => {
            return true;
        })
        .useDuration(itemStack => 20)
        .finishUsing((itemstack, level, entity) => {
            if (level.isClientSide()) return itemstack
            level.server.runCommandSilent(`/playsound rainbow:man player @p ${entity.x} ${entity.y} ${entity.z} 1`)
            entity.potionEffects.add('rainbow:manba', SecoundToTick(180), 1)
            return itemstack;
        })

    //event.create('frost_layer', 'helmet')
    //苦力怕符文
    //event.create("rainbow:creeper_charm")
    //nbt工具
    event.create("rainbow:nbt_util")
    //金手指
    event.create("rainbow:golden_finger")
    //洛阳铲
    event.create("rainbow:luoyang_shovel","sword").maxDamage(100).attackDamageBonus(1).maxStackSize(1).attackDamageBaseline(1)
    //秘封琥珀
    event.create("rainbow:amber_bee")
    //发条怀表
    event.create("rainbow:chronos")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:chronos')) {
                        return false;
                    }
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % SecoundToTick(20)) return;

                    player.potionEffects.add("runiclib:chronos", SecoundToTick(10), 0, false, false)
                    //player.potionEffects.add("runiclib:tempus", SecoundToTick(5), 0, false, false)
                })
        )
    //乐谱
    event.create("rainbow:musical_score")
    //升级模板
    event.create("rainbow:cleaver_upgrade")
    //收容中心
    event.create("rainbow:mind_ctroller_detention")
    //净化绢布
    event.create("rainbow:purified_cloth")
        .useAnimation('bow')
        .useDuration(itemstack => 60)
        .use((level, player, hand) => true)
        .finishUsing((itemstack, level, entity) => {
            let main = entity.getItemInHand('main_hand');
            let off = entity.getItemInHand('off_hand');

            let enchantHelper = Java.loadClass('net.minecraft.world.item.enchantment.EnchantmentHelper');

            // 如果副手是附魔书，不处理
            if (off.id.endsWith('enchanted_book')) return;

            // 获取副手物品的附魔
            let enchants = enchantHelper.getEnchantments(off);

            // 删除所有诅咒类附魔
            let removed = enchants.keySet().removeIf(function (enchant) {
                return enchant.isCurse();
            });

            if (removed) {
                // 把新的附魔写回副手物品
                enchantHelper.setEnchantments(enchants, off);

                // 删除修复代价
                let tag = off.getOrCreateTag();
                tag.remove("RepairCost");

                // 消耗主手道具 1 个
                main.shrink(1);
            }

        })

    //大肉面
    //敢删我大肉面？我肘亖你！    

    event.create("rainbow:tengzou_noodles", "basic").maxStackSize(64).rarity("epic")
        .food(foodBuilder => {
            foodBuilder
                .alwaysEdible()
                .meat()
                .hunger(20)
                .saturation(1.0)
                .effect("farmersdelight:nourishment", 3600, 1, 1)
                .effect("farmersdelight:comfort", 3600, 1, 1)
        })
        .tooltip("§6出了滕州你才发现，这面有多么好吃")

    event.create("rainbow:flesh", "basic").maxStackSize(64).rarity("epic")
        .food(foodBuilder => {
            foodBuilder
                .alwaysEdible()
                .meat()
                .hunger(5)
                .saturation(5.0)
            //.effect("rainbow:youkaified", SecoundToTick(300), 1, 1)
        })
    //群系之刃
    event.create("rainbow:biome_of_sword", "sword").maxDamage(100).attackDamageBonus(3).maxStackSize(1).attackDamageBaseline(4.0)
    //决斗剑
    event.create("rainbow:duel", "sword").maxDamage(100).attackDamageBonus(3).maxStackSize(1).attackDamageBaseline(4.0)
        .tooltip("§6对同一类型生物伤害增加1.5")
    //虚空粗矿
    event.create("rainbow:raw_voidore", "basic")
    //魔爪
    event.create("rainbow:mozhua", "basic")
    //金属斧
    /*event.create("rainbow:frostium_axe", "axe").attackDamageBonus(5.0).attackDamageBaseline(3.0).maxDamage(501)
        .tooltip("§6对霜冻buff的敌人2.0倍伤害")*/
    //霜冻金属镐
    event.create("rainbow:frostium_pickaxe", "pickaxe")
        .maxDamage(1500)
        .maxStackSize(1)
        .tooltip("§6对硬度高的方块挖掘更快")
        .tag("minecraft:pickaxes")
        .tier(JSTier("DIAMOND"))
    //黏液棒
    event.create("rainbow:slime_rod", "sword").unstackable().glow(true).attackDamageBonus(0.0).attackDamageBaseline(0.0)
        .tooltip("右键：生成救生平台")
        .tooltip("潜行右键：生成救生罩")
        .tooltip("左键：脱下实体装备")
        .tag("curios:charm")
    //提尔锋
    event.create("rainbow:tyrfing", "sword").unstackable().attackDamageBonus(3.0).attackDamageBaseline(0.0).maxDamage(511)
        .tooltip("§6对有护甲的敌人造成额外伤害")
    //重锤
    event.create("rainbow:heavy_axe", "axe").unstackable().attackDamageBonus(3.0).attackDamageBaseline(0.0).maxDamage(501)
        .tooltip("§6根据你的下落加速度造成伤害")
    //饕餮之锅
    event.create("rainbow:eldritch_pan", "sword")
        .speedBaseline(-3.1)
        .attackDamageBonus(4.0)
        .rarity("epic")
        .maxDamage(0)
    //超精密构件
    event.create("rainbow:super_mechanism", "basic")
        .tooltip("§6高级合成材料")
    //屎
    event.create("rainbow:shit", "basic").food(foodBuilder => { foodBuilder.meat().hunger(-1).saturation(2.0).alwaysEdible().fastToEat().effect("minecraft:nausea", 300, 5, 0.99) })
        .tooltip("食用关闭游戏(吃晕了")
    //七彩石
    event.create("rainbow:rainbow_stone", "basic")
    //奇迹物质
    event.create("rainbow:miracle", "basic")
    //货币
    event.create("rainbow:coin_1", "basic")
    event.create("rainbow:coin_2", "basic")
    //动力剑
    event.create("rainbow:baseball_bat", "sword").attackDamageBonus(7.0).attackDamageBaseline(0.0)
    event.create("rainbow:baseball_power", "sword")
        .attackDamageBonus(19.0)
        .attackDamageBaseline(0.0)
    /*        .useAnimation('bow')
            .useDuration(itemstack => 40)
            .use((level, player, hand) => true)
            .finishUsing((itemstack, level, entity) => {
                let TIME = 80;
                // 添加药水效果
                entity.potionEffects.add("rainbow:power_sword", TIME, 0, false, false);
                itemstack.nbt.poweroff = 1;
                level.server.scheduleInTicks(TIME, () => {
                    itemstack.nbt.poweroff = 0;
                })
                level.server.runCommandSilent(`/playsound cataclysm:emp_activated voice @p ${entity.x} ${entity.y} ${entity.z}`)
                // 返回修改后的物品堆栈（而不是null）
                return itemstack;
            })*/
    //泰拉刃
    event.create("rainbow:terasword", "sword")
    /*.useAnimation('bow')
    .useDuration(itemstack => 40)
    .use((level, player, hand) => true)
    .finishUsing((itemstack, level, entity) => {
    })
    .releaseUsing((itemstack, level,entity, tick) => {
    })*/
    /**
     * 当物品未完成useDuration的时间刻就被释放后的行为
     * tick为距离完整的使用刻还有多少刻
     */
    //冲刺逻辑
    /*    .releaseUsing((itemstack, level, entity, tick) => {
                let far = 1-(tick/100);
                let lookVec = entity.getLookAngle();
                let speed = 3; // 较慢的持续速度
                entity.deltaMovement = new Vec3d(
                    lookVec.x()*far,
                    lookVec.y()*far,
                    lookVec.z()*far
                  ).scale(speed);
                entity.hurtMarked = true;
        })*/
    //逻辑数字
    let Numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'plus', 'minus', 'multiply', 'divide', 'missingno']
    Numbers.forEach(id => {
        event.create(`rainbow:${id}`, "basic").displayName(`逻辑 ${ItemToNumberF(id)}`)
    })
})
//实体注册
StartupEvents.registry('entity_type', event => {
    /*
        event.create('rainbow:frost_arrow', 'entityjs:arrow')
            .shouldRenderAtSqrDistance(context => {
                let { entity, distanceToPlayer } = context;
                // Custom logic to determine if the arrow should render based on distance, for example, rendering only if distance is less than 100 blocks
                return distanceToPlayer < 100;
            })
            .tryPickup(context => {
                // Custom logic to determine if a player can pick up the arrow, for example, allowing only non-creative mode players to pick it up
                return !context.player.isCreative();
            })
            .playerTouch(context => {
                let { player, entity } = context;
                // Custom behavior when a player touches the arrow, for example, giving the player the arrow
                if (!entity.getLevel().isClientSide() && (entity.onGround() || entity.noPhysics) && entity.shakeTime <= 0) {
                    player.take(entity, 1);
                    entity.discard();
                }
            })
            .tick(entity => {
                // Custom tick logic, for example, checking if the arrow is in lava and setting it on fire
                if (entity.getLevel().getBlockState(entity.blockPosition()).getBlock().id == "minecraft:lava") {
                    entity.setSecondsOnFire(5);
                }
            })
            .textureLocation(entity => {
                //Change texture resource location depending on certain information about the arrow entity.
                //Accepts both a new ResourceLocation or a String representation.
                //new ResourceLocation("kubejs:textures/entity/projectiles/arrow.png")
                return "rainbow:textures/entity/frost_arrow.png"
            })
    */
    event.create('rainbow:tnt_arrow', 'entityjs:arrow')
        .setKnockback(2)
        .setBaseDamage(0.5)
        .clientTrackingRange(8)
        .isAttackable(true)
        .sized(1, 1)
        .updateInterval(3)
        .defaultHitGroundSoundEvent("minecraft:entity.arrow.hit")
        .setWaterInertia(0.1)
        .mobCategory('misc')
        .item(item => {
            item.maxStackSize(64);
        })
        .textureLocation(() => "rainbow:textures/entity/tnt_arrow.png")

        // 触碰生物时启动延迟爆炸
        .onHitEntity(context => {
            let { entity } = context;
            let level = entity.getLevel();
            let server = entity.getServer();

            if (level.isClientSide()) return;
            server.scheduleInTicks(40, () => {
                level.createExplosion(entity.x, entity.y - 1, entity.z)
                    .causesFire(false)
                    .exploder(entity)
                    .explosionMode("none")
                    .strength(3)
                    .explode();
            })
            entity.discard()
        })

        // 触碰方块时启动延迟爆炸
        .onHitBlock(context => {
            let { entity } = context;
            let level = entity.getLevel();
            let server = entity.getServer();

            if (level.isClientSide()) return;
            server.scheduleInTicks(40, () => {
                level.createExplosion(entity.x, entity.y - 1, entity.z)
                    .causesFire(false)
                    .exploder(entity)
                    .explosionMode("none")
                    .strength(3)
                    .explode();

                entity.discard();
            })
        })
        .displayName("延迟TNT箭")
        // 玩家触碰箭时（可选：阻止被捡起）
        .playerTouch(context => {
            let { player, entity } = context;
            // 可选地阻止玩家捡起
            // player.sendSystemMessage("这支箭即将爆炸！");
        });

    event.create('rainbow:trea', 'entityjs:arrow')
        .setKnockback(2)
        .setBaseDamage(0.8)
        .clientTrackingRange(8)
        .isAttackable(true)
        .sized(0.5, 0.5)
        .updateInterval(3)
        .defaultHitGroundSoundEvent("minecraft:entity.arrow.hit")
        .setWaterInertia(1)
        .mobCategory('misc')
        .item(item => {
            item.maxStackSize(64);
        })
        .textureLocation(() => "rainbow:textures/entity/trea.png")
        .playerTouch(context => { })
        .displayName("泰拉弹幕")
        .noItem()
});
/*
// 加载必要的Java类（用于原版战利品系统）
let $LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.LootParams$Builder');
let $LootContextParamSets = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParamSets');
let $Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks');

StartupEvents.registry("block", event => {
    event.create("rainbow:docker").woodSoundType()
        .displayName("Docker(钓鱼型)")
        .blockEntity((entityInfo) => {
            entityInfo.inventory(9, 1); // 9格容器
            entityInfo.rightClickOpensInventory();

            // 每20 ticks（1秒）调用一次战利品表
            entityInfo.serverTick(20, 0, (entity) => {

                let pos = entity.blockPos.above(); // 上方方块坐标
                let blockAbove = entity.level.getBlockState(pos).getBlock();

                let blockId = blockAbove.id.toString();
                //minecraft:lava
                if (blockId === "minecraft:water" || blockId === "minecraft:lava") {

                    let lootTable = entity.level.getServer().getLootData().getLootTable(blockId === "minecraft:water" ? "minecraft:gameplay/fishing" : "netherdepthsupgrade:gameplay/nether_fishing");
                    let lootParams = new $LootParams(entity.level).create($LootContextParamSets.EMPTY);
                    let lootItems = lootTable.getRandomItems(lootParams);

                    lootItems.forEach(item => {
                        entity.inventory.insertItem(item, false); // false表示不模拟
                    });
                }
            });

            // 红石交互（保持不变）
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.up)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
    });*/

StartupEvents.registry("block", event => {
    event.create("rainbow:soul_hex_block")
        .woodSoundType()
        .displayName("灵脂蜡块")
        .blockEntity(entityInfo => {
            // 每 20 tick 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return; // 只在服务端执行

                let pos = entity.blockPos; // 方块坐标
                let range = 5; // 半径范围
                let aabb = AABB.ofBlock(pos).inflate(range);

                // 获取范围内的所有活体实体
                let entities = level.getEntitiesOfClass(Java.loadClass("net.minecraft.world.entity.LivingEntity"), aabb);

                for (let e of entities) {
                    if (e.isPlayer()) continue;
                    e.persistentData.docker = true;

                }
            });

            // 红石交互能力保持不变
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.UP)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(单发)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 5;

                let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                let entities = level.getEntitiesOfClass($LivingEntity, AABB.ofBlock(pos).inflate(range));

                // 找到第一个有效目标
                let target = null;
                for (let e of entities) {
                    if (e.isPlayer()) continue;
                    if (e.isDeadOrDying()) continue;
                    target = e;
                    break;
                }
                if (!target) return;

                let tx = target.getX() - x;
                let ty = target.getEyeY() - y;
                let tz = target.getZ() - z;
                let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (dist < 0.5 || dist > range) return;

                let dirX = tx / dist;
                let dirY = ty / dist;
                let dirZ = tz / dist;

                // 依次检查 9 个物品槽，优先第一个可用的
                for (let slot = 0; slot < 9; slot++) {
                    let itemStack = entity.inventory.getItem(slot);
                    if (itemStack.isEmpty()) continue;

                    // 检查是否属于 #minecraft:arrows 标签
                    if (!itemStack.hasTag("minecraft:arrows")) continue;

                    // 一直发射直到这个物品槽为空
                    //while (!itemStack.isEmpty()) {
                    let projectileName = itemStack.id;
                    try {
                        let projectile = level.createEntity(projectileName);
                        if (!projectile) break;

                        let randomOffsetX = (Math.random() - 0.5) * 0.05;
                        let randomOffsetY = (Math.random() - 0.5) * 0.05;
                        let randomOffsetZ = (Math.random() - 0.5) * 0.05;

                        projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                        projectile.setMotion(dirX * 2.5, dirY * 2.5, dirZ * 2.5);
                        projectile.spawn();

                        // 消耗一个物品
                        itemStack.shrink(1);
                        entity.inventory.setItem(slot, itemStack);

                    } catch (err) {
                        console.warn(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        break;
                    }
                    //}

                    // 找到第一个有效的槽位后，不再检查其他槽
                    break;
                }
            });

            // 保留物品栏能力
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.UP)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});


StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter_fire")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(火力)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(5, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 5;

                let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                let entities = level.getEntitiesOfClass($LivingEntity, AABB.ofBlock(pos).inflate(range));

                // 找到第一个有效目标
                let target = null;
                for (let e of entities) {
                    //if (e.isPlayer()) continue;
                    if (e.isDeadOrDying()) continue;
                    target = e;
                    break;
                }
                if (!target) return;

                let tx = target.getX() - x;
                let ty = target.getEyeY() - y;
                let tz = target.getZ() - z;
                let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (dist < 0.5 || dist > range) return;

                let dirX = tx / dist;
                let dirY = ty / dist;
                let dirZ = tz / dist;

                // 依次检查 9 个物品槽，优先第一个可用的
                for (let slot = 0; slot < 9; slot++) {
                    let itemStack = entity.inventory.getItem(slot);
                    if (itemStack.isEmpty()) continue;

                    // 检查是否属于 #minecraft:arrows 标签
                    if (!itemStack.hasTag("minecraft:arrows")) continue;

                    // 一直发射直到这个物品槽为空
                    //while (!itemStack.isEmpty()) {
                    let projectileName = itemStack.id;
                    try {
                        let projectile = level.createEntity(projectileName);
                        if (!projectile) break;

                        let randomOffsetX = (Math.random() - 0.5) * 0.05;
                        let randomOffsetY = (Math.random() - 0.5) * 0.05;
                        let randomOffsetZ = (Math.random() - 0.5) * 0.05;

                        projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                        projectile.setMotion(dirX * 2.5, dirY * 2.5, dirZ * 2.5);
                        projectile.spawn();

                        // 消耗一个物品
                        itemStack.shrink(1);
                        entity.inventory.setItem(slot, itemStack);

                    } catch (err) {
                        console.warn(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        break;
                    }
                    //}

                    // 找到第一个有效的槽位后，不再检查其他槽
                    break;
                }
            });

            // 保留物品栏能力
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.UP)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter_plus")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(散射)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(60, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 10;

                let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                let entities = level.getEntitiesOfClass($LivingEntity, AABB.ofBlock(pos).inflate(range));

                // 对范围内的每个有效目标逐一发射
                for (let target of entities) {
                    if (target.isPlayer()) continue;
                    if (target.isDeadOrDying()) continue;

                    let tx = target.getX() - x;
                    let ty = target.getEyeY() - y;
                    let tz = target.getZ() - z;
                    let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                    if (dist < 0.5 || dist > range) continue;

                    let dirX = tx / dist;
                    let dirY = ty / dist;
                    let dirZ = tz / dist;

                    // 从第一个可用槽中消耗一支箭
                    for (let slot = 0; slot < 9; slot++) {
                        let itemStack = entity.inventory.getItem(slot);
                        if (itemStack.isEmpty()) continue;

                        // 检查是否属于箭类物品
                        if (!itemStack.hasTag("minecraft:arrows")) continue;

                        let projectileName = itemStack.id;
                        try {
                            let projectile = level.createEntity(projectileName);
                            if (!projectile) break;

                            let randomOffsetX = (Math.random() - 0.5) * 0.05;
                            let randomOffsetY = (Math.random() - 0.5) * 0.05;
                            let randomOffsetZ = (Math.random() - 0.5) * 0.05;

                            projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                            projectile.setMotion(dirX * 2.5, dirY * 2.5, dirZ * 2.5);
                            projectile.spawn();

                            // 消耗一支箭
                            itemStack.shrink(1);
                            entity.inventory.setItem(slot, itemStack);
                        } catch (err) {
                            console.warn(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        }

                        // 发射一发后不再从其他槽消耗
                        break;
                    }
                }
            });

            // 保留物品栏能力
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.UP)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_nether_off")
        .randomTick(event => {
            let level = event.getLevel();
            let block = event.block;
            let pos = block.pos;

            if (level.getName().getString() == "minecraft:the_nether" && Math.random() < 0.1) {
                level.setBlock(pos, Block.id('rainbow:docker_nether_on').blockState, 3);
            }
        })
        .woodSoundType()
        .displayName("下界反应堆(未激活)");

});

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_nether_on")
        .woodSoundType()
        .displayName("下界反应堆(激活)")
        .blockEntity(entityInfo => {

            const scanRadius = 5;

            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let recordSet = new Set();

                // === 遍历周围方块 ===
                for (let dx = -scanRadius; dx <= scanRadius; dx++) {
                    for (let dy = -scanRadius; dy <= scanRadius; dy++) {
                        for (let dz = -scanRadius; dz <= scanRadius; dz++) {
                            let targetPos = pos.offset(dx, dy, dz);
                            let targetBlock = level.getBlock(targetPos);
                            if (targetBlock.id != "minecraft:jukebox") continue;

                            let be = level.getBlockEntity(targetPos);
                            if (!be) continue;

                            // ✅ 关键：获取方块实体的 NBT 数据
                            let nbt = be.saveWithFullMetadata();
                            if (!nbt) continue;

                            // ✅ 检查是否正在播放音乐并提取唱片 ID
                            if (nbt.IsPlaying && nbt.RecordItem && nbt.RecordItem.id) {
                                recordSet.add(nbt.RecordItem.id);
                            }
                        }
                    }
                }

                // === 写入方块实体 NBT ===
                let data = entity.persistentData;
                data.record_count = recordSet.size;

                // 初始化计数器
                if (!data.tick_counter) data.tick_counter = 0;

                // 按当前唱片种类数增加计数器
                data.tick_counter += recordSet.size;

                //console.log(`[DockerNether] 唱片种类: ${recordSet.size}, 当前计数: ${data.tick_counter}`);

                // === 达到1000计数时奖励物品 ===
                if (data.tick_counter >= 1000) {
                    data.tick_counter = 0;

                    let reward = Item.of("uniyesmod:nether_of_voice");
                    entity.inventory.insertItem(reward, false);
                    //console.log(`[DockerNether] 🎵 奖励已发放: ${reward}`);
                }
            });

            // 红石交互
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.UP)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});

// Docker 末影型
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender")
        .woodSoundType()
        .displayName("docker(末影型)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();
            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                // 确保 entity.data 存在
                if (!entity.data || !entity.data.uuid) return;

                // 从 data 中获取玩家 UUID
                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.getPlayerByUUID(uuid);

                // 如果找到了玩家
                if (player) {
                    let enderChest = player.getEnderChestInventory();

                    for (let i = 0; i < 9; i++) {
                        let stackInBlock = entity.inventory.getItem(i)
                        if (stackInBlock.isEmpty()) continue
                    
                        // 1️⃣ 复制一份用于插入（非常重要）
                        let toInsert = stackInBlock.copy()
                    
                        // 2️⃣ 尝试插入末影箱
                        let remaining = enderChest.insertItem(toInsert, false)
                    
                        // 3️⃣ 计算成功插入的数量
                        let inserted = toInsert.getCount() - remaining.getCount()
                        if (inserted <= 0) continue
                    
                        // 4️⃣ 只减少方块容器里的数量
                        stackInBlock.shrink(inserted)
                    
                        // 5️⃣ 如果空了就清槽
                        if (stackInBlock.isEmpty()) {
                            entity.inventory.setItem(i, ItemStack.EMPTY)
                        } else {
                            entity.inventory.setItem(i, stackInBlock)
                        }
                    }
                    
                }
            });

            // 红石交互：物品插入与提取
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn(() => true)  // 允许所有方向
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );            
        });
});

// Docker 末影加强型
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender_player")
        .woodSoundType()
        .displayName("docker(末影加强型)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                // 确保 entity.data 存在
                if (!entity.data || !entity.data.uuid) return;

                // 从 data 中获取玩家 UUID
                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.getPlayerByUUID(uuid);

                // 如果找到了玩家
                if (player) {
                    let playerInventory = player.getInventory();

                    for (let i = 0; i < 9; i++) {
                        let stackInBlock = entity.inventory.getItem(i)
                        if (stackInBlock.isEmpty()) continue
                    
                        // 1️⃣ 复制一份用于插入（非常重要）
                        let toInsert = stackInBlock.copy()
                    
                        // 2️⃣ 尝试插入物品到玩家物品栏
                        let remaining = playerInventory.insertItem(toInsert, false)
                    
                        // 3️⃣ 计算成功插入的数量
                        let inserted = toInsert.getCount() - remaining.getCount()
                        if (inserted <= 0) continue
                    
                        // 4️⃣ 只减少方块容器里的数量
                        stackInBlock.shrink(inserted)
                    
                        // 5️⃣ 如果空了就清槽
                        if (stackInBlock.isEmpty()) {
                            entity.inventory.setItem(i, ItemStack.EMPTY)
                        } else {
                            entity.inventory.setItem(i, stackInBlock)
                        }
                    }
                    
                }
            });

            // 红石交互：物品插入与提取
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn(() => true)  // 允许所有方向
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );            
        });
});



//荷鲁斯之爪
StartupEvents.registry('item', event => {
    event.create('rainbow:clawofhorus')
        .tooltip("攻击生物概率恢复冷却")
        .displayName("荷鲁斯之爪")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

//闪电瓶
StartupEvents.registry('item', event => {
    event.create('rainbow:lightning')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

//心灵宝石
StartupEvents.registry('item', event => {
    event.create('rainbow:mind')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

//赌徒骰子
StartupEvents.registry('item', event => {
    event.create('rainbow:dice')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

//牺牲护符
StartupEvents.registry('item', event => {
    event.create('rainbow:sacrificial_amulet')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

//暴食之符
StartupEvents.registry('item', event => {
    event.create('rainbow:gluttony_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(event => {
                    let player = event.slotContext.entity();

                    if (player == null) return;

                    let multiplier = 0;

                    let hungry = player.getFoodData().getFoodLevel();

                    if (hasCurios(player, "rainbow:berserk_emblem")) {
                        multiplier = ((1 - hungry / 20) * 0.8 + (1 - player.getHealth() / player.getMaxHealth()) * 0.4) + 1;

                    }
                    else {
                        multiplier = 1 - hungry / 20 + 1;
                    }


                    event.modify("generic.attack_damage", "hungry_charm_damage", 0.04 * multiplier, "multiply_total");
                    event.modify("generic.movement_speed", "hungry_charm_damage", 0.0025 * multiplier, "multiply_total");
                    event.modify("l2damagetracker:damage_reduction", "hungry_charm_damage", -0.05 * multiplier, "addition");
                    event.modify("attributeslib:crit_damage", "hungry_charm_damage", 0.0125 * multiplier, "multiply_total");

                })
                .curioTick((slotContext, stack) => {
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    if (stack.nbt.getBoolean("update") == null) {
                        stack.nbt.putBoolean("update", false)
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"))
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:gluttony_charm')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 贪咀护符
StartupEvents.registry('item', event => {
    event.create('rainbow:cruncher_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                // ================================
                // ❤️ 核心机制：饥饿换血
                // ================================
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity || !entity.isPlayer()) return;

                    let player = entity;
                    if (player.age % 20) return;
                    let foodData = player.getFoodData();
                    let foodLevel = foodData.getFoodLevel();
                    let saturation = foodData.getSaturationLevel();
                    let health = player.getHealth();
                    let maxHealth = player.getMaxHealth();

                    // 仅在血量未满时触发
                    if (health < maxHealth) {

                        // 若饥饿值低于 6，则不再继续转换
                        if (foodLevel <= 6) return;

                        // 恢复
                        player.heal(1);

                        // 消耗饥饿和饱和度：转化比 1:1
                        let cost = 1; // 每tick消耗量，可以调整
                        let newFood = foodLevel - cost;
                        let newSaturation = Math.max(0, saturation - cost);

                        // 防止饥饿值降到 3 以下
                        if (newFood < 6) {
                            cost -= (6 - newFood);
                            newFood = 6;
                        }

                        foodData.setFoodLevel(newFood);
                        foodData.setSaturation(newSaturation);
                    }
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 禁止多重佩戴
                    if (hasCurios(entity, 'rainbow:cruncher_charm')) {
                        return false;
                    }
                    return true;
                })
        );
});


//大胃袋
StartupEvents.registry('item', event => {
    event.create('rainbow:big_stomach')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % SecoundToTick(5)) return;

                    player.potionEffects.add("uniyesmod:lozenge", SecoundToTick(10), 0, false, false);
                    player.potionEffects.add("uniyesmod:appetizing", SecoundToTick(10), 0, false, false);
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:big_stomach')) {
                        return false;
                    }
                    return true;
                })
        )
})

//武器大师勋章
StartupEvents.registry('item', event => {
    event.create('rainbow:hero_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(event => {
                    let player = event.slotContext.entity();

                    if (player == null) return;

                    let attackspeed = player.getAttribute("generic.attack_speed").getValue()
                    let mainhand = player.getItemInHand("main_hand");

                    let damage = 0;
                    let armor_pierce = 0;

                    if (attackspeed < 1.5 && mainhand.id != "minecraft:air") {
                        damage = 0;
                        armor_pierce = 1.5;
                    }
                    else if (attackspeed > 1.75 && mainhand.id != "minecraft:air") {
                        damage = 3;
                        armor_pierce = 0;
                    }

                    event.modify("generic.attack_damage", "hero_charm", 0.1, "multiply_total");
                    event.modify("attributeslib:armor_pierce", "hero_charm", armor_pierce, "multiply_base");
                    event.modify("generic.attack_damage", "hero_charm", damage, "addition");
                })
                .curioTick((slotContext, stack) => {
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    if (stack.nbt.getBoolean("update") == null) {
                        stack.nbt.putBoolean("update", false)
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"))
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:hero_charm')) {
                        return false;
                    }
                    return true;
                })
            /*                .curioTick((slotContext, stack) => {
                                let entity = slotContext.entity();
                                let attackspeed = entity.getAttribute("generic.attack_speed");
                                let mainhand = entity.getItemInHand("main_hand");
            
                                if (attackspeed < 1.5 && mainhand.id != "minecraft:air") {
                                    entity.modifyAttribute(
                                        "attributeslib:armor_pierce",
                                        "weapon_master_charm_pierce",
                                        1.5,
                                        "multiply_base"
                                    );
                                }
                                else if (attackspeed > 1.75 && mainhand.id != "minecraft:air") {
                                    entity.modifyAttribute(
                                        "generic.attack_damage",
                                        "weapon_master_charm_bonus",
                                        3,
                                        "addition"
                                    );
                                }
                            })
                            .onUnequip((slotContext, stack) => {
                                let entity = slotContext.entity();
                                entity.removeAttribute("attributeslib:armor_pierce", "weapon_master_charm_pierce");
                                entity.removeAttribute("generic.attack_damage", "weapon_master_charm_bonus");
                            })
                            .onEquip((slotContext, stack) => {
                                let entity = slotContext.entity();
                                entity.modifyAttribute(
                                    "generic.attack_damage",
                                    "weapon_master_charm_base",
                                    1.1,
                                    "multiply_total"
                                );
                            })*/
        )
})

//幸运符文
StartupEvents.registry('item', event => {
    event.create('rainbow:lucky_charm')
        .tooltip("获得幸运，时运3")
        .displayName("幸运符文")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyFortuneLevel((slotContext, lootContext, stack) => 3)
                .curioTick((slotContext) => {
                    let player = slotContext.entity();
                    if (player.age % 20) return;
                    player.potionEffects.add("minecraft:luck", 60, 1, false, false)
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:lucky_charm')) {
                        return false;
                    }
                    return true;
                })
        )
})

//血战沙场之证
StartupEvents.registry("item", (event) => {
    event.create('rainbow:berserk_emblem')
        .rarity("epic")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(event => {
                    let player = event.slotContext.entity();

                    if (player == null) return;

                    let playerHP = player.getHealth();
                    let playerMaxHP = player.getMaxHealth();
                    let percentage = 0;
                    let hungry = player.getFoodData().getFoodLevel();

                    if (hasCurios(player, "rainbow:berserk_emblem")) {
                        percentage = ((1 - playerHP / playerMaxHP) * 0.8 + (1 - hungry / 20) * 0.4) + 1;

                    }
                    else {
                        percentage = 1 - playerHP / playerMaxHP + 1;
                    }


                    event.modify("generic.attack_damage", "berserk_emblem", 0.01 * percentage, "multiply_total");
                    event.modify("generic.attack_speed", "berserk_emblem", 0.1 * percentage, "multiply_total");
                    event.modify("generic.movement_speed", "berserk_emblem", 0.05 * percentage, "multiply_total");
                    event.modify("generic.armor_toughness", "berserk_emblem", 0.05 * percentage, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    if (stack.nbt.getBoolean("update") == null) {
                        stack.nbt.putBoolean("update", false)
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"))
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:berserk_emblem')) {
                        return false;
                    }
                    return true;
                })
        )
        .tag("curios:charm")
});

//猎宝者护符
StartupEvents.registry('item', event => {
    event.create('rainbow:mining_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyFortuneLevel((slotContext, lootContext, stack) => 1)
                .modifyAttribute(event => {
                    event.modify("forge:entity_reach", "mining_charm", 2.15, "addition");
                    event.modify("minecraft:generic.luck", "mining_charm", 1, "addition");
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:mining_charm')) {
                        return false;
                    }
                    return true;
                })
        )
})

//怪物猎人勋章
StartupEvents.registry('item', event => {
    event.create('rainbow:monster_charm')
        .displayName("怪物猎人勋章")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    let level = player.level;
                    let pos = player.getBlock().pos;
                    if (player.age % SecoundToTick(10)) return;

                    player.potionEffects.add("absorption", SecoundToTick(5), 1, false, false)
                    player.potionEffects.add("sob:spite", SecoundToTick(5), 1, false, false)
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:monster_charm')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 曙旼始灵
StartupEvents.registry('item', event => {
    event.create('rainbow:daawnlight_spirit_origin')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!player || player.server == null) return;

                    // 每 10 秒执行一次
                    if (player.age % SecoundToTick(10) != 0) return;

                    let mobAABB = player.boundingBox.inflate(10);
                    let level = player.level;

                    level.getEntitiesWithin(mobAABB).forEach(entity => {
                        if (!isEnemy(player, entity)) return;

                        // 给敌对生物施加 rainbow:tag 效果
                        entity.potionEffects.add("rainbow:tag", SecoundToTick(3), 0, false, true);
                    });
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return;

                    // 限制同类饰品只能装备一个
                    if (hasCurios(entity, 'rainbow:daawnlight_spirit_origin')) {
                        return false;
                    }
                    return true;
                })
        );
});


// 极限之证
StartupEvents.registry('item', event => {
    event.create('rainbow:despair_insignia')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    let playerMaxHP = -(player.getMaxHealth() - 1);
                    // 只有最大生命值小于等于 2 时才生效
                    //if (player.getMaxHealth() > 2) return;


                    ev.modify("generic.attack_damage", "despair_insignia", 4.0, "addition");
                    ev.modify("generic.movement_speed", "despair_insignia", 0.05, "multiply_total");
                    ev.modify("generic.attack_speed", "despair_insignia", 0.16, "multiply_total");
                    ev.modify("minecraft:generic.knockback_resistance", "despair_insignia", -0.05, "multiply_total");
                    ev.modify("minecraft:generic.max_health", "despair_insignia", playerMaxHP, "addition");
                })
                .curioTick((slotContext, stack) => {
                    if (!stack.nbt) stack.nbt = {};
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));

                    let player = slotContext.entity();
                    if (player == null) return;
                    //if (player.getMaxHealth() > 2) return;

                    if (player.age % 20 !== 0) return;
                    player.potionEffects.add("runiclib:creative_shock", 60, 9, false, false);
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:despair_insignia')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 装填核心
StartupEvents.registry('item', event => {
    event.create('rainbow:reload_core')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;

                    player.cooldowns.removeCooldown('netherexp:shotgun_fist');
                    player.cooldowns.removeCooldown('netherexp:pump_charge_shotgun');
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:reload_core')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 天琴座
StartupEvents.registry('item', event => {
    event.create('rainbow:lyre')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % 10) return;

                    if (player.cooldowns.isOnCooldown('rainbow:lyre')) {

                    }
                    else {
                        player.cooldowns.removeCooldown('minecraft:goat_horn');
                    }
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:lyre')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 海牙吊坠
StartupEvents.registry('item', event => {
    event.create('rainbow:oceantooth_necklace')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:infernotooth_necklace') || hasCurios(entity, 'rainbow:oceantooth_necklace')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 狱牙吊坠
StartupEvents.registry('item', event => {
    event.create('rainbow:infernotooth_necklace')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:oceantooth_necklace') || hasCurios(entity, 'rainbow:infernotooth_necklace')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 远古之庇护
StartupEvents.registry('item', event => {
    event.create('rainbow:ancientaegis')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 觉之瞳
StartupEvents.registry('item', event => {
    event.create('rainbow:eye_of_satori')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:eye_of_satori')) {
                        return false;
                    }
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!player || player.server == null) return;

                    // 射线检测逻辑（每 10 tick 执行一次）
                    if (player.age % 10 === 0) {
                        let RANGE = 6;
                        if (player.isUsingItem()) {
                            let using = player.getUseItem();
                            if (using && using.id === 'minecraft:spyglass') {
                                RANGE = 16;
                            }
                        }

                        let hit = player.rayTrace(RANGE);
                        if (hit && hit.type === "ENTITY" && hit.entity) {
                            let target = hit.entity;
                            if (isEnemy(player, target)) {
                                target.potionEffects.add("minecraft:glowing", SecoundToTick(3), 0);
                                target.potionEffects.add("rainbow:tag", SecoundToTick(3), 0);
                            }
                        }
                    }

                    // AABB 范围检测逻辑（每 10 秒执行一次）
                    if (player.age % SecoundToTick(10) === 0) {
                        let mobAABB = player.boundingBox.inflate(10); // 半径 10 格
                        let level = player.level;

                        level.getEntitiesWithin(mobAABB).forEach(entity => {
                            if (!entity.isLiving() || !entity.isAlive()) return;
                            if (entity.isPlayer() || entity == player) return;

                            // 非敌对 = 友军
                            if (!isEnemy(player, entity)) {
                                entity.potionEffects.add("rainbow:obey_command", SecoundToTick(20), 0, false, true);
                                entity.potionEffects.add("minecraft:strength", SecoundToTick(20), 0, false, true);
                            }
                        });
                    }
                })
        )
})


// 莉莉丝之拥
StartupEvents.registry('item', event => {
    event.create('rainbow:lilith_hug')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:lilith_hug')) {
                        return false;
                    }
                    return true;
                })
                .canUnequip((slotContext, stack) => {
                    return false;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % 20 !== 0) return;
                    player.potionEffects.add("species:bloodlust", 60, 0, false, false);
                })
        )
})

// 信标球
StartupEvents.registry('item', event => {
    event.create('rainbow:beacon_ball')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:beacon_ball')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 幻象形体
StartupEvents.registry('item', event => {
    event.create('rainbow:phantom_body')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:phantom_body')) {
                        return false;
                    }
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player.age % 20 !== 0) return;

                    if (player.getItemBySlot("head").getNbt().get("id") == "minecraft:bat") {
                        player.potionEffects.add("minecraft:night_vision", 60, 0, false, false)
                    }
                })
        )
})

/*
//血战沙场之证
StartupEvents.registry('item', event => {
    event.create('rainbow:berserk_emblem')
        .displayName("血战沙场之证")
        .tooltip([
            "§6血战沙场之证 §e[史诗]",
            "§a-----------------------------",
            "§b基础效果：",
            "§d+1% 攻击伤害",
            "§d+1% 攻击速度",
            "§d+0.5% 移动速度",
            "§d+0.5% 护甲韧性",
            "§a-----------------------------",
            "§8※ 生命值越低，加成效果越强"
        ].join('\n'))
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    let playerMaxHP = player.getMaxHealth();
                    let playerHP = player.getHealth();
                    let percentage = 1 - playerHP / playerMaxHP;


                    player.modifyAttribute("generic.attack_damage", "berserk_emblem", 1.0 + percentage, "multiply_total")
                    player.modifyAttribute("generic.attack_speed", "berserk_emblem", 1.0 + percentage, "multiply_total")
                    player.modifyAttribute("generic.movement_speed", "berserk_emblem", 1.0 + percentage / 2.0, "multiply_total")
                    player.modifyAttribute("generic.armor_toughness", "berserk_emblem", 1.0 + percentage / 2.0, "multiply_total")
                })
                .onUnequip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    entity.removeAttribute("generic.attack_damage", "berserk_emblem");
                    entity.removeAttribute("generic.attack_speed", "berserk_emblem");
                    entity.removeAttribute("generic.movement_speed", "berserk_emblem");
                    entity.removeAttribute("generic.armor_toughness", "berserk_emblem");
                })
        )
})*/

//自律之符
/*
StartupEvents.registry('item', event => {
    event.create('rainbow:hungry_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(event => {
                    let player = event.slotContext.entity();

                    if (player == null) return;

                    let hungry = player.getFoodData().getFoodLevel();
                    if (hungry <= 2) multiplier = 0;

                    // 基准点 12
                    let diff = Math.abs(hungry - 12);
                    let multiplier = 1 - (diff * 0.1);

                    // 下限保护，避免负数
                    if (multiplier <= 0) multiplier = 0;


                    event.modify("generic.attack_damage", "hungry_charm_damage", 0.1 * multiplier, "multiply_total");
                    event.modify("generic.movement_speed", "hungry_charm_damage", 0.1 * multiplier, "multiply_total");
                    event.modify("generic.armor_toughness", "hungry_charm_damage", 5 * multiplier, "addition");

                })
                .curioTick((slotContext, stack) => {
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    if (stack.nbt.getBoolean("update") == null) {
                        stack.nbt.putBoolean("update", false)
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"))
                })
            .curioTick((slotContext, stack) => {
                let entity = slotContext.entity();
                let hungry = entity.getFoodData().getFoodLevel();
                let multiplier = 0;

                if (hungry >= 12) {
                    multiplier = 1.0;
                } else if (hungry <= 2) {
                    multiplier = 0.0;
                } else {
                    multiplier = (hungry - 2) * 0.1;
                }

                entity.modifyAttribute("generic.attack_damage", "hungry_charm_damage", 0.1 * multiplier, "multiply_total");
                entity.modifyAttribute("generic.movement_speed", "hungry_charm_speed", 0.1 * multiplier, "multiply_total");
                entity.modifyAttribute("generic.armor_toughness", "hungry_charm_toughness", 5 * multiplier, "addition");
            })
            .onUnequip((slotContext, stack) => {
                let entity = slotContext.entity();
                entity.removeAttribute("generic.attack_damage", "hungry_charm_damage");
                entity.removeAttribute("generic.movement_speed", "hungry_charm_speed");
                entity.removeAttribute("generic.armor_toughness", "hungry_charm_toughness");
            })
        )
})*/

// 冒险之证
/*
StartupEvents.registry('item', event => {
    event.create('rainbow:adventure_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;

                    let attack = 2.0;
                    let speed = 0.1;

                    if (hasCurios(player, "rainbow:despair_insignia")) {
                        attack = 0.0;
                        speed = 0.0;
                    }

                    ev.modify("generic.attack_damage", "adventure_charm", attack, "addition");
                    ev.modify("generic.attack_speed", "adventure_charm", speed, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;

                    // 每秒触发一次
                    if (player.age % 20 !== 0) return;

                    // 戴着绝望之证则失效
                    if (hasCurios(player, "rainbow:despair_insignia")) return;

                    player.potionEffects.add("runiclib:creative_shock", 60, 9, false, false);

                    if (!stack.nbt) stack.nbt = {};
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
        )
})*/

//魂石
/*
StartupEvents.registry('item', event => {
    event.create('rainbow:wind')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % SecoundToTick(5)) return;

                    player.potionEffects.add("alexsmobs:soulsteal", SecoundToTick(10), 0, false, false);
                })
        )
})*/

/*
//分析单片眼镜
StartupEvents.registry('item', event => {

    event

        .create('rainbow:lens')

        .maxStackSize(1)

        .tag("curios:head")

        .attachCapability(CuriosCapabilityBuilder.CURIOS.itemStack()
            .modifyAttribute("minecraft:generic.attack_damage", "attack_damage", 0.2, "multiply_total")
        )

        .rarity("epic")

        .displayName("分析单片眼镜")

})

//掉落物分析眼镜
StartupEvents.registry('minecraft:item', event => {

    event

        .create('rainbow:advancement_lens')

        .maxStackSize(1)

        .tag("curios:head")

        .rarity("epic")

        .tooltip("佩戴后杀死生物有特殊掉落物，抢夺三")

        .displayName("掉落物分析眼镜")

        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyFortuneLevel((slotContext, lootContext, stack) => 3)
        )
})*/

/*
//金猪吊坠
StartupEvents.registry('item', event => {
    event.create('rainbow:golden_piggy_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .makesPiglinsNeutral((slotContext, stack) => true)
        )
})*/

StartupEvents.registry('item', event => {
    //化学内爆
    event.create("rainbow:rage_syringe")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
    //肾上腺素
    event.create("rainbow:resilience_syringe")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})


const hearts = ['drowned_heart', 'frozen_heart', 'gritty_heart', 'gunk_heart', 'rotten_heart'];

// 注册僵尸之心系列物品
StartupEvents.registry('item', event => {
    hearts.forEach(heartId => { // 遍历 hearts 数组中的每个 ID
        event.create('rainbow:' + heartId) // 使用拼接后的字符串作为物品 ID
            .rarity("epic")
            .maxStackSize(1)
            .tag("curios:charm");
    });
})

//赛博义体系列
//神经处理器
StartupEvents.registry('item', event => {
    event.create('rainbow:cyber_nerve_cpu')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:back")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:cyber_nerve_cpu')) {
                    return false;
                }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .modifyAttribute(context => {
                let { slotContext, uuid } = context
                let identifier = slotContext.identifier() + slotContext.index()
                context.modify(
                    $SlotAttribute.getOrCreate('charm'),
                    uuid,
                    identifier,
                    -4,
                    'addition'
                )
            })
            .addAttribute("minecraft:generic.max_health","cyber_nerve_cpu",-10,"addition")
            .addAttribute("rainbow:generic.cyberware_capacity","cyber_nerve_cpu",10,"addition")
    )
})

//操作系统-斯安威斯坦
StartupEvents.registry('item', event => {
    event.create('rainbow:sandevistan')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:head")
    .tag("rainbow:cyber_system")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:sandevistan')) {
                    return false;
                }
                //需要神经处理器
                if (hasCurios(entity, 'rainbow:cyber_nerve_cpu')) {
                    return false;
                }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .modifyAttribute(context => {
                let { slotContext, uuid } = context
                let identifier = slotContext.identifier() + slotContext.index()
                context.modify(
                    $SlotAttribute.getOrCreate('ring'),
                    uuid,
                    identifier,
                    4,
                    'addition'
                )
            })
            .addAttribute("minecraft:generic.attack_speed","sandevistan",4,"addition")
    )
})

//义体-皮下护甲-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:subcutaneous_armor')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:ring")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:subcutaneous_armor')) {
                    return false;
                }

                let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                if(cyberware_capacity - 1 <0) return false;

                if(!getCuriosItemBySlot(entity,"head").hasTag("rainbow:cyber_system"))
                    {
                        return false;
                    }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .addAttribute("minecraft:generic.armor","subcutaneous_armor",20,"addition")
            .addAttribute("rainbow:generic.cyberware_capacity","subcutaneous_armor",-1,"addition")
    )
})

//义体-生物监测-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:biological_monitoring')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:ring")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:biological_monitoring')) {
                    return false;
                }

                let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                if(cyberware_capacity - 1 <0) return false;

                if(!getCuriosItemBySlot(entity,"head").hasTag("rainbow:cyber_system"))
                    {
                        return false;
                    }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .curioTick((slotContext, stack) => {
                let player = slotContext.entity();
                if (player == null) return;
                if (player.age % SecoundToTick(20)) return;

                let health = player.getHealth();
                if(health == null) return;

                let healthMax = player.getMaxHealth();
                if(healthMax == null) return;
                if(player.cooldowns.isOnCooldown("rainbow:biological_monitoring")) return;
                if((health / healthMax )<0.25)
                    {
                        player.setHealth(healthMax);
                        player.cooldowns.addCooldown("rainbow:biological_monitoring", SecoundToTick(60));
                    }
                
            })
            .addAttribute("rainbow:generic.cyberware_capacity","biological_monitoring",-1,"addition")
    )
})

//义体-365安全卫士-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:365_exe')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:ring")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:365_exe')) {
                    return false;
                }

                let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                if(cyberware_capacity - 5 <0) return false;

                if(!getCuriosItemBySlot(entity,"head").hasTag("rainbow:cyber_system"))
                    {
                        return false;
                    }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .addAttribute("rainbow:generic.cyberware_capacity","365_exe",-5,"addition")
            .modifyAttribute(ev => {
                let player = ev.slotContext.entity();
                if (player == null) return;

                let cyberware_capacity = player.getAttributeValue("rainbow:generic.cyberware_capacity");

                ev.modify("generic.armor", "365_exe", cyberware_capacity * 2, "addition");
            })
    )
})

//义体-副心脏-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:second_heart')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:ring")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:second_heart')) {
                    return false;
                }

                let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                if(cyberware_capacity - 5 <0) return false;

                if(!getCuriosItemBySlot(entity,"head").hasTag("rainbow:cyber_system"))
                    {
                        return false;
                    }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .addAttribute("rainbow:generic.cyberware_capacity","second_heart",-5,"addition")
            .modifyAttribute(ev => {
                let player = ev.slotContext.entity();
                if (player == null) return;

                let healthMax = player.getMaxHealth();

                ev.modify("generic.max_health", "second_heart", 2 , "multiply_total");
            })
    )
})


//义体-德国骨科-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:german_orthopedics')
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:ring")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create()
            .canEquip((slotContext, stack) => {
                let entity = slotContext.entity();
                if (!entity) return false;

                // 限制同一玩家不能装备多个
                if (hasCurios(entity, 'rainbow:german_orthopedics')) {
                    return false;
                }

                let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                if(cyberware_capacity - 5 <0) return false;

                if(!getCuriosItemBySlot(entity,"head").hasTag("rainbow:cyber_system"))
                    {
                        return false;
                    }
                return true;
            })
            .canUnequip((slotContext, stack) => {
                return false;
            })
            .addAttribute("rainbow:generic.cyberware_capacity","german_orthopedics",-5,"addition")
            .addAttribute("minecraft:generic.armor_toughness","german_orthopedics",+10,"addition")
    )
})

