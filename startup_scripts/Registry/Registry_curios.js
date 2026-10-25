// priority: 1000

// ==========================================
// 💍 注册饰品与特殊装备 (Curios)
// ==========================================

// 已停用：闪电瓶物品注册。
/*
StartupEvents.registry('item', event => {
    event.create('rainbow:bottled_lightning')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})
*/

// ==========================================
// 💎 心灵宝石：越级经验暂存
// ==========================================
// 佩戴时若玩家已超过 100 级：把经验压到正好 100 级（进度归零），超出的经验点数存入饰品 NBT；
// 卸下饰品时把暂存的经验原样返还给玩家。
// 实现要点：直接读写 Player 的 experienceLevel / experienceProgress / totalExperience，
// 不调用 giveExperiencePoints()，否则返还的经验会被 moreattribute:max_experience_level 的
// PlayerXpEvent 上限逻辑裁掉；ServerPlayer 每 tick 检测 totalExperience 变化并向客户端同步经验条。
const SOUL_DIAMOND_MAX_LEVEL = 100;
const SOUL_DIAMOND_STORED_XP = 'SoulDiamondStoredXp';

// 圣遗物：第五次镶嵌觉醒元素；允许同时佩戴多件以激活同元素 4/5 件套。
StartupEvents.registry('item', event => {
    event.create('rainbow:relic')
        .displayName('圣遗物')
        //.texture('rainbow:item/super_mechanism')
        .rarity('epic')
        .maxStackSize(1)
        .tag('curios:charm')
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(attributeEvent => {
                    applyRelicInlayAttributes(attributeEvent);
                })
        )
})

// 升到下一级所需经验，与原版 Player#getXpNeededForNextLevel() 一致
function soulDiamondXpNeededForNextLevel(level) {
    if (level >= 30) return 112 + (level - 30) * 9;
    if (level >= 15) return 37 + (level - 15) * 5;
    return 7 + level * 2;
}

// 从 0 级升到 level 级的累计经验，与 Moreattribute ExperienceLevelAttributeHandler#xpToReachLevel 一致
function soulDiamondXpToReachLevel(level) {
    if (level <= 15) return level * (level + 6);

    if (level <= 30) {
        let levelsAbove15 = level - 15;
        return 315 + Math.floor(5 * (level + 14) * levelsAbove15 / 2) - 38 * levelsAbove15;
    }

    let levelsAbove30 = level - 30;
    return 1395 + Math.floor(9 * (level + 29) * levelsAbove30 / 2) - 158 * levelsAbove30;
}

// 玩家当前总经验点数（等级 + 级内进度，与 Moreattribute 判断上限的口径一致）
function soulDiamondGetTotalXp(player) {
    let level = player.experienceLevel;
    return soulDiamondXpToReachLevel(level) + Math.round(player.experienceProgress * soulDiamondXpNeededForNextLevel(level));
}

// 按总经验点数直接写回等级、级内进度与经验总量（不触发 PlayerXpEvent）
function soulDiamondSetTotalXp(player, totalXp) {
    let remaining = Math.max(0, Math.floor(totalXp));
    let level = 0;
    let needed = soulDiamondXpNeededForNextLevel(0);

    while (remaining >= needed && level < 32767) {
        remaining -= needed;
        level++;
        needed = soulDiamondXpNeededForNextLevel(level);
    }

    player.experienceLevel = level;
    player.experienceProgress = remaining / needed;
    player.totalExperience = Math.min(2147483647, soulDiamondXpToReachLevel(level) + remaining);
}

// KubeJS-Curios 的 onEquip / onUnequip 传参顺序不同，按物品 id 取出心灵宝石本体最稳妥
function soulDiamondPickStack(firstStack, secondStack) {
    if (firstStack != null && firstStack.id == 'rainbow:soul_diamond') return firstStack;
    if (secondStack != null && secondStack.id == 'rainbow:soul_diamond') return secondStack;
    return null;
}

// 佩戴：把超过 100 级的经验搬进饰品 NBT
function soulDiamondOnEquip(slotContext, firstStack, secondStack) {
    try {
        let player = slotContext.entity();
        if (player == null || !player.isPlayer()) return;
        if (player.level.isClientSide()) return;

        let stack = soulDiamondPickStack(firstStack, secondStack);
        if (stack == null) return;

        if (stack.nbt == null) stack.nbt = {};

        let holdXp = soulDiamondXpToReachLevel(SOUL_DIAMOND_MAX_LEVEL);
        let excess = soulDiamondGetTotalXp(player) - holdXp;
        let stored = stack.nbt.getInt(SOUL_DIAMOND_STORED_XP);

        // 取较大值：既存下本次越级经验，也不会因为经验已被清空（例如死亡后重新佩戴）
        // 而抹掉宝石里原本暂存的经验
        if (excess > stored) {
            stored = excess;
            stack.nbt.putInt(SOUL_DIAMOND_STORED_XP, stored);
        }

        if (excess <= 0) return;

        // 回读校验：确认经验确实写进饰品 NBT 之后才压缩玩家等级，
        // 避免写入异常时玩家的越级经验凭空消失
        if (stack.nbt.getInt(SOUL_DIAMOND_STORED_XP) != stored) {
            console.log('[心灵宝石] 暂存经验写入 NBT 失败，已放弃本次等级压缩（经验保留在玩家身上）');
            return;
        }

        soulDiamondSetTotalXp(player, holdXp);
    } catch (err) {
        console.log('[心灵宝石] 佩戴压缩经验失败：' + err);
    }
}

// 卸下：把饰品 NBT 中暂存的经验返还玩家
function soulDiamondOnUnequip(slotContext, firstStack, secondStack) {
    try {
        let player = slotContext.entity();
        if (player == null || !player.isPlayer()) return;
        if (player.level.isClientSide()) return;

        let stack = soulDiamondPickStack(firstStack, secondStack);
        if (stack == null || stack.nbt == null) return;

        let stored = stack.nbt.getInt(SOUL_DIAMOND_STORED_XP);
        if (stored <= 0) return;

        // 先清空暂存再返还，避免重复返还
        stack.nbt.putInt(SOUL_DIAMOND_STORED_XP, 0);
        soulDiamondSetTotalXp(player, soulDiamondGetTotalXp(player) + stored);
    } catch (err) {
        console.log('[心灵宝石] 卸下返还经验失败：' + err);
    }
}

