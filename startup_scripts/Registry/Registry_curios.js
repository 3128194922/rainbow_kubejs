// priority: 1000

// ==========================================
// 💍 注册饰品与特殊装备 (Curios)
// ==========================================

// 荷鲁斯之爪
StartupEvents.registry('item', event => {
    event.create('rainbow:clawofhorus')
        .tooltip(Text.gold("[手套]"))
        .displayName("荷鲁斯之爪")
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(e => {
                    let stack = e.stack;
                    let player = e.slotContext.entity();

                    if (!stack || !player || player.cooldowns.isOnCooldown("rainbow:clawofhorus")) return;

                    let nbt = stack.nbt;
                    if (!nbt) return;

                    let hunted = nbt.getInt("isBeingHunted") || 0;

                    e.modify("attributeslib:crit_chance", "clawofhorus_crit_chance", hunted, "addition");
                    e.modify("attributeslib:crit_damage", "clawofhorus_crit_damage", 0.1 * hunted, "multiply_total");
                })
                .curioTick((slotContext, stack) => {
                    if (!stack.nbt) stack.nbt = {};
                    let nbt = stack.nbt;

                    let player = slotContext.entity();
                    if (!player || player.cooldowns.isOnCooldown("rainbow:clawofhorus")) return;

                    let attacker = player.lastHurtByMob;
                    let isBeingHunted = 1;

                    if (attacker && attacker.target == player) {
                        isBeingHunted = 0;
                    }

                    // 仅在状态变化时更新 NBT
                    if (nbt.getInt("isBeingHunted") !== isBeingHunted) {
                        nbt.putInt("isBeingHunted", isBeingHunted);
                        if (isBeingHunted === 0) {
                            player.cooldowns.addCooldown("rainbow:clawofhorus", 100);
                        }
                    }
                })
        );
});
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
                    // 在curioTick中安全调用hasCurios，结果缓存到NBT供modifyAttribute读取
                    let player = slotContext.entity();
                    if (player != null) {
                        stack.nbt.putBoolean("hasBerserk", hasCurios(player, "rainbow:berserk_emblem"));
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
                    let foodLevel = foodData.foodLevel;
                    let saturation = foodData.getSaturationlevel;
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
                .addAttribute("moreattribute:eat_speed", "big_stomach", -0.5, "addition")
                .addAttribute("moreattribute:drink_speed", "big_stomach", -0.5, "addition")
                .addAttribute("moreattribute:can_always_eat", "big_stomach", 1, "addition")
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
        .maxStackSize(1)
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(event => {
                    try{
                    let player = event.slotContext.entity();

                    if (player == null) return;

                    let playerHP = player.getHealth();
                    let playerMaxHP = player.getMaxHealth();
                    let percentage = 0;
                    let foodData = player.getFoodData();
                    let hungry = foodData ? foodData.foodLevel : 0;

                    percentage = ((1 - playerHP / playerMaxHP) * 0.8 + (1 - hungry / 20) * 0.4) + 1;

                    //console.log("血战沙场之证属性倍率：" + percentage);
                    event.modify("generic.attack_damage", "berserk_emblem", 0.01 * percentage, "multiply_total");
                    //event.modify("generic.attack_speed", "berserk_emblem", 0.1 * percentage, "multiply_total");
                    event.modify("generic.movement_speed", "berserk_emblem", 0.05 * percentage, "multiply_total");
                    event.modify("generic.armor_toughness", "berserk_emblem", 0.05 * percentage, "multiply_total");
                    }catch(e)
                    {
                        console.log("血战沙场之证出错："+e)
                    }
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


function hasMiningCharmHighlight(level, x, y, z, blockKey) {
    let checkBox = new AABB(x, y, z, x + 1, y + 1, z + 1)
    let entities = level.getEntitiesWithin(checkBox)

  for (let i = 0; i < entities.size(); i++) {
    let entity = entities.get(i)
    let entityId = String(ForgeRegistries.ENTITY_TYPES.getKey(entity.getType()))

    if (entityId !== 'domesticationinnovation:highlighted_block') continue

    let data = entity.getPersistentData()
    if (data.contains('rainbow_mining_charm_target') && data.getString('rainbow_mining_charm_target') === blockKey) {
      return true
    }
  }

  return false
}

// 猎宝者护符
StartupEvents.registry('item', event => {
  event.create('rainbow:mining_charm')
    .rarity('epic')
    .maxStackSize(1)
    .tag('curios:charm')
    .attachCuriosCapability(
      CuriosJSCapabilityBuilder.create()
        .modifyFortuneLevel((slotContext, lootContext, stack) => 1)
        .modifyAttribute(event => {
          event.modify('forge:entity_reach', 'mining_charm', 2.15, 'addition')
          event.modify('minecraft:generic.luck', 'mining_charm', 1, 'addition')
        })
        .canEquip((slotContext, stack) => {
          const entity = slotContext.entity()
          if (entity == null) return false

          if (hasCurios(entity, 'rainbow:mining_charm')) {
            return false
          }

          return true
        })
        .curioTick((slotContext, stack) => {
            let player = slotContext.entity()
          if (player == null) return
          if (player.level.isClientSide()) return

          // 5s 冷却
          if (player.age % 100 != 0) return

          let level = player.level;
          if (level.isClientSide()) return
        
          let scanBox = new AABB(
            player.getX() - 10, player.getY() - 5, player.getZ() - 10,
            player.getX() + 10, player.getY() + 5, player.getZ() + 10
          )
        
          let minX = Math.floor(scanBox.minX)
          let maxX = Math.floor(scanBox.maxX)
          let minY = Math.floor(scanBox.minY)
          let maxY = Math.floor(scanBox.maxY)
          let minZ = Math.floor(scanBox.minZ)
          let maxZ = Math.floor(scanBox.maxZ)
        
          for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
              for (let z = minZ; z <= maxZ; z++) {
                let block = level.getBlock(x, y, z)
                if (block.id !== 'lootr:lootr_chest') continue
        
                let blockKey = `${x},${y},${z}`
                if (hasMiningCharmHighlight(level, x, y, z, blockKey)) continue
        
                let highlight = level.createEntity('domesticationinnovation:highlighted_block')
                if (highlight == null) continue
        
                highlight.setPosition(x + 0.5, y, z + 0.5)
                highlight.getPersistentData().putString('rainbow_mining_charm_target', blockKey)
                highlight.setLifespan(100)
                highlight.spawn()
              }
            }
          }
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
                    // 只有最大生命值大于 2 时才生效，避免重复修改

                    ev.modify("generic.attack_damage", "despair_insignia", 4.0, "addition");
                    ev.modify("generic.movement_speed", "despair_insignia", 0.05, "multiply_total");
                    ev.modify("generic.attack_speed", "despair_insignia", 0.16, "multiply_total");
                    ev.modify("minecraft:generic.knockback_resistance", "despair_insignia", 0.05, "multiply_total");
                    if (player.getMaxHealth() <= 2) return;
                    ev.modify("minecraft:generic.max_health", "despair_insignia", -(player.getMaxHealth() - 2), "addition");
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
                /*.curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % 10) return;

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

// ==========================================
// 纹饰属性配置
// ==========================================
const BIBLE_TRIM_ATTRIBUTES = {
    "caverns_and_chasms:rim": [
        { id: "rim_armor", attribute: "minecraft:generic.armor", base: 0.5, scale: 0.1 },
        { id: "rim_toughness", attribute: "minecraft:generic.armor_toughness", base: 0.3, scale: 0.05 },
        { id: "rim_knockback", attribute: "minecraft:generic.knockback_resistance", base: 0.02, scale: 0.005 }
    ],
    "minecraft:vex": [
        { id: "vex_attack", attribute: "minecraft:generic.attack_damage", base: 0.25, scale: 0.05 },
        { id: "vex_crit_rate", attribute: "attributeslib:crit_chance", base: 0.005, scale: 0.001 },
        { id: "vex_crit_dmg", attribute: "attributeslib:crit_damage", base: 0.02, scale: 0.005 }
    ],
    "minecraft:raiser": [
        { id: "raiser_health", attribute: "minecraft:generic.max_health", base: 1.0, scale: 0.2 },
        { id: "raiser_heal", attribute: "attributeslib:healing_received", base: 0.01, scale: 0.005 },
        { id: "raiser_ghost", attribute: "attributeslib:ghost_health", base: 0.5, scale: 0.1 }
    ],
    "minecraft:sentry": [
        { id: "sentry_armor", attribute: "minecraft:generic.armor", base: 0.5, scale: 0.15 },
        { id: "sentry_prot_shred", attribute: "attributeslib:prot_shred", base: 0.01, scale: 0.003 },
        { id: "sentry_step", attribute: "forge:step_height_addition", base: 0.05, scale: 0.01 }
    ],
    "minecraft:shaper": [
        { id: "shaper_reach", attribute: "forge:block_reach", base: 0.3, scale: 0.05 },
        { id: "shaper_mining", attribute: "attributeslib:mining_speed", base: 0.02, scale: 0.005 },
        { id: "shaper_exp", attribute: "attributeslib:experience_gained", base: 0.02, scale: 0.005 }
    ],
    "minecraft:host": [
        { id: "host_lifesteal", attribute: "attributeslib:life_steal", base: 0.005, scale: 0.001 },
        { id: "host_overheal", attribute: "attributeslib:overheal", base: 0.01, scale: 0.003 },
        { id: "host_ca_lifesteal", attribute: "caverns_and_chasms:lifesteal", base: 0.005, scale: 0.001 }
    ],
    "minecraft:silence": [
        { id: "silence_dodge", attribute: "attributeslib:dodge_chance", base: 0.005, scale: 0.001 },
        { id: "silence_stealth", attribute: "environmental:stealth", base: 0.2, scale: 0.05 },
        { id: "silence_speed", attribute: "minecraft:generic.movement_speed", base: 0.002, scale: 0.0005 }
    ],
    "atmospheric:petrified": [
        { id: "petri_toughness", attribute: "minecraft:generic.armor_toughness", base: 0.5, scale: 0.1 },
        { id: "petri_armor", attribute: "minecraft:generic.armor", base: 0.5, scale: 0.08 },
        { id: "petri_knockback", attribute: "minecraft:generic.knockback_resistance", base: 0.03, scale: 0.005 }
    ],
    "caverns_and_chasms:forger": [
        { id: "forger_mining", attribute: "attributeslib:mining_speed", base: 0.05, scale: 0.01 },
        { id: "forger_exp", attribute: "attributeslib:experience_gained", base: 0.02, scale: 0.005 },
        { id: "forger_luck", attribute: "minecraft:generic.luck", base: 0.1, scale: 0.02 }
    ],
    "caverns_and_chasms:plate": [
        { id: "plate_armor", attribute: "minecraft:generic.armor", base: 1.0, scale: 0.15 },
        { id: "plate_knockback", attribute: "minecraft:generic.knockback_resistance", base: 0.05, scale: 0.01 },
        { id: "plate_prot_pierce", attribute: "attributeslib:prot_pierce", base: 0.01, scale: 0.002 }
    ],
    "netherexp:spirit": [
        { id: "spirit_magic_dmg", attribute: "caverns_and_chasms:magic_damage", base: 0.2, scale: 0.05 },
        { id: "spirit_magic_prot", attribute: "caverns_and_chasms:magic_protection", base: 0.1, scale: 0.03 },
        { id: "spirit_fire_dmg", attribute: "attributeslib:fire_damage", base: 0.1, scale: 0.03 }
    ],
    "minecraft:tide": [
        { id: "tide_swim", attribute: "forge:swim_speed", base: 0.02, scale: 0.005 },
        { id: "tide_gravity", attribute: "forge:entity_gravity", base: -0.01, scale: -0.002 },
        { id: "tide_speed", attribute: "minecraft:generic.movement_speed", base: 0.002, scale: 0.0005 }
    ],
    "minecraft:rib": [
        { id: "rib_attack", attribute: "minecraft:generic.attack_damage", base: 0.3, scale: 0.06 },
        { id: "rib_lifesteal", attribute: "attributeslib:life_steal", base: 0.008, scale: 0.002 },
        { id: "rib_ca_lifesteal", attribute: "caverns_and_chasms:lifesteal", base: 0.008, scale: 0.002 }
    ],
    "minecraft:spire": [
        { id: "spire_fly_speed", attribute: "minecraft:generic.flying_speed", base: 0.01, scale: 0.003 },
        { id: "spire_reach", attribute: "forge:entity_reach", base: 0.3, scale: 0.05 },
        { id: "spire_follow", attribute: "minecraft:generic.follow_range", base: 0.5, scale: 0.1 }
    ],
    "atmospheric:druid": [
        { id: "druid_heal", attribute: "attributeslib:healing_received", base: 0.02, scale: 0.005 },
        { id: "druid_magic", attribute: "caverns_and_chasms:magic_damage", base: 0.15, scale: 0.04 },
        { id: "druid_fragrance", attribute: "windswept:fragrance", base: 0.5, scale: 0.1 }
    ],
    "atmospheric:apostle": [
        { id: "apostle_ghost", attribute: "attributeslib:ghost_health", base: 0.8, scale: 0.15 },
        { id: "apostle_overheal", attribute: "attributeslib:overheal", base: 0.02, scale: 0.005 },
        { id: "apostle_exp", attribute: "attributeslib:experience_gained", base: 0.03, scale: 0.008 }
    ],
    "caverns_and_chasms:core": [
        { id: "core_attack", attribute: "minecraft:generic.attack_damage", base: 0.3, scale: 0.05 },
        { id: "core_armor", attribute: "minecraft:generic.armor", base: 0.3, scale: 0.05 },
        { id: "core_speed", attribute: "minecraft:generic.movement_speed", base: 0.003, scale: 0.0008 }
    ],
    "caverns_and_chasms:exile": [
        { id: "exile_arrow_dmg", attribute: "attributeslib:arrow_damage", base: 0.1, scale: 0.03 },
        { id: "exile_arrow_vel", attribute: "attributeslib:arrow_velocity", base: 0.02, scale: 0.005 },
        { id: "exile_draw_speed", attribute: "attributeslib:draw_speed", base: 0.01, scale: 0.003 }
    ],
    "netherexp:valor": [
        { id: "valor_attack", attribute: "minecraft:generic.attack_damage", base: 0.35, scale: 0.06 },
        { id: "valor_crit_rate", attribute: "attributeslib:crit_chance", base: 0.008, scale: 0.002 },
        { id: "valor_crit_dmg", attribute: "attributeslib:crit_damage", base: 0.03, scale: 0.008 }
    ],
    "minecraft:ward": [
        { id: "ward_toughness", attribute: "minecraft:generic.armor_toughness", base: 0.5, scale: 0.12 },
        { id: "ward_armor", attribute: "minecraft:generic.armor", base: 0.3, scale: 0.08 },
        { id: "ward_prot_shred", attribute: "attributeslib:prot_shred", base: 0.015, scale: 0.004 }
    ],
    "minecraft:eye": [
        { id: "eye_reach", attribute: "forge:entity_reach", base: 0.5, scale: 0.08 },
        { id: "eye_dodge", attribute: "attributeslib:dodge_chance", base: 0.005, scale: 0.0015 },
        { id: "eye_luck", attribute: "minecraft:generic.luck", base: 0.15, scale: 0.03 }
    ],
    "caverns_and_chasms:trim_modifier": [
        { id: "trim_luck", attribute: "minecraft:generic.luck", base: 0.2, scale: 0.04 },
        { id: "trim_mining", attribute: "attributeslib:mining_speed", base: 0.03, scale: 0.008 },
        { id: "trim_step", attribute: "forge:step_height_addition", base: 0.08, scale: 0.015 }
    ],
    "caverns_and_chasms:immolate": [
        { id: "immolate_fire", attribute: "attributeslib:fire_damage", base: 0.2, scale: 0.05 },
        { id: "immolate_lifesteal", attribute: "attributeslib:life_steal", base: 0.01, scale: 0.003 },
        { id: "immolate_ca_lifesteal", attribute: "caverns_and_chasms:lifesteal", base: 0.01, scale: 0.003 }
    ],
    "minecraft:dune": [
        { id: "dune_armor", attribute: "minecraft:generic.armor", base: 0.4, scale: 0.1 },
        { id: "dune_speed", attribute: "minecraft:generic.movement_speed", base: 0.003, scale: 0.0005 },
        { id: "dune_step", attribute: "forge:step_height_addition", base: 0.05, scale: 0.01 }
    ],
    "minecraft:coast": [
        { id: "coast_swim", attribute: "forge:swim_speed", base: 0.03, scale: 0.008 },
        { id: "coast_gravity", attribute: "forge:entity_gravity", base: -0.015, scale: -0.003 },
        { id: "coast_speed", attribute: "minecraft:generic.movement_speed", base: 0.003, scale: 0.0005 }
    ],
    "minecraft:wild": [
        { id: "wild_speed", attribute: "minecraft:generic.movement_speed", base: 0.004, scale: 0.001 },
        { id: "wild_attack", attribute: "minecraft:generic.attack_damage", base: 0.2, scale: 0.04 },
        { id: "wild_dodge", attribute: "attributeslib:dodge_chance", base: 0.005, scale: 0.001 }
    ],
    "netherexp:rift": [
        { id: "rift_reach", attribute: "forge:entity_reach", base: 0.4, scale: 0.08 },
        { id: "rift_block_reach", attribute: "forge:block_reach", base: 0.4, scale: 0.08 },
        { id: "rift_knockback", attribute: "minecraft:generic.attack_knockback", base: 0.05, scale: 0.01 }
    ],
    "minecraft:snout": [
        { id: "snout_fire", attribute: "attributeslib:fire_damage", base: 0.15, scale: 0.04 },
        { id: "snout_armor", attribute: "minecraft:generic.armor", base: 0.4, scale: 0.08 },
        { id: "snout_attack", attribute: "minecraft:generic.attack_damage", base: 0.2, scale: 0.04 }
    ],
    "minecraft:wayfinder": [
        { id: "wayfinder_speed", attribute: "minecraft:generic.movement_speed", base: 0.003, scale: 0.0008 },
        { id: "wayfinder_luck", attribute: "minecraft:generic.luck", base: 0.2, scale: 0.04 },
        { id: "wayfinder_exp", attribute: "attributeslib:experience_gained", base: 0.03, scale: 0.008 }
    ]
};

// ==========================================
// 圣经 - 盔甲纹饰祝福
// ==========================================
// 根据玩家穿戴的盔甲纹饰和魔法伤害属性动态加成
StartupEvents.registry('item', event => {
    event.create('rainbow:the_bible')
        .maxDamage(300)
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(ev => {
                    let player = ev.slotContext.entity();
                    if (player == null) return;

                    let magicDamage = 0;
                    try {
                        magicDamage = player.getAttributeValue("caverns_and_chasms:magic_damage");
                    } catch (e) {}
                    if (magicDamage == null) magicDamage = 0;

                    let armorSlots = [
                        { key: "head", slot: $BIBLE_EQUIP_SLOT.HEAD },
                        { key: "chest", slot: $BIBLE_EQUIP_SLOT.CHEST },
                        { key: "legs", slot: $BIBLE_EQUIP_SLOT.LEGS },
                        { key: "feet", slot: $BIBLE_EQUIP_SLOT.FEET }
                    ];

                    armorSlots.forEach(slotInfo => {
                        if (!slotInfo || !slotInfo.slot) return;
                        let armorItem = player.getItemBySlot(slotInfo.slot);
                        if (!armorItem || armorItem.isEmpty()) return;
                        let nbt = armorItem.getNbt();
                        if (!nbt || !nbt.contains("Trim", 10)) return;

                        let trim = nbt.getCompound("Trim");
                        if (!trim) return;
                        let pattern = trim.getString("pattern");
                        if (!pattern || pattern == "") return;

                        let config = BIBLE_TRIM_ATTRIBUTES[pattern];
                        if (!config) return;

                        config.forEach(attr => {
                            if (!attr || !attr.attribute || attr.base == null || attr.scale == null) return;
                            let amount = attr.base + magicDamage * attr.scale;
                            if (amount <= 0) return;

                            let uuid = $BIBLE_UUID.nameUUIDFromBytes(new $STRING("bible_trim:" + pattern + ":" + attr.id + ":" + slotInfo.key).getBytes());

                            ev.modify(attr.attribute, uuid, "bible_" + attr.id, amount, "addition");
                        });
                    });
                })
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
            CuriosJSCapabilityBuilder.create()
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
            CuriosJSCapabilityBuilder.create()
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
            CuriosJSCapabilityBuilder.create()
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
})

// 大师球
StartupEvents.registry('item', event => {
    event.create('rainbow:master_ball')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .texture('rainbow:item/mind_ctroller_detention')
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return;
                    if (entity.age % 20 != 0) return;
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
                    if (player.age % 10 === 0) {
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
                    if (player.age % 20 === 0) {
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
                /*.canUnequip((slotContext, stack) => {
                    return false;
                })*/
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (player == null) return;
                    if (player.age % 20 !== 0) return;
                    player.potionEffects.add("species:bloodlust", 60, 0, false, false);
                })
        )
})

// 幽匿亲和
StartupEvents.registry('item', event => {
    event.create('rainbow:sculk_affinity')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
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
})
/*
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
})*/

// 幻象形体
/*StartupEvents.registry('item', event => {
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
})*/


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
/*StartupEvents.registry('item', event => {
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
            CuriosJSCapabilityBuilder.create()
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
            CuriosJSCapabilityBuilder.create()
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
            CuriosJSCapabilityBuilder.create()
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
            CuriosJSCapabilityBuilder.create()
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
            CuriosJSCapabilityBuilder.create()
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

// 重力核心
StartupEvents.registry('item', event => {
    event.create('rainbow:gravity_core')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:gravity_core')) {
                        return false;
                    }
                    return true;
                })
                .addAttribute("oreganized:kinetic_damage", "gravity_core", 5, "addition")
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();

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
            CuriosJSCapabilityBuilder.create()
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

                    if(player.age % 20) return;

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

                        let playerVolume = player.getBoundingBox().getXsize() * player.getBoundingBox().getYsize() * player.getBoundingBox().getZsize();
                        let victimVolume = entity.getBoundingBox().getXsize() * entity.getBoundingBox().getYsize() * entity.getBoundingBox().getZsize();

                        let ADD = 0;
                        if(playerVolume>victimVolume)
                            {
                                let ADD = 10;
                            }
                        let DAMAGE = 10 + ADD + kineticDamage;

                        entity.attack(player.damageSources().playerAttack(player),DAMAGE);
                        entity.setDeltaMovement(entity.getDeltaMovement().multiply(0.0, 2.0, 0.0)); 
                    })
                })
        )
})

// 石鬼像
StartupEvents.registry('item', event => {
    event.create('rainbow:moai_charm')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
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
})

// 雪碧
StartupEvents.registry('item', event => {
    event.create('rainbow:sprite')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
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

// 玩家小人
StartupEvents.registry('item', event => {
    event.create('rainbow:player_doll')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        
})

// 混沌核心
StartupEvents.registry('item', event => {
    event.create('rainbow:chaos_core')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 七阳之戒
StartupEvents.registry('item', event => {
    event.create('rainbow:dark_sun_ring')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
})

// 日曜石
StartupEvents.registry('item', event => {
    event.create('rainbow:shiny_stone')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
                .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'rainbow:shiny_stone')) return false;
                    return true;
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity();
                    if (!player || player.level.isClientSide()) return;

                    let tag = stack.getOrCreateTag();
                    let lastX = tag.getDouble("lastX");
                    let lastZ = tag.getDouble("lastZ");

                    let dx = player.x - lastX;
                    let dz = player.z - lastZ;
                    let moving = (dx * dx + dz * dz) > 1.0e-6;

                    tag.putDouble("lastX", player.x);
                    tag.putDouble("lastZ", player.z);
                    tag.putBoolean("Moving", moving);

                    // 不移动时每秒恢复 1 血量
                    if (!moving) {
                        player.heal(1);
                    }
                })
        )
})

//恐惧王冠
StartupEvents.registry('item', event => {
    event.create("rainbow:whistle")
            .rarity("epic")
            .maxStackSize(1)
            .tag("curios:charm")
})
