// priority: 1000

// ==========================================
// 💍 注册饰品与特殊装备 (Curios)
// ==========================================

// 荷鲁斯之爪
StartupEvents.registry('item', event => {
    event.create('rainbow:clawofhorus')
        .tooltip("攻击生物概率恢复冷却")
        .displayName("荷鲁斯之爪")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 闪电瓶
StartupEvents.registry('item', event => {
    event.create('rainbow:lightning')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 心灵宝石
StartupEvents.registry('item', event => {
    event.create('rainbow:mind')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 赌徒骰子
StartupEvents.registry('item', event => {
    event.create('rainbow:dice')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 暴食之符
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
                    //event.modify("l2damagetracker:damage_reduction", "hungry_charm_damage", -1 * multiplier, "addition");
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


// 大胃袋
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

                    player.potionEffects.add("gimmethat:lozenge", SecoundToTick(10), 0, false, false);
                    player.potionEffects.add("gimmethat:appetizing", SecoundToTick(10), 0, false, false);
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

// 武器大师勋章
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
        )
})

// 幸运符文
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

// 血战沙场之证
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

// 猎宝者护符
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

// 怪物猎人勋章
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
                    //player.potionEffects.add("sob:spite", SecoundToTick(5), 1, false, false)
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
                    ev.modify("minecraft:generic.knockback_resistance", "despair_insignia", 0.05, "multiply_total");
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
        .tooltip("§7造成伤害可充能 (100点)")
        .tooltip("§7能量满时右键使用，持续10秒移除霰弹枪冷却")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
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

// 连射核心
StartupEvents.registry('item', event => {
    event.create('rainbow:short_core')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .tooltip("§7造成伤害可充能 (100点)")
        .tooltip("§7能量满时右键使用，持续10秒极大提升手摇弩射速")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:short_core')) {
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
        .maxDamage(300)
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .addAttribute("attributeslib:armor_pierce","oceantooth_necklace",4,"addition")
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
                .addAttribute("attributeslib:armor_pierce","oceantooth_necklace",8,"addition")
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (entity.age % 20 != 0) return;
                    let item = entity.getItemInHand("main_hand");
                    if(item.id != 'species:spectralibur') return;
                    else
                    {
                        if(stack.nbt == null)
                            {
                                stack.nbt = {}
                            }
                        if(stack.nbt.getInt("Souls") > 0)
                            {
                                stack.nbt.putInt("Souls",stack.nbt.getInt("Souls") - 1)
                                item.nbt.putInt("Souls",item.nbt.getInt("Souls") + 1)
                                entity.level.runCommandSilent(`/playsound species:item.spectralibur.collect_soul voice ${entity.getDisplayName().getString()} ${entity.x} ${entity.y} ${entity.z}`)
                            }
                    }

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
                                target.potionEffects.add("minecraft:glowing", SecoundToTick(10), 0);
                                target.potionEffects.add("rainbow:tag", SecoundToTick(10), 0);
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

                    // 智能分兵逻辑 (每 20 tick 执行一次)
                    if (player.age % 20 === 0) {
                        let range = 20;
                        let aabb = player.boundingBox.inflate(range);
                        let level = player.level;

                        // 1. 获取单位
                        let entities = level.getEntitiesWithin(aabb);
                        let minions = [];
                        let taggedEnemies = [];
                        
                        entities.forEach(e => {
                            if (!e.isLiving() || !e.isAlive()) return;
                            if (e.potionEffects.isActive("rainbow:obey_command")) {
                                minions.push(e);
                            } else if (e.potionEffects.isActive("rainbow:tag")) {
                                taggedEnemies.push(e);
                            }
                        });

                        if (taggedEnemies.length > 0 && minions.length > 0) {
                            // 2. 建立仇恨统计表 (UUID字符串 -> 数量)
                            let engageCounts = {};
                            taggedEnemies.forEach(e => engageCounts[e.uuid.toString()] = 0);

                            let availableMinions = [];

                            // 3. 统计现状 & 抽调兵力
                            minions.forEach(minion => {
                                let target = minion.target;
                                // 如果没有目标，或目标不是被标记的敌人 -> 立即征召
                                if (!target || !engageCounts.hasOwnProperty(target.uuid.toString())) {
                                    availableMinions.push(minion);
                                } else {
                                    // 如果正在攻击被标记敌人，先记录
                                    engageCounts[target.uuid.toString()]++;
                                }
                            });

                            // 4. 计算平均负载，从拥挤的战场二次抽调 (核心分兵逻辑)
                            let idealCount = Math.ceil(minions.length / taggedEnemies.length);

                            minions.forEach(minion => {
                                let target = minion.target;
                                if (target && engageCounts.hasOwnProperty(target.uuid.toString())) {
                                    let currentCount = engageCounts[target.uuid.toString()];
                                    if (currentCount > idealCount) {
                                        availableMinions.push(minion);
                                        engageCounts[target.uuid.toString()]--; // 计数修正
                                    }
                                }
                            });

                            // 5. 重新分配给最冷清的敌人
                            if (availableMinions.length > 0) {
                                availableMinions.forEach(minion => {
                                    // 寻找当前被攻击数最少的敌人
                                    taggedEnemies.sort((a, b) => {
                                        return engageCounts[a.uuid.toString()] - engageCounts[b.uuid.toString()];
                                    });
                                    
                                    let bestTarget = taggedEnemies[0];

                                    if (bestTarget) {
                                        minion.setTarget(bestTarget);
                                        engageCounts[bestTarget.uuid.toString()]++;
                                    }
                                });
                            }
                        }
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

// ==========================================
// 🦾 赛博义体系统 (Cyberware)
// ==========================================

// 神经处理器
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
            .addAttribute("minecraft:generic.max_health","cyber_nerve_cpu",-0.5,"multiply_total")
            .addAttribute("rainbow:generic.cyberware_capacity","cyber_nerve_cpu",10,"addition")
    )
})

// 操作系统-斯安威斯坦
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
                // 需要神经处理器
                if (!hasCurios(entity, 'rainbow:cyber_nerve_cpu')) {
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

// 义体-皮下护甲-通用
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

// 义体-生物监测-通用
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

// 义体-365安全卫士-通用
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

// 义体-副心脏-通用
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


// 义体-德国骨科-通用
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