// 心灵宝石
// 已改造为纯被动饰品：原「右键召唤念力墙」主动技能已移除（Skillwheel.js 技能注册、Tag.js 技能饰品标签同步删除）
// 佩戴加成：
//   1. 经验获取 +50%（attributeslib:experience_gained，multiply_total 0.5 → 总倍率 ×1.5）
//   2. 经验等级上限 100 级（moreattribute:max_experience_level）
//      注意：该属性基础值为 -1（-1 = 不限制经验等级），属性修饰器叠加在基础值之上，
//      因此 addition 取 101，最终属性值 = -1 + 101 = 100；卸下饰品后修饰器移除，恢复为无上限。
//   3. 佩戴时超出 100 级的经验暂存到饰品 NBT（SoulDiamondStoredXp），卸下时返还（见上方函数）
StartupEvents.registry('item', event => {
    event.create('rainbow:soul_diamond')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .addAttribute("attributeslib:experience_gained", "soul_diamond_experience", 0.5, "multiply_total")
                .addAttribute("moreattribute:max_experience_level", "soul_diamond_experience_level", 101, "addition")
                // 越级经验的暂存与返还
                .onEquip(soulDiamondOnEquip)
                .onUnequip(soulDiamondOnUnequip)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return false;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:soul_diamond')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 赌徒骰子
StartupEvents.registry('item', event => {
    event.create('rainbow:dice')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 暴食之符
StartupEvents.registry('item', event => {
    event.create('rainbow:gluttony_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(event => {
                    let player = event.slotContext.entity();

                    if (player == null) return;

                    let multiplier = 0;
                    let foodData = player.getFoodData();
                    let hungry = foodData ? foodData.foodLevel : 0;


                    multiplier = 1 - hungry / 20 + 1;

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

// ==========================================
// 🍖 贪咀护符
// 机制1：饥饿换血（下方 curioTick，消耗饥饿恢复生命）
// 机制2：进食任务（server_scripts/big_stomach/PlayerTick.js + ItemEvents.js）
//   每 2 游戏日想吃一种食物，吃到 → 连击+1（无属性加成），未吃 → 连击清零
//   连续完成 10 个任务 → 佩戴中的贪咀护符原地进化为大胃袋
// ==========================================
// 贪咀护符
StartupEvents.registry('item', event => {
    event.create('rainbow:cruncher_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                // ================================
                // ❤️ 核心机制：饥饿换血
                // ================================
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity || !entity.isPlayer()) return;

                    let player = entity;
                    if (!everyTicks(player, 40)) return; // 每 2 秒触发一次

                    // 仅在生命未满且饥饿值超过一半（>10）时触发
                    if (player.getHealth() >= player.getMaxHealth()) return;
                    let foodData = player.getFoodData();
                    if (foodData.foodLevel <= 10) return;

                    // 消耗 2 饥饿，回复 2 生命
                    player.heal(2);
                    foodData.setFoodLevel(foodData.foodLevel - 2);
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


// ==========================================
// 🍖 大胃袋（进化终点饰品，无进食任务机制）
// 三项属性常驻生效；受伤抵消常驻生效（handleBigStomach.js，消耗饱和度抵消伤害）
// 获取途径：贪咀护符连续完成 10 个进食任务后原地进化（server_scripts/big_stomach/）
// ==========================================

// 大胃袋
StartupEvents.registry('item', event => {
    event.create('rainbow:big_stomach')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                // 常驻属性：食用/饮用速度 +50%，饱食度满仍可进食（无任务门槛）
                .modifyAttribute(ev => {
                    ev.modify("moreattribute:eat_speed", "big_stomach", -0.5, "addition");
                    ev.modify("moreattribute:drink_speed", "big_stomach", -0.5, "addition");
                    ev.modify("moreattribute:can_always_eat", "big_stomach", 1, "addition");
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
        .displayName("幸运符文")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                //.modifyFortuneLevel((slotContext, lootContext, stack) => 3)
                /*.curioTick((slotContext) => {
                    let player = slotContext.entity();
                    if (!everyTicks(player, 20)) return;
                    player.potionEffects.add("minecraft:luck", 60, 1, false, false)
                })*/
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:lucky_charm')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute('minecraft:generic.luck', 'mining_charm', 5, 'addition')
        )
})

// 血战沙场之证
StartupEvents.registry("item", (event) => {
    event.create('rainbow:berserk_emblem')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    let health = player.getHealth();
                    let maxHealth = player.getMaxHealth();

                    // 空容器数 = 血量上限 - 当前血量（向下取整，半颗心计为整数容器）
                    let missing = Math.floor(maxHealth - health);
                    if (missing < 0) missing = 0;

                    ev.modify("generic.attack_damage", "berserk_emblem", 0.8 * missing, "addition");
                    ev.modify("generic.armor", "berserk_emblem", 1.5 * missing, "addition");
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:berserk_emblem')) {
                        return false;
                    }
                    return true;
                })
        )
});
// 曙旼始灵
/*StartupEvents.registry('item', event => {
    event.create('rainbow:daawnlight_spirit_origin')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
});*/


// 极限证章：幸运-25、抢夺+1、时运+1、经验获取+400%；护甲、护甲韧性和全属性伤害降低50%。
StartupEvents.registry('item', event => {
    event.create('rainbow:despair_insignia')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .addAttribute("minecraft:generic.luck", "despair_insignia_luck", -25.0, "addition")
                .addAttribute("minecraft:generic.armor", "despair_insignia_armor", -0.5, "multiply_total")
                .addAttribute("minecraft:generic.armor_toughness", "despair_insignia_armor_toughness", -0.5, "multiply_total")
                .addAttribute("attributeslib:experience_gained", "despair_insignia_experience", 4.0, "multiply_total")
                .modifyFortuneLevel((slotContext, lootContext, stack) => 3)
                .modifyLootingLevel((slotContext, source, target, baseLooting, stack) => baseLooting + 3)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();w

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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                /*.curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (!everyTicks(player, 10)) return;

                    if (player.cooldowns.isOnCooldown('rainbow:lyre')) {

                    }
                    else {
                        player.cooldowns.removeCooldown('minecraft:goat_horn');
                    }
                })*/
                .modifyAttribute(ev => {
                    let stack = ev.stack;

                    if (!stack.nbt) {
                        stack.nbt = {the_end:Integer.valueOf("0"),submenu:{1:"鼓舞",2:"战曲",3:"小奏",4:"终曲"}};
                    }
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    let nbt = stack.nbt;
                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:lyre')) {
                        return false;
                    }

                    return true;
                })
        )
})

// 纹饰属性配置已废弃：圣经改为按纹饰盔甲数量提供伤害抵消
// 伤害抵消逻辑在 startup_scripts/ForgeEvents/handleTheBible.js

// ==========================================
// 圣经 - 盔甲纹饰祝福
// ==========================================
// 根据玩家穿戴的纹饰盔甲数量提供伤害抵消（每件 -1，最多 -4，受伤最低为 0）
// 伤害抵消逻辑在 startup_scripts/ForgeEvents/handleTheBible.js
StartupEvents.registry('item', event => {
    event.create('rainbow:the_bible')
        .maxDamage(300)
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .curioTick((slotContext, stack) => {
                    if (!stack.nbt) stack.nbt = {};
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return false;
                    if (hasCurios(entity, 'rainbow:the_bible')) {
                        return false;
                    }
                    return true;
                })
        )
})


// 宝箱吊坠
StartupEvents.registry('item', event => {
    event.create('rainbow:treasure_necklace')
        .maxDamage(300)
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:treasure_necklace')) {
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .addAttribute("attributeslib:armor_pierce", "oceantooth_necklace", 4, "addition")
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:oceantooth_necklace') || hasCurios(entity, 'rainbow:infernotooth_necklace')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("attributeslib:armor_pierce", "oceantooth_necklace", 8, "addition")
        )
})

// 远古之庇护
StartupEvents.registry('item', event => {
    event.create('rainbow:ancientaegis')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canUnequip(canUnequipNotOnCooldown)
                // 未加入 MineTeam 非白色队伍时禁止佩戴；白队伍按默认无队伍处理。
                .canEquip(ancientAegisCanEquip)
                // 右键提示 MineTeam 物品栏队伍入口，禁止 Curios 默认的右键自动装备。
                .canEquipFromUse((slotContext, stack) => false)
        )
})

// 死河
StartupEvents.registry('item', event => {
    event.create('rainbow:dead_river')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return;
                    if (!everyTicks(entity, 20)) return;
                    let item = entity.getItemInHand("main_hand");
                    if (item.id != 'species:spectralibur') return;
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    if (stack.nbt.getInt("Souls") > 0) {
                        stack.nbt.putInt("Souls", stack.nbt.getInt("Souls") - 1);
                        item.nbt.putInt("Souls", item.nbt.getInt("Souls") + 1);
                        entity.level.runCommandSilent("/playsound species:item.spectralibur.collect_soul voice " + entity.getDisplayName().getString() + " " + entity.x + " " + entity.y + " " + entity.z);
                    }
                })
        )
})

// 圣饼
StartupEvents.registry('item', event => {
    event.create('rainbow:the_wafer')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 觉之瞳
StartupEvents.registry('item', event => {
    event.create('rainbow:eye_of_satori')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:eye_of_satori')) {
                        return false;
                    }
                    return true;
                })
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    let stack = ev.stack;

                    if (!stack.nbt) {
                        stack.nbt = {};
                        stack.nbt.putBoolean("is_open", true);
                    }

                    if (stack.nbt.getBoolean("is_open"))
                        return;

                    ev.modify("minecraft:generic.follow_range", "eye_of_satori", -10.0, "addition");
                    ev.modify("forge:nametag_distance", "eye_of_satori", -1.0, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!stack.nbt) {
                        stack.nbt = {};
                        stack.nbt.putBoolean("is_open", true);
                    }

                    // 仅用于触发属性刷新（闭眼时的 hide 属性需要重新计算）
                    if (stack.nbt.getBoolean("is_open")) return;

                    if (!player || player.server == null) return;

                    if (!everyTicks(player, 10)) return;
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
        )
})
/*StartupEvents.registry('item', event => {
    event.create('rainbow:eye_of_satori')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:eye_of_satori')) {
                        return false;
                    }
                    return true;
                })
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    let stack = ev.stack;

                    if (!stack.nbt) {
                        stack.nbt = {};
                        stack.nbt.putBoolean("is_open", true);
                    }

                    if (stack.nbt.getBoolean("is_open"))
                        return;

                    ev.modify("minecraft:generic.follow_range", "eye_of_satori", -10.0, "addition");
                    ev.modify("forge:nametag_distance", "eye_of_satori", -1.0, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    let Nbt = stack.nbt;
                    if (!Nbt) {
                        stack.nbt = {};
                        stack.nbt.putBoolean("is_open", true);
                    }

                    let is_open = Nbt.getBoolean("is_open");

                    if (!is_open) return;

                    if (!player || player.server == null) return;

                    let RANGE = 32

                    // 射线检测逻辑（每 10 tick 执行一次）
                    if (everyTicks(player, 10)) {
                        RANGE = RANGE / 2;
                        if (player.isUsingItem()) {
                            let using = player.getUseItem();
                            if (using && using.id === 'minecraft:spyglass') {
                                RANGE = 32;
                            }
                        }

                        let hit = player.rayTrace(RANGE);
                        if (hit && hit.type === "ENTITY" && hit.entity) {
                            let target = hit.entity;
                            if (isEnemy(player, target)) {
                                target.potionEffects.add("minecraft:glowing", SecoundToTick(10), 0);
                            }
                        }
                    }

                    // AABB 范围检测逻辑（每 10 秒执行一次）
                    if (player.age % SecoundToTick(10) === 0) {
                        let mobAABB = player.boundingBox.inflate(RANGE);
                        let level = player.level;

                        level.getEntitiesWithin(mobAABB).forEach(entity => {
                            if (!entity.isLiving() || !entity.isAlive()) return;
                            if (entity.isPlayer() || entity == player) return;

                            // 非敌对 = 友军
                            if (!isEnemy(player, entity)) {
                                entity.potionEffects.add("rainbow:obey_command", SecoundToTick(20), 0, false, true);
                            }
                        });
                    }

                    // 智能分兵逻辑 (每 20 tick 执行一次)
                    if (everyTicks(player, 20)) {
                        let aabb = player.boundingBox.inflate(RANGE);
                        let level = player.level;

                        // 1. 获取单位
                        let entities = level.getEntitiesWithin(aabb);
                        let minions = [];
                        let taggedEnemies = [];

                        entities.forEach(e => {
                            if (!e.isLiving() || !e.isAlive()) return;
                            if (e.potionEffects.isActive("rainbow:obey_command")) {
                                minions.push(e);
                            } else if (e.potionEffects.isActive("minecraft:glowing")) {
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
})*/


// 莉莉丝之拥
StartupEvents.registry('item', event => {
    event.create('rainbow:lilith_hug')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
                    if (!everyTicks(player, 20)) return;
                    player.potionEffects.add("species:bloodlust", 60, 0, false, false);
                    player.potionEffects.add("caverns_and_chasms:vampirism", 60, 0, false, false);
                })
        )
})

// 幽匿亲和（已停用）
/*
StartupEvents.registry('item', event => {
    event.create('rainbow:sculk_affinity')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:sculk_affinity')) {
                        return false;
                    }
                    return true;
                })
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (!player) return;
                    let add = player.getBlock().id == 'minecraft:sculk_vein' || player.getBlock().getDown().id == 'minecraft:sculk' ? 0.2 : 0.0;
                    ev.modify("minecraft:generic.movement_speed", "sculk_affinity", add, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    if (!stack.nbt) stack.nbt = {};
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                    let player = slotContext.entity();
                    if (player !== null && !player.level.clientSide) {
                        let onSculk = player.getBlock().id == 'minecraft:sculk_vein' || player.getBlock().getDown().id == 'minecraft:sculk';
                        if (onSculk) {
                            let tickCounter = stack.nbt.getInt("healTick") || 0;
                            if (tickCounter >= 20) {
                                player.heal(10);
                                stack.nbt.putInt("healTick", 0);
                            } else {
                                stack.nbt.putInt("healTick", tickCounter + 1);
                            }
                        }
                    }
                })
        )
})*/
/*
// 信标球
StartupEvents.registry('item', event => {
    event.create('rainbow:beacon_ball')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
})*/

// 幻象形体
/*StartupEvents.registry('item', event => {
    event.create('rainbow:phantom_body')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
                    if (!everyTicks(player, 20)) return;

                    if (player.getItemBySlot("head").getNbt().get("id") == "minecraft:bat") {
                        player.potionEffects.add("minecraft:night_vision", 60, 0, false, false)
                    }
                })
        )
})*/


// 注册僵尸之心系列物品（分别注册）

// 溺尸之心
StartupEvents.registry('item', event => {
    event.create('rainbow:drowned_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 冰冻之心
StartupEvents.registry('item', event => {
    event.create('rainbow:frozen_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 坚韧之心
StartupEvents.registry('item', event => {
    event.create('rainbow:gritty_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 黏液之心
StartupEvents.registry('item', event => {
    event.create('rainbow:gunk_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 腐烂之心
// 机制：血量 <= 20 时，每少 1 点血量增加 1 点血量上限；血量 > 20 时失效
StartupEvents.registry('item', event => {
    event.create('rainbow:rotten_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;

                    let health = player.getHealth();
                    // 血量 <= 20 时，每少 1 点血量增加 1 点血量上限；血量 > 20 时加成归零
                    let bonus = (health <= 20) ? (20 - health) : 0;

                    ev.modify("generic.max_health", "rotten_heart", bonus, "addition");
                })
                .curioTick((slotContext, stack) => {
                    // 通过翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
        )
})

// 乌鸦之心
// 机制：空的心之容器越多（空容器数 = 血量上限 - 当前血量，半颗心算 1 个容器），
//       每 1 个空容器提供 +0.8 攻击力、+1.5 护甲，血量越少加成越高
/*StartupEvents.registry('item', event => {
    event.create('rainbow:crow_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    let health = player.getHealth();
                    let maxHealth = player.getMaxHealth();

                    // 空容器数 = 血量上限 - 当前血量（向下取整，半颗心计为整数容器）
                    let missing = Math.floor(maxHealth - health);
                    if (missing < 0) missing = 0;

                    ev.modify("generic.attack_damage", "crow_heart", 0.8 * missing, "addition");
                    ev.modify("generic.armor", "crow_heart", 1.5 * missing, "addition");
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:crow_heart')) {
                        return false;
                    }
                    return true;
                })
        )
})
*/
// ==========================================
// 🦾 赛博义体系统 (Cyberware)
// ==========================================

// 神经处理器
/*StartupEvents.registry('item', event => {
    event.create('rainbow:cyber_nerve_cpu')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:back")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
                        SlotAttribute.getOrCreate('charm'),
                        uuid,
                        identifier,
                        -4,
                        'addition'
                    )
                })
                .addAttribute("minecraft:generic.max_health", "cyber_nerve_cpu", -0.5, "multiply_total")
                .addAttribute("rainbow:generic.cyberware_capacity", "cyber_nerve_cpu", 10, "addition")
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
                        SlotAttribute.getOrCreate('ring'),
                        uuid,
                        identifier,
                        4,
                        'addition'
                    )
                })
                .addAttribute("minecraft:generic.attack_speed", "sandevistan", 4, "addition")
        )
})

// 义体-皮下护甲-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:subcutaneous_armor')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:ring")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:subcutaneous_armor')) {
                        return false;
                    }

                    let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                    if (cyberware_capacity - 1 < 0) return false;

                    if (!getCuriosItemBySlot(entity, "head").hasTag("rainbow:cyber_system")) {
                        return false;
                    }
                    return true;
                })
                .canUnequip((slotContext, stack) => {
                    return false;
                })
                .addAttribute("minecraft:generic.armor", "subcutaneous_armor", 20, "addition")
                .addAttribute("rainbow:generic.cyberware_capacity", "subcutaneous_armor", -1, "addition")
        )
})

// 义体-生物监测-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:biological_monitoring')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:ring")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:biological_monitoring')) {
                        return false;
                    }

                    let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                    if (cyberware_capacity - 1 < 0) return false;

                    if (!getCuriosItemBySlot(entity, "head").hasTag("rainbow:cyber_system")) {
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
                    if (health == null) return;

                    let healthMax = player.getMaxHealth();
                    if (healthMax == null) return;
                    if (player.cooldowns.isOnCooldown("rainbow:biological_monitoring")) return;
                    if ((health / healthMax) < 0.25) {
                        player.setHealth(healthMax);
                        player.cooldowns.addCooldown("rainbow:biological_monitoring", SecoundToTick(60));
                    }

                })
                .addAttribute("rainbow:generic.cyberware_capacity", "biological_monitoring", -1, "addition")
        )
})

// 义体-365安全卫士-通用
StartupEvents.registry('item', event => {
    event.create('rainbow:365_exe')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:ring")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:365_exe')) {
                        return false;
                    }

                    let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                    if (cyberware_capacity - 5 < 0) return false;

                    if (!getCuriosItemBySlot(entity, "head").hasTag("rainbow:cyber_system")) {
                        return false;
                    }
                    return true;
                })
                .canUnequip((slotContext, stack) => {
                    return false;
                })
                .addAttribute("rainbow:generic.cyberware_capacity", "365_exe", -5, "addition")
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:second_heart')) {
                        return false;
                    }

                    let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                    if (cyberware_capacity - 5 < 0) return false;

                    if (!getCuriosItemBySlot(entity, "head").hasTag("rainbow:cyber_system")) {
                        return false;
                    }
                    return true;
                })
                .canUnequip((slotContext, stack) => {
                    return false;
                })
                .addAttribute("rainbow:generic.cyberware_capacity", "second_heart", -5, "addition")
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;

                    let healthMax = player.getMaxHealth();

                    ev.modify("generic.max_health", "second_heart", 2, "multiply_total");
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
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:german_orthopedics')) {
                        return false;
                    }

                    let cyberware_capacity = entity.getAttributeValue("rainbow:generic.cyberware_capacity");
                    if (cyberware_capacity - 5 < 0) return false;

                    if (!getCuriosItemBySlot(entity, "head").hasTag("rainbow:cyber_system")) {
                        return false;
                    }
                    return true;
                })
                .canUnequip((slotContext, stack) => {
                    return false;
                })
                .addAttribute("rainbow:generic.cyberware_capacity", "german_orthopedics", -5, "addition")
                .addAttribute("minecraft:generic.armor_toughness", "german_orthopedics", +10, "addition")
        )
})
*/

// 牧神符文
StartupEvents.registry('item', event => {
    event.create('rainbow:gravity_core')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:gravity_core')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("oreganized:kinetic_damage", "gravity_core", 3, "addition")
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();

                    // 践踏冷却 5s（原版物品冷却）
                    if (player.cooldowns.isOnCooldown('rainbow:gravity_core')) return;

                    if(player.level.isClientSide()) return;
                    if(!player || !player.isPlayer() || !player.isAlive()) return;

                    if(player.persistentData.isGravityCore == null)
                        {
                            player.persistentData.isGravityCore = false;
                        }
                    if(player.isShiftKeyDown() && !player.onGround() && player.persistentData.isGravityCore == false)
                        {
                            player.removeAttribute("forge:entity_gravity","gravity_core")
                            player.modifyAttribute("forge:entity_gravity","gravity_core",+1,"addition");
                            player.persistentData.isGravityCore = true;
                        }

                    if(player.onGround() && player.persistentData.isGravityCore == true)
                        {
                            player.removeAttribute("forge:entity_gravity","gravity_core")
                            player.persistentData.isGravityCore = false;

                            // 践踏音效与粒子
                            player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "minecraft:entity.generic.explode", "players", 2.0, 1.0);
                            player.level.spawnParticles('minecraft:explosion', true, player.getX(), player.getY() + 0.5, player.getZ(), 0.5, 0.5, 0.5, 20, 0.1);

                            let r = 4;
                            let stompBox = new AABB(player.x - r, player.y - 1.1, player.z - r, player.x + r, player.y + 1.1, player.z + r);

                            // 获取玩家动能伤害属性值（来自oreganized）
                            let kineticAttr = player.getAttribute('oreganized:kinetic_damage');
                            let kineticDamage = kineticAttr ? kineticAttr.getValue() : 0;

                            player.level.getEntitiesWithin(stompBox).forEach(entity => {
                                if (!entity) return;
                                if (!entity.isLiving() || !entity.isAlive()) return;
                                if(entity.isPlayer()) return;

                                let DAMAGE = 10 + kineticDamage;

                                entity.attack(player.damageSources().playerAttack(player),DAMAGE);
                                entity.setDeltaMovement(entity.getDeltaMovement().multiply(0.0, 2.0, 0.0)); 
                            })
                            player.cooldowns.addCooldown('rainbow:gravity_core', 100);
                        }
                    
                    
                })
        )
})

// 巨人戒指
StartupEvents.registry('item', event => {
    event.create('rainbow:giants_ring')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:giants_ring')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("moreattribute:size_scale", "giants_ring", 1.5, "multiply_base")
                .addAttribute("forge:step_height_addition", "giants_ring", 1, "addition")
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();

                    if(player.level.isClientSide()) return;
                    if(!player || !player.isPlayer() || !player.isAlive()) return;
                    if (!player.isSprinting() || player.isSwimming()) return;

                    if(!everyTicks(player, 20)) return;

                    let playerBox = player.getBoundingBox();

                    let radius = 1;
                    let stompBox = new AABB(
                        playerBox.minX - radius, player.getY() - 0.1, playerBox.minZ - radius,
                        playerBox.maxX + radius, player.getY() + 0.4, playerBox.maxZ + radius
                    );
                    
                    // 获取玩家动能伤害属性值（来自oreganized）
                    let kineticAttr = player.getAttribute('oreganized:kinetic_damage');
                    let kineticDamage = kineticAttr ? kineticAttr.getValue() : 0;

                    player.level.getEntitiesWithin(stompBox).forEach(entity => {
                        if (!entity) return;
                        if (!entity.isLiving() || !entity.isAlive()) return;
                        if(entity.isPlayer()) return;

                        // 践踏伤害 = 基础10 + 动能伤害 + 佩戴者最大生命10%的额外伤害
                        let ADD = player.getMaxHealth() * 0.1;
                        let DAMAGE = 10 + ADD + kineticDamage;

                        entity.attack(player.damageSources().playerAttack(player),DAMAGE);
                        entity.setDeltaMovement(entity.getDeltaMovement().multiply(0.0, 2.0, 0.0)); 
                    })
                })
        )
})

// 艾摩石
StartupEvents.registry('item', event => {
    event.create('rainbow:moai_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:moai_charm')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("moreattribute:no_collision", "moai_charm", 1, "addition")
                .addAttribute("minecraft:generic.knockback_resistance", "moai_charm", 1, "multiply_total")
        )
})

// 发条怀表 (饰品)
StartupEvents.registry('item', event => {
    event.create("rainbow:chronos")
    .rarity("epic")
    .maxStackSize(1)
    .tag("curios:charm")
    .attachCuriosCapability(
        CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
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
                if (!stack.nbt) {
                    stack.nbt = {};
                }
                if (player.age % SecoundToTick(1)) return;

                let history = [];
                let oldHistory = stack.nbt.history;
                if (oldHistory) {
                    let maxCount = Math.min(oldHistory.length || 0, 4);
                    for (let i = 0; i < maxCount; i++) {
                        let snapshot = oldHistory[i];
                        if (!snapshot) continue;
                        history.push({
                            secondsAgo: i + 2,
                            x: Number(snapshot.x),
                            y: Number(snapshot.y),
                            z: Number(snapshot.z),
                            hp: Number(snapshot.hp),
                            maxHp: Number(snapshot.maxHp),
                            food: Number(snapshot.food),
                            saturation: Number(snapshot.saturation),
                            dimension: String(snapshot.dimension),
                            yaw: Number(snapshot.yaw),
                            pitch: Number(snapshot.pitch)
                        });
                    }
                }

                let currentSnapshot = {
                    secondsAgo: 1,
                    x: player.x,
                    y: player.y,
                    z: player.z,
                    hp: player.getHealth(),
                    maxHp: player.maxHealth,
                    food: player.foodData.foodLevel,
                    saturation: player.foodData.saturationLevel,
                    dimension: player.level.dimension.toString(),
                    yaw: player.yaw,
                    pitch: player.pitch
                };

                history.unshift(currentSnapshot);

                stack.nbt.history = history;
            })
    )
})

// 迷你月球
StartupEvents.registry('item', event => {
    event.create('rainbow:mini_moon')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 雪碧
StartupEvents.registry('item', event => {
    event.create('rainbow:sprite')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:sprite')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!player) return;

                    let tag = stack.getOrCreateTag();
                    let lastX = tag.getDouble("lastX");
                    let lastZ = tag.getDouble("lastZ");

                    let dx = player.x - lastX;
                    let dz = player.z - lastZ;
                    let moving = (dx * dx + dz * dz) > 1.0e-6;

                    tag.putDouble("lastX", player.x);
                    tag.putDouble("lastZ", player.z);
                    tag.putBoolean("Moving", moving);
                })
                .modifyAttribute(ev => {
                    let stack = ev.stack;
                    let moving = stack.getOrCreateTag().getBoolean("Moving");
                    if (moving) {
                        ev.modify("minecraft:generic.knockback_resistance", "sprite", 0.5, "addition");
                        ev.modify("minecraft:generic.armor", "sprite", 10, "addition");
                        ev.modify("minecraft:generic.attack_damage", "sprite", 3, "addition");
                    }
                })
        )
})

// 寻友护符
// 机制：根据服务器在线玩家数量，每人提供5%的 multiply_total 挖掘速度/经验获取/受到治疗加成
// 在线玩家 > 1 时进入激活状态，切换为已激活图标
StartupEvents.registry('item', event => {
    event.create('rainbow:player_doll')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    rebalanceFriendAttributes(ev);
                })
                .curioTick((slotContext, stack) => {
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));

                    let player = slotContext.entity();
                    if (player == null || player.server == null) return;
                    let onlineCount = player.server.players.size();
                    let active = onlineCount > 1;
                    if (stack.nbt.getBoolean("active") !== active) {
                        stack.nbt.putBoolean("active", active);
                    }
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return false;
                    if (hasCurios(entity, 'rainbow:player_doll')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 混沌核心
StartupEvents.registry('item', event => {
    event.create('rainbow:chaos_core')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 七阳之戒
StartupEvents.registry('item', event => {
    event.create('rainbow:dark_sun_ring')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
        )
})

// 日曜石"不移动"判定宽容度（格）：每秒判定时刻与上一秒位置的位移 ≤ 该值即视为不移动
// 用于容忍轻微漂移（被实体推动、水流、载具晃动等）；正常行走约 4.3 格/秒，仍会打断回血
const SHINY_STONE_MOVE_TOLERANCE = 0.5;

// 日曜石
StartupEvents.registry('item', event => {
    event.create('rainbow:shiny_stone')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:shiny_stone')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!player || player.level.isClientSide()) return;

                    // 每秒判定一次（与回血节奏对齐），与上一秒的位置比较
                    if (!everyTicks(player, 20)) return;

                    let tag = stack.getOrCreateTag();
                    let lastX = tag.getDouble("lastX");
                    let lastZ = tag.getDouble("lastZ");

                    let dx = player.x - lastX;
                    let dz = player.z - lastZ;
                    // 一秒内位移不超过宽容度 → 视为不移动（忽略轻微漂移）
                    // 潜行强制视为静止，仍每秒记录真实位置。
                    let moving = !player.isShiftKeyDown() && (dx * dx + dz * dz) > SHINY_STONE_MOVE_TOLERANCE * SHINY_STONE_MOVE_TOLERANCE;

                    tag.putDouble("lastX", player.x);
                    tag.putDouble("lastZ", player.z);
                    tag.putBoolean("Moving", moving);

                    // 不移动时每秒恢复 4 血量
                    if (!moving) {
                        player.heal(4);
                    }
                })
        )
})

// 木人桩
// 功能：静止不动时暴击率 +15%、暴击伤害 +30%。
// 静止判定沿用日曜石：每 20 tick 与上一秒位置比较，一秒内水平位移 ≤ 0.5 格视为静止。
// 属性使用临时修饰符，移动后移除，卸下时由 onUnequip 兜底移除。
const WOODEN_DUMMY_MOVE_TOLERANCE = 0.5;
const WOODEN_DUMMY_CRIT_CHANCE = 0.15;
const WOODEN_DUMMY_CRIT_DAMAGE = 0.30;
const WOODEN_DUMMY_CRIT_CHANCE_UUID = UUID.fromString('8a1f3c2e-5b7d-4e9a-9c4f-2d6b8e0a1c03');
const WOODEN_DUMMY_CRIT_DAMAGE_UUID = UUID.fromString('3c7e9f1b-4a2d-4b8e-8f6a-1e5c7d9b2a04');

function removeWoodenDummyCritBonus(player) {
    try {
        if (player == null) return;
        let chanceAttr = player.getAttribute('attributeslib:crit_chance');
        if (chanceAttr != null) chanceAttr.removeModifier(WOODEN_DUMMY_CRIT_CHANCE_UUID);
        let damageAttr = player.getAttribute('attributeslib:crit_damage');
        if (damageAttr != null) damageAttr.removeModifier(WOODEN_DUMMY_CRIT_DAMAGE_UUID);
    } catch (e) {
        console.log("[木人桩] 移除暴击修饰符失败: " + e);
    }
}

function setWoodenDummyCritBonus(player, active) {
    try {
        if (player == null) return;
        let chanceAttr = player.getAttribute('attributeslib:crit_chance');
        let damageAttr = player.getAttribute('attributeslib:crit_damage');
        if (chanceAttr == null || damageAttr == null) return;

        let existingChance = chanceAttr.getModifier(WOODEN_DUMMY_CRIT_CHANCE_UUID);
        let existingDamage = damageAttr.getModifier(WOODEN_DUMMY_CRIT_DAMAGE_UUID);

        if (active) {
            if (existingChance == null) {
                chanceAttr.addTransientModifier(new AttributeModifier(WOODEN_DUMMY_CRIT_CHANCE_UUID, 'wooden_dummy_crit_chance', WOODEN_DUMMY_CRIT_CHANCE, AttributeModifierOperation.ADDITION));
            }
            if (existingDamage == null) {
                damageAttr.addTransientModifier(new AttributeModifier(WOODEN_DUMMY_CRIT_DAMAGE_UUID, 'wooden_dummy_crit_damage', WOODEN_DUMMY_CRIT_DAMAGE, AttributeModifierOperation.ADDITION));
            }
        } else {
            if (existingChance != null) chanceAttr.removeModifier(WOODEN_DUMMY_CRIT_CHANCE_UUID);
            if (existingDamage != null) damageAttr.removeModifier(WOODEN_DUMMY_CRIT_DAMAGE_UUID);
        }
    } catch (e) {
        console.log("[木人桩] 刷新暴击修饰符失败: " + e);
    }
}

StartupEvents.registry('item', event => {
    event.create('rainbow:wooden_dummy')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:wooden_dummy')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null || player.level.isClientSide()) return;
                    if (!everyTicks(player, 20)) return;

                    let tag = stack.getOrCreateTag();
                    // 首次判定只记录位置，避免默认坐标 0,0 被误判为静止
                    if (!tag.contains("lastX") || !tag.contains("lastZ")) {
                        tag.putDouble("lastX", player.x);
                        tag.putDouble("lastZ", player.z);
                        // 首次装备也立即识别潜行静止。
                        tag.putBoolean("isStill", player.isShiftKeyDown());
                        setWoodenDummyCritBonus(player, player.isShiftKeyDown());
                        return;
                    }

                    let lastX = tag.getDouble("lastX");
                    let lastZ = tag.getDouble("lastZ");
                    let dx = player.x - lastX;
                    let dz = player.z - lastZ;
                    // 一秒内位移不超过宽容度 → 视为静止（忽略轻微漂移）
                    // 潜行时即使移动，也享受静止加成。
                    let still = player.isShiftKeyDown() || (dx * dx + dz * dz) <= WOODEN_DUMMY_MOVE_TOLERANCE * WOODEN_DUMMY_MOVE_TOLERANCE;

                    tag.putDouble("lastX", player.x);
                    tag.putDouble("lastZ", player.z);
                    tag.putBoolean("isStill", still);
                    setWoodenDummyCritBonus(player, still);
                })
                .onUnequip((slotContext, newStack, stack) => {
                    let player = slotContext.entity();
                    if (player == null || player.level.isClientSide()) return;
                    removeWoodenDummyCritBonus(player);
                })
        )
})

// 心之项链
StartupEvents.registry('item', event => {
    event.create('rainbow:necklace_of_heart')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .addAttribute("minecraft:generic.max_health", "necklace_of_heart", 4, "addition")
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:necklace_of_heart')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!player || player.level.isClientSide()) return;

                    if (everyTicks(player, 40)) {
                        player.heal(1);
                    }
                })
        )
})

//鸦羽骨哨
// ==========================================
// 🎺 主动技能增益机制
// 技能开启时（Skillwheel.js）向饰品 NBT 写入 endtick = 当前游戏时间 + 20秒
// curioTick 检测 endtick 是否过期：未过期时 modifyAttribute 为玩家增加伤害+防御
// 过期后自动清理 endtick，属性加成归零
// ==========================================
StartupEvents.registry('item', event => {
    event.create("rainbow:whistle")
            .rarity("epic")
            .maxStackSize(1)
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return false;
                    if (hasCurios(entity, 'rainbow:whistle')) {
                        return false;
                    }
                    return true;
                })
        )
})

//快速箭袋
StartupEvents.registry('item', event => {
    event.create("rainbow:fast_quiver")
            .rarity("epic")
            .maxStackSize(1)
            .tag("curios:charm")
            .tooltip(Text.gold("[箭袋]"))
            .tooltip(Text.gray("右键拉弓时抵消减速，恢复至 §b100% §7正常移速"))
            .tag("rainbow:quivers")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:fast_quiver')) return false;
                    if(hasCuriosTag(entity, "rainbow:quivers")) return false;
                    return true;
                })
                .addAttribute("attributeslib:arrow_damage", "quiver", 0.1, "multiply_total")
                //.addAttribute("attributeslib:arrow_velocity", "quiver", 0.1, "multiply_total")
                .addAttribute("attributeslib:draw_speed", "quiver", 0.1, "multiply_total")
                .addAttribute("moreattribute:charge_speed", "quiver", 0.8, "addition")
                /*.curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.level.isClientSide()) return;

                    if (!stack.nbt) stack.nbt = {};
                    let tag = stack.nbt;

                    // 弓类白名单
                    let bowWhitelist = [
                        "minecraft:bow",
                        "minecraft:crossbow",
                        "species:crankbow"
                    ];

                    // 检测玩家是否在右键使用弓类物品
                    let usingItem = player.getUseItem();
                    let inWhitelist = usingItem != null && !usingItem.isEmpty() && bowWhitelist.indexOf(usingItem.id) !== -1;

                    if (player.isUsingItem() && inWhitelist) {
                        if (!tag.getBoolean("speedBoost")) {
                            tag.putBoolean("speedBoost", true);
                        }
                    } else {
                        if (tag.getBoolean("speedBoost")) {
                            tag.putBoolean("speedBoost", false);
                        }
                    }

                    // 触发属性刷新（使modifyAttribute重新计算）
                    tag.putBoolean("update", !tag.getBoolean("update"));
                })
                .modifyAttribute(ev => {
                    let stack = ev.stack;
                    if (stack == null) return;
                    if (!stack.nbt) return;
                    if (stack.nbt.getBoolean("speedBoost")) {
                        ev.modify("generic.movement_speed", "fast_quiver_speed", 4.0, "multiply_total");
                    }
                })*/
        )
})

//诅咒王冠 — 根据主副手+盔甲栏诅咒附魔数量增加暴击率与暴击伤害
StartupEvents.registry('item', event => {
    event.create("rainbow:curse_crown")
            .rarity("epic")
            .maxStackSize(1)
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:clawofhorus')) return false;
                    return true;
                })
                .modifyAttribute(e => {
                    try {
                        let stack = e.stack;
                        let player = e.slotContext.entity();

                        if (!stack || !player) return;

                        let curseCount = 0;

                        // 统计主手+副手+盔甲栏诅咒附魔数量
                        let equipmentSlots = [
                            player.getItemInHand("main_hand"),
                            player.getItemInHand("off_hand")
                        ];
                        let armorItems = player.getArmorSlots();
                        if (armorItems) {
                            let armorIter = armorItems.iterator();
                            while (armorIter.hasNext()) {
                                equipmentSlots.push(armorIter.next());
                            }
                        }
                        for (let i = 0; i < equipmentSlots.length; i++) {
                            let itemStack = equipmentSlots[i];
                            if (!itemStack.isEmpty()) {
                                let enchMap = EnchantmentHelper.getEnchantments(itemStack);
                                let iter = enchMap.entrySet().iterator();
                                while (iter.hasNext()) {
                                    let enchId = String(ForgeRegistries.ENCHANTMENTS.getKey(iter.next().getKey()));
                                    if (global.CURSES.indexOf(enchId) !== -1) curseCount++;
                                }
                            }
                        }

                        e.modify("attributeslib:crit_chance", "curse_crown_crit_chance", curseCount * 0.04, "multiply_total");
                        e.modify("attributeslib:crit_damage", "curse_crown_crit_damage", curseCount * 0.08, "multiply_total");
                        e.modify("minecraft:generic.luck", "curse_crown_luck", -curseCount, "addition");
                    } catch (err) {
                        console.log(`[curse_crown] Error: ${err}`);
                    }
                })
        );
})

//动力手套
/*StartupEvents.registry('item', event => {
    event.create("rainbow:power_glove")
            .rarity("epic")
            .maxStackSize(1)
            //.tooltip(Text.gold("[手套]"))
            //.tag("rainbow:glove")
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:power_glove')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
                .addAttribute("minecraft:generic.attack_damage", "power_glove", 1, "addition")
                .addAttribute("minecraft:generic.attack_speed", "power_glove", 0.1, "multiply_total")
        )
})
 */

//末影之握
StartupEvents.registry('item', event => {
    event.create("rainbow:ender_glove")
            .rarity("epic")
            .maxStackSize(1)
            //.tooltip(Text.gold("[手套]"))
            .tag("rainbow:glove")
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:ender_glove')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
                // 动态攻击力：攻速 > 2.4 时 +1，否则 +3
                .modifyAttribute(e => {
                    let player = e.slotContext.entity();
                    if (player == null || player === undefined) return;
                    let atkSpeed = player.getAttributeValue("minecraft:generic.attack_speed");
                    e.modify("minecraft:generic.attack_damage", "ender_glove", atkSpeed > 2.4 ? 1 : 3, "addition");
                })
                .curioTick((slotContext, stack) => {
                    // 攻速变化时写入 NBT 触发 Curios 属性重算（参考 eye_of_satori 刷新模式）
                    let player = slotContext.entity();
                    if (!player || player.server == null) return;
                    if (!everyTicks(player, 5)) return;
                    let tag = stack.getOrCreateTag();
                    let atkSpeed = player.getAttributeValue("minecraft:generic.attack_speed");
                    if (Math.abs(tag.getDouble("atk_speed") - atkSpeed) > 1.0e-6) {
                        tag.putDouble("atk_speed", atkSpeed);
                    }
                })
                //.addAttribute("minecraft:generic.attack_speed", "ender_glove", 0.1, "multiply_total")
        )
})

//生灵之触
StartupEvents.registry('item', event => {
    event.create("rainbow:living_gauntlet")
            .rarity("epic")
            .maxStackSize(1)
            //.tooltip(Text.gold("[手套]"))
            .tag("rainbow:glove")
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:living_gauntlet')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
                // 动态攻击力：攻速 > 2 时 +1，否则 +3
                .modifyAttribute(e => {
                    let player = e.slotContext.entity();
                    if (player == null || player === undefined) return;
                    let atkSpeed = player.getAttributeValue("minecraft:generic.attack_speed");
                    e.modify("minecraft:generic.attack_damage", "living_gauntlet", atkSpeed > 2.4 ? 1 : 3, "addition");
                })
                .curioTick((slotContext, stack) => {
                    // 攻速变化时写入 NBT 触发 Curios 属性重算（参考 eye_of_satori 刷新模式）
                    let player = slotContext.entity();
                    if (!player || player.server == null) return;
                    if (!everyTicks(player, 5)) return;
                    let tag = stack.getOrCreateTag();
                    let atkSpeed = player.getAttributeValue("minecraft:generic.attack_speed");
                    if (Math.abs(tag.getDouble("atk_speed") - atkSpeed) > 1.0e-6) {
                        tag.putDouble("atk_speed", atkSpeed);
                    }
                })
                //.addAttribute("minecraft:generic.attack_speed", "living_gauntlet", 0.1, "multiply_total")
        )
})


//点金手套
StartupEvents.registry('item', event => {
    event.create("rainbow:gold_glove")
            .rarity("epic")
            .maxStackSize(1)
            //.tooltip(Text.gold("[手套]"))
            .tag("rainbow:glove")
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:living_gauntlet')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
                // 动态攻击力：攻速 > 2 时 +1，否则 +3
                .modifyAttribute(e => {
                    let player = e.slotContext.entity();
                    if (player == null || player === undefined) return;
                    let atkSpeed = player.getAttributeValue("minecraft:generic.attack_speed");
                    e.modify("minecraft:generic.attack_damage", "gold_glove", atkSpeed > 2.4 ? 1 : 3, "addition");
                })
                .curioTick((slotContext, stack) => {
                    // 攻速变化时写入 NBT 触发 Curios 属性重算（参考 eye_of_satori 刷新模式）
                    let player = slotContext.entity();
                    if (!player || player.server == null) return;
                    if (!everyTicks(player, 5)) return;
                    let tag = stack.getOrCreateTag();
                    let atkSpeed = player.getAttributeValue("minecraft:generic.attack_speed");
                    if (Math.abs(tag.getDouble("atk_speed") - atkSpeed) > 1.0e-6) {
                        tag.putDouble("atk_speed", atkSpeed);
                    }
                })
        )
})


//被诅咒的骨头
StartupEvents.registry('item', event => {
    event.create("rainbow:cursed_bones")
            .rarity("epic")
            .maxStackSize(1)
            .tag("curios:charm")
            .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canUnequip((slotContext, stack) => {
                    return false;
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:living_gauntlet')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
                .addAttribute("minecraft:generic.luck", "cursed_bones", -3, "addition")
        )
})


// 荷鲁斯之爪
StartupEvents.registry('item', event => {
    event.create('rainbow:clawofhorus')
        //.tooltip(Text.gold("[手套]"))
        .tag("rainbow:glove")
        .displayName("荷鲁斯之爪")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:clawofhorus')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
                .modifyAttribute(e => {
                    let player = e.slotContext.entity();
                    if (player === null || player === undefined) return;

                    // 隐匿状态读取纯 KubeJS 维护的 isStealth NBT（缺失 key 默认 true，与 getStealthState 语义一致）
                    let isStealth = global.getStealthState(player) ? 1 : 0;

                    e.modify("attributeslib:crit_chance", "clawofhorus_crit_chance", isStealth, "addition");
                    e.modify("attributeslib:crit_damage", "clawofhorus_crit_damage", 0.5 * isStealth, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    if (!stack.nbt) stack.nbt = {};

                    let player = slotContext.entity();
                    if (!player) return;
                    // 将隐匿状态同步到物品 NBT，随网络同步至客户端供 tooltip 渲染（同样基于 KubeJS 的 isStealth）
                    let isStealth = global.getStealthState(player);
                    stack.getOrCreateTag().putBoolean("isStealth", isStealth);
                })
        );
});

// 末地空气
StartupEvents.registry('item', event => {
    event.create('rainbow:ender_air')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(e => {
                    let stack = e.stack;
                    let player = e.slotContext.entity();
                    if (stack === null || stack === undefined) return;
                    if (player === null || player === undefined) return;

                    // isStealth 读取纯 KubeJS 维护的 isStealth NBT（缺失 key 默认 true，与 getStealthState 语义一致）
                    let isStealth = global.getStealthState(player) ? 1 : 0;
                    // 护甲数量由 curioTick 每 tick 同步
                    let armorCount = stack.getOrCreateTag().getInt("armorCount");
                    let count = 4 - armorCount; 

                    // 隐匿时根据护甲数量提供伤害加成
                    e.modify("generic.attack_damage", "ender_air_armor_damage", 0.04 * count * isStealth, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    if (!stack.nbt) stack.nbt = {};

                    let player = slotContext.entity();
                    if (!player) return;

                    // 同步隐匿状态（同样基于 KubeJS 的 isStealth，缺失 key 默认 true）
                    let isStealth = global.getStealthState(player);
                    stack.getOrCreateTag().putBoolean("isStealth", isStealth);

                    // 统计穿戴的护甲数量
                    let armorCount = 0;
                    let armorSlots = player.getInventory().armor;
                    for (let i = 0; i < armorSlots.size(); i++) {
                        if (!armorSlots.get(i).isEmpty()) armorCount++;
                    }
                    stack.getOrCreateTag().putInt("armorCount", armorCount);
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:ender_air')) {
                        return false;
                    }
                    return true;
                })
        )
})


// 神射手
StartupEvents.registry('item', event => {
    event.create('rainbow:sharpshooter_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:sharpshooter_charm')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 天枰座
StartupEvents.registry('item', event => {
    event.create('rainbow:libra')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:libra')) {
                        return false;
                    }
                    return true;
                })
        )
})

// 云靴
StartupEvents.registry('item', event => {
    event.create('rainbow:cloud_boots')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:cloud_boots')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("minecraft:generic.movement_speed", "cloud_boots", 0.2, "multiply_total")
                .addAttribute("combatroll:air_roll", "cloud_boots", 1, "addition")
                .addAttribute("forge:step_height_addition", "cloud_boots", 0.6, "addition")
        )
})

// 吐根酊
StartupEvents.registry('item', event => {
    event.create('rainbow:lpecac')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    if (hasCurios(entity, 'rainbow:lpecac')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("rainbow:generic.boom_damage", "lpecac", 5, "addition")
        )
})

// 图鉴百科
// 机制：同时拥有植物/动物/怪物/BOSS 四篇图鉴的全部加成
//       加成 = 对应分类收集百分比 × 系数（读取 server_scripts/fieldguide_reader.js 导出的 global.FieldGuideReader）
// 佩戴限制：与四篇图鉴饰品互斥（不能与其他篇同时佩戴）
StartupEvents.registry('item', event => {
    event.create('rainbow:the_field_guide')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .texture("fieldguide:item/field_guide")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    try {
                        // 植物篇：0.5 × 植物收集百分比 → overheal
                        let plantStats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:plants');
                        if (plantStats != null) {
                            ev.modify("attributeslib:overheal", "field_guide_plant", 0.5 * plantStats.percentage, "multiply_total");
                        }

                        // 动物篇：动物篇解锁百分比 → pet_damage
                        let animalStats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:animals');
                        if (animalStats != null) {
                            ev.modify("rainbow:generic.pet_damage", "field_guide_animal", 20 * animalStats.percentage, "addition");
                        }

                        // 怪物篇：10 × 怪物篇百分比 → current_hp_damage
                        let monsterStats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:monsters');
                        if (monsterStats != null) {
                            ev.modify("attributeslib:current_hp_damage", "field_guide_monster", 0.1 * monsterStats.percentage, "multiply_total");
                        }

                        // BOSS篇：80 × BOSS篇百分比 → dodge_chance
                        let bossStats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:bosses');
                        if (bossStats != null) {
                            ev.modify("attributeslib:dodge_chance", "field_guide_boss", 0.8 * bossStats.percentage, "multiply_total");
                        }
                    } catch (e) {
                        console.error("[the_field_guide] 读取图鉴进度失败: " + e);
                    }
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:the_field_guide')) {
                        return false;
                    }

                    // 百科与四篇图鉴互斥
                    if (hasCurios(entity, 'rainbow:field_guide_plant')) return false;
                    if (hasCurios(entity, 'rainbow:field_guide_animal')) return false;
                    if (hasCurios(entity, 'rainbow:field_guide_monster')) return false;
                    if (hasCurios(entity, 'rainbow:field_guide_boss')) return false;

                    return true;
                })
        )
})

// 图鉴-植物篇
// 机制：0.5 × 植物收集百分比 → attributeslib:overheal
// 佩戴限制：与百科互斥，与动物/怪物/BOSS篇不互斥
// 图标：对 field_guide 贴图整体染绿色，与其它篇区分
StartupEvents.registry('item', event => {
    event.create('rainbow:field_guide_plant')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        //.texture("fieldguide:item/field_guide")
        //.color(0x3FA94F)
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    try {
                        // 读取植物分类收集进度（fieldguide_reader.js 导出函数）
                        let stats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:plants');
                        if (stats == null) return;

                        let percentage = stats.percentage;
                        if (percentage == null) percentage = 0;

                        // 属性加成算法：0.5 × 植物收集百分比
                        let bonus = 0.5 * percentage;
                        ev.modify("attributeslib:overheal", "field_guide_plant", bonus, "multiply_total");
                    } catch (e) {
                        console.error("[field_guide_plant] 读取植物图鉴进度失败: " + e);
                    }
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:field_guide_plant')) {
                        return false;
                    }

                    // 植物篇与百科互斥
                    if (hasCurios(entity, 'rainbow:the_field_guide')) return false;

                    return true;
                })
        )
})

// 图鉴-动物篇
// 机制：动物篇解锁百分比 → rainbow:generic.pet_damage
// 佩戴限制：与百科互斥，与植物/怪物/BOSS篇不互斥
// 图标：对 field_guide 贴图整体染橙色，与其它篇区分
StartupEvents.registry('item', event => {
    event.create('rainbow:field_guide_animal')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        //.texture("fieldguide:item/field_guide")
        //.color(0xE08A2A)
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    try {
                        // 读取动物分类收集进度（fieldguide_reader.js 导出函数）
                        let stats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:animals');
                        if (stats == null) return;

                        let percentage = stats.percentage;
                        if (percentage == null) percentage = 0;

                        // 属性加成算法：动物篇解锁百分比
                        ev.modify("rainbow:generic.pet_damage", "field_guide_animal", 20 *percentage, "addition");
                    } catch (e) {
                        console.error("[field_guide_animal] 读取动物图鉴进度失败: " + e);
                    }
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:field_guide_animal')) {
                        return false;
                    }

                    // 动物篇与百科互斥
                    if (hasCurios(entity, 'rainbow:the_field_guide')) return false;

                    return true;
                })
        )
})

// 图鉴-怪物篇
// 机制：10 × 怪物篇百分比 → attributeslib:current_hp_damage
// 佩戴限制：与百科互斥，与植物/动物/BOSS篇不互斥
// 图标：对 field_guide 贴图整体染红色，与其它篇区分
StartupEvents.registry('item', event => {
    event.create('rainbow:field_guide_monster')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        //.texture("fieldguide:item/field_guide")
        //.color(0xC03333)
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    try {
                        // 读取怪物分类收集进度（fieldguide_reader.js 导出函数）
                        let stats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:monsters');
                        if (stats == null) return;

                        let percentage = stats.percentage;
                        if (percentage == null) percentage = 0;

                        // 属性加成算法：0.1 × 怪物篇百分比
                        let bonus = 0.1 * percentage;
                        ev.modify("attributeslib:current_hp_damage", "field_guide_monster", bonus, "multiply_total");
                    } catch (e) {
                        console.error("[field_guide_monster] 读取怪物图鉴进度失败: " + e);
                    }
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:field_guide_monster')) {
                        return false;
                    }

                    // 怪物篇与百科互斥
                    if (hasCurios(entity, 'rainbow:the_field_guide')) return false;

                    return true;
                })
        )
})

// 图鉴-BOSS篇
// 机制：80 × BOSS篇百分比 → attributeslib:dodge_chance
// 佩戴限制：与百科互斥，与植物/动物/怪物篇不互斥
// 图标：对 field_guide 贴图整体染紫色，与其它篇区分
StartupEvents.registry('item', event => {
    event.create('rainbow:field_guide_boss')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        //.texture("fieldguide:item/field_guide")
        //.color(0xA84FD0)
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;
                    if (!player.isPlayer()) return;

                    try {
                        // 读取 BOSS 分类收集进度（fieldguide_reader.js 导出函数）
                        let stats = global.FieldGuideReader.getCategoryCompletionStats(player, 'fieldguide:bosses');
                        if (stats == null) return;

                        let percentage = stats.percentage;
                        if (percentage == null) percentage = 0;

                        // 属性加成算法：80 × BOSS篇百分比
                        let bonus = 0.8 * percentage;
                        ev.modify("attributeslib:dodge_chance", "field_guide_boss", bonus, "multiply_total");
                    } catch (e) {
                        console.error("[field_guide_boss] 读取BOSS图鉴进度失败: " + e);
                    }
                })
                .curioTick((slotContext, stack) => {
                    // 翻转 update 通知 CuriosJS 重新计算属性（配合 modifyAttribute 实时刷新）
                    if (stack.nbt == null) {
                        stack.nbt = {};
                    }
                    stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();

                    if (entity == null) return;

                    // 禁止重复佩戴
                    if (hasCurios(entity, 'rainbow:field_guide_boss')) {
                        return false;
                    }

                    // BOSS篇与百科互斥
                    if (hasCurios(entity, 'rainbow:the_field_guide')) return false;

                    return true;
                })
        )
})

// 流浪软糖包
// 机制：攻击时概率触发随机软糖的食用效果（来自 collectorsreap:gummies 标签）
//       一次触发只触发一种软糖效果，2s 冷却
//       幸运值8时概率最大（25%），线性缩放
StartupEvents.registry('item', event => {
    event.create('rainbow:wandering_gummy_pack')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:wandering_gummy_pack')) return false;
                    return true;
                })
        )
})

// 兽性面具
// 机制：1) 击杀敌人治疗自己 2) 每次受伤增加1层闪避药水，最高10层并重置10秒持续时间 3) 极限闪避回血保留
StartupEvents.registry('item', event => {
    event.create('rainbow:beast_mask')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:beast_mask')) return false;
                    return true;
                })
        )
})

// 采血袋
// 机制：触发背刺时，恢复背刺伤害50%的血量（背刺判定复用 handleBackstabDamage.js）
StartupEvents.registry('item', event => {
    event.create('rainbow:blood_collection_bag')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:blood_collection_bag')) return false;
                    return true;
                })
        )
})

//超级激素
StartupEvents.registry('item', event => {
    event.create('rainbow:super_hormone')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:super_hormone')) return false;
                    return true;
                })
        )
})

//多心经
StartupEvents.registry('item', event => {
    event.create('rainbow:the_heart_sutra')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .addAttribute('moreattribute:cooldown_reduction', 'the_heart_sutra', 0.1, 'multiply_total')
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:the_heart_sutra')) return false;
                    return true;
                })
        )
})

// 狂怒面具
// 机制：玩家累计受到10点伤害后进入狂怒状态，持续11秒且触发后冷却5秒；攻击回血，非跳劈暴击额外回血。
StartupEvents.registry('item', event => {
    event.create('rainbow:fury_mask')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .tooltip("§7累计受到10点伤害后进入狂怒状态")
        .tooltip("§7狂怒持续11秒，触发冷却5秒")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:fury_mask')) return false;
                    return true;
                })
        )
})

// 葵花宝典：受到治疗-100%；佩戴时每次翻滚后免疫下一次伤害。
StartupEvents.registry('item', event => {
    event.create('rainbow:fist_of_seven_wounds')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                //.addAttribute('attributeslib:current_hp_damage', 'fist_of_seven_wounds', 0.07, 'addition')
                .addAttribute('attributeslib:healing_received', 'fist_of_seven_wounds', -1.0, 'multiply_total')
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:fist_of_seven_wounds')) return false;
                    return true;
                })
        )
})

//血轮珠
StartupEvents.registry('item', event => {
    event.create('rainbow:sharingan')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:sharingan')) return false;
                    return true;
                })
        )
})

//强盗围巾
StartupEvents.registry('item', event => {
    event.create('rainbow:dismas_scarf')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:dismas_scarf')) return false;
                    return true;
                })
                .addAttribute('combatroll:count', 'dismas_scarf', 2, 'addition')
                .addAttribute('combatroll:recharge', 'dismas_scarf', 0.25, 'multiply_total')
        )
})

//亵渎十字架
// 功能：佩戴者造成伤害后额外造成一次 1 点真实伤害（独立伤害实例，自定义伤害类型 rainbow:unholy_cross，无视护甲/抗性/保护附魔）
// 伤害逻辑位于 startup_scripts/ForgeEvents/handleUnholyCross.js，由 ForgeEvents/main.js 的 LivingDamageEvent 主入口调用
StartupEvents.registry('item', event => {
    event.create('rainbow:unholy_cross')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:unholy_cross')) return false;
                    return true;
                })
        )
})

// 恶魔羊皮纸
// 功能：沿用原魔法戒指素材；佩戴时暴击率 +20%（attributeslib:crit_chance 为百分比属性，0.20 = 20%）
StartupEvents.registry('item', event => {
    event.create('rainbow:demon_parchment')
        .texture('rainbow:item/magic_ring')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .addAttribute('attributeslib:crit_chance', 'magic_ring_crit_chance', 0.20, 'addition')
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:demon_parchment')) return false;
                    return true;
                })
        )
})

//撒旦圣歌
// 功能：每 2% 暴击率增加 1% 暴击效果（连续比例：暴击效果加成 = 暴击率 × 0.5）
// 暴击率会随装备/药水效果实时变化，因此 curioTick 每 tick 按当前暴击率刷新暴击伤害临时修饰符；
// 临时修饰符不写入玩家存档，卸下时由 onUnequip 立即移除。
const SATAN_HYMN_CRIT_DAMAGE_UUID = UUID.fromString('4b7d1e2a-6c3f-4a9b-8d5e-2f1a3c7b9d10');
const SATAN_HYMN_CRIT_DAMAGE_NAME = 'satan_hymn_crit_damage';

function removeSatanHymnCritDamage(player) {
    try {
        if (player == null) return;
        let damageAttr = player.getAttribute('attributeslib:crit_damage');
        if (damageAttr == null) return;
        damageAttr.removeModifier(SATAN_HYMN_CRIT_DAMAGE_UUID);
    } catch (e) {
        console.log("[撒旦圣歌] 移除暴击效果修饰符失败: " + e);
    }
}

function updateSatanHymnCritDamage(player) {
    try {
        if (player == null) return;
        let damageAttr = player.getAttribute('attributeslib:crit_damage');
        if (damageAttr == null) return;

        let chanceAttr = player.getAttribute('attributeslib:crit_chance');
        let chance = chanceAttr == null ? 0 : chanceAttr.getValue();
        if (!(chance > 0)) chance = 0;
        if (chance > 1) chance = 1;

        // 0.02 暴击率（2%）→ 0.01 暴击效果（1%），即暴击率 ÷ 2；保留 4 位小数避免浮点抖动反复写入
        let bonus = Math.round(chance * 0.5 * 10000) / 10000;
        let existing = damageAttr.getModifier(SATAN_HYMN_CRIT_DAMAGE_UUID);
        if (existing != null && Math.abs(existing.getAmount() - bonus) < 0.0001) return;

        damageAttr.removeModifier(SATAN_HYMN_CRIT_DAMAGE_UUID);
        if (bonus > 0) {
            damageAttr.addTransientModifier(new AttributeModifier(SATAN_HYMN_CRIT_DAMAGE_UUID, SATAN_HYMN_CRIT_DAMAGE_NAME, bonus, AttributeModifierOperation.ADDITION));
        }
    } catch (e) {
        console.log("[撒旦圣歌] 刷新暴击效果修饰符失败: " + e);
    }
}

StartupEvents.registry('item', event => {
    event.create('rainbow:satan_hymn')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:satan_hymn')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null || player.level.isClientSide()) return;
                    updateSatanHymnCritDamage(player);
                })
                .onUnequip((slotContext, newStack, stack) => {
                    let player = slotContext.entity();
                    if (player == null || player.level.isClientSide()) return;
                    removeSatanHymnCritDamage(player);
                })
        )
})

//护额
// 功能：每 1% 移速加成增加 5% 被动闪避；玩家初始移速 0.1 = 100%，低于 100% 时同比例减少闪避
// 例：移速 120% → 闪避 +100%；移速 90% → 闪避 -50%
// 移速会随装备/药水效果实时变化，因此 curioTick 每 tick 刷新 attributeslib:dodge_chance 临时修饰符；
// 临时修饰符不写入玩家存档，卸下时由 onUnequip 立即移除。
const FOREHEAD_GUARD_DODGE_UUID = UUID.fromString('5e9c1b7a-2d4f-4a8b-b3c6-7f0d9e1a2b4c');
const FOREHEAD_GUARD_DODGE_NAME = 'forehead_guard_dodge';
const PLAYER_BASE_MOVEMENT_SPEED = 0.1;

function removeForeheadGuardDodge(player) {
    try {
        if (player == null) return;
        let dodgeAttr = player.getAttribute('attributeslib:dodge_chance');
        if (dodgeAttr == null) return;
        dodgeAttr.removeModifier(FOREHEAD_GUARD_DODGE_UUID);
    } catch (e) {
        console.log("[护额] 移除闪避修饰符失败: " + e);
    }
}

function updateForeheadGuardDodge(player) {
    try {
        if (player == null) return;
        let dodgeAttr = player.getAttribute('attributeslib:dodge_chance');
        if (dodgeAttr == null) return;
        let speedAttr = player.getAttribute('minecraft:generic.movement_speed');
        if (speedAttr == null) return;

        let baseSpeed = speedAttr.getBaseValue();
        if (!(baseSpeed > 0)) baseSpeed = PLAYER_BASE_MOVEMENT_SPEED;
        // 当前移速比例：1.0 = 100%
        let speedRatio = speedAttr.getValue() / baseSpeed;
        // 每 1% 移速（0.01 比例）对应 5% 闪避（0.05），即 (移速比例 - 1) × 5；保留 4 位小数避免浮点抖动反复写入
        let bonus = Math.round((speedRatio - 1) * 5 * 10000) / 10000;
        let existing = dodgeAttr.getModifier(FOREHEAD_GUARD_DODGE_UUID);
        if (existing != null && Math.abs(existing.getAmount() - bonus) < 0.0001) return;

        dodgeAttr.removeModifier(FOREHEAD_GUARD_DODGE_UUID);
        if (bonus != 0) {
            dodgeAttr.addTransientModifier(new AttributeModifier(FOREHEAD_GUARD_DODGE_UUID, FOREHEAD_GUARD_DODGE_NAME, bonus, AttributeModifierOperation.ADDITION));
        }
    } catch (e) {
        console.log("[护额] 刷新闪避修饰符失败: " + e);
    }
}

StartupEvents.registry('item', event => {
    event.create('rainbow:forehead_guard')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:forehead_guard')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null || player.level.isClientSide()) return;
                    updateForeheadGuardDodge(player);
                })
                .onUnequip((slotContext, newStack, stack) => {
                    let player = slotContext.entity();
                    if (player == null || player.level.isClientSide()) return;
                    removeForeheadGuardDodge(player);
                })
        )
})

//忍具袋
StartupEvents.registry('item', event => {
    event.create('rainbow:ninja_tools')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:ninja_tools')) return false;
                    return true;
                })
                .addAttribute('rainbow:generic.thrown_damage', 'ninja_tools', 2, 'addition')
        )
})

//要你命3000
StartupEvents.registry('item', event => {
    event.create('rainbow:the_3000_ways_to_kill')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:the_3000_ways_to_kill')) return false;
                    return true;
                })
                .addAttribute('rainbow:generic.boom_damage', 'the_3000_ways_to_kill', 2, 'addition')
        )
})

//肩甲：翻滚/高速移动期间每 tick 用 AABB 检测；骑马时降低速度门槛并扩大碰撞范围，对撞到的敌对活体造成伤害 + 击退
StartupEvents.registry('item', event => {
    event.create('rainbow:pauldron')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:pauldron')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;

                    let level = entity.level;
                    if (level == null) return;
                    if (level.isClientSide()) return; // 服务端才结算

                    //—— 骑马判定：仅 AbstractHorse（马、驴、骡及其变种）启用骑马强化 ——
                    let vehicle = null;
                    let ridingHorse = false;
                    try {
                        vehicle = entity.getVehicle();
                        ridingHorse = vehicle != null && vehicle instanceof AbstractHorse;
                    } catch (e) {
                        console.log('[pauldron][读取坐骑失败] ' + e);
                    }

                    //—— 触发判定：用相邻 tick 的位移距离代表速度；骑马时速度门槛降至0.3 ——
                    let SPEED_THRESHOLD = ridingHorse ? 0.3 : 1.0;
                    let pd = entity.getPersistentData();
                    let hasPrev = pd.contains('pauldron_px');
                    let x0 = pd.getDouble('pauldron_px');
                    let z0 = pd.getDouble('pauldron_pz');
                    let x1 = entity.getX();
                    let z1 = entity.getZ();
                    pd.putDouble('pauldron_px', x1);
                    pd.putDouble('pauldron_pz', z1);
                    if (!hasPrev) return;

                    let dx = x1 - x0;
                    let dz = z1 - z0;
                    let move = Math.sqrt(dx * dx + dz * dz);
                    //console.log(move);
                    if (move < SPEED_THRESHOLD) return;

                    // 骑马时扩大水平/垂直碰撞范围；普通翻滚保持原范围。
                    let COLLISION_RADIUS = ridingHorse ? 2.0 : 1.0;
                    let COLLISION_HEIGHT = ridingHorse ? 0.75 : 0.5;
                    let box = entity.getBoundingBox().inflate(COLLISION_RADIUS, COLLISION_HEIGHT, COLLISION_RADIUS);
                    let targets = level.getEntitiesWithin(box);
                    //console.log('[pauldron][高速] move=' + move.toFixed(3) + ' 目标数=' + targets.length);

                    let idx, target;
                    for (idx = 0; idx < targets.length; idx++) {
                        target = targets[idx];
                        if (target == null) continue;
                        if (target.getId() === entity.getId()) continue; // 排除穿戴者自身
                        if (target instanceof Player) continue; // 排除所有玩家
                        if (target instanceof AbstractHorse) continue; // 排除所有马匹及马类坐骑
                        if (vehicle != null && target.getId() === vehicle.getId()) continue; // 排除当前坐骑
                        if (!target.isAlive()) continue;

                        // 跳过玩家、坐骑及其相关友军，避免误伤队友/宠物/驯服关系实体。
                        let allied = false;
                        try {
                            if (target.isAlliedTo != null && target.isAlliedTo(entity)) allied = true;
                            if (!allied && vehicle != null && target.isAlliedTo != null && target.isAlliedTo(vehicle)) allied = true;
                        } catch (e) {
                            console.log('[pauldron][判断友军失败] ' + e);
                        }
                        if (allied) continue;

                        //console.log('[pauldron][命中] 目标=' + target + ' 类型=' + (typeof target.getType === "function" ? target.getType() : 'n/a'));

                        // 造成伤害（来源记为穿戴者玩家）
                        try { 

                            // 获取玩家动能伤害属性值（来自oreganized）
                            let kineticAttr = entity.getAttribute('oreganized:kinetic_damage');
                            let kineticDamage = kineticAttr ? kineticAttr.getValue() : 0;

                            let BASE_DAMAGE = ridingHorse ? 8 : 2;
                            target.attack(entity.damageSources().playerAttack(entity), BASE_DAMAGE + kineticDamage);
                            //console.log('[pauldron][造成伤害] 成功'); 
                        } catch (e) { console.log('[pauldron][造成伤害失败] ' + e); }

                        // 击退：推离穿戴者
                        try {
                            let dirX = target.getX() - x1;
                            let dirZ = target.getZ() - z1;
                            target.knockback(1.5, dirX, dirZ);
                            //console.log('[pauldron][击退] 成功');
                        } catch (e) { console.log('[pauldron][击退失败] ' + e); }
                    }
                })
        )
})

//扣挠之手
StartupEvents.registry('item', event => {
    event.create('rainbow:hand_of_scratches')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:hand_of_scratches')) return false;
                    return true;
                })
        )
})

//通灵卷轴
StartupEvents.registry('item', event => {
    event.create('rainbow:kuchiyosenojutsu')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:kuchiyosenojutsu')) return false;
                    return true;
                })
        )
})

//烛心套餐
StartupEvents.registry('item', event => {
    event.create('rainbow:wicked_package')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:wicked_package')) return false;
                    return true;
                })
        )
})

// 奥数法典：Curios charm 主动技能饰品，由 Skillwheel.js 调用射线变猪技能。
StartupEvents.registry('item', event => {
    event.create('rainbow:arcane_codex')
        .displayName('奥数法典')
        //.texture('minecraft:item/enchanted_book')
        .rarity('epic')
        .maxStackSize(1)
        .tag('curios:charm')
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    try {
                        let entity = slotContext.entity();
                        if (entity == null) return false;
                        return !hasCurios(entity, 'rainbow:arcane_codex');
                    } catch (e) {
                        console.log('[奥数法典] 检查佩戴条件失败: ' + e);
                        return false;
                    }
                })
        )
})

//古圣头骨
// 功能：佩戴者受到的最终伤害转为债务（NBT AncientSkullDebt），每 0.5 秒以真实伤害
// 结算剩余债务的 20%；债务未清零时无法主动卸下，强制卸下立即结算全部债务。
// 伤害转化与持续伤害逻辑位于 startup_scripts/ForgeEvents/handleAncientSkull.js，
// 由 startup_scripts/ForgeEvents/main.js 的 LivingDamageEvent 末尾调用。
StartupEvents.registry('item', event => {
    event.create('rainbow:ancient_skull')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canUnequip((slotContext, stack) => ancientSkullCanUnequip(slotContext, stack))
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (hasCurios(entity, 'rainbow:ancient_skull')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    ancientSkullCurioTick(slotContext, stack);
                })
                .onUnequip((slotContext, firstStack, secondStack) => {
                    try {
                        let player = slotContext.entity();
                        if (player == null || !player.isPlayer()) return;
                        if (player.level.isClientSide()) return;
                        let stack = ancientSkullPickStack(firstStack, secondStack);
                        if (stack == null) return;
                        ancientSkullSettleAll(player, stack);
                    } catch (e) {
                        console.log('[古圣头骨] 卸下结算入口出错: ' + e);
                    }
                })
        )
})
