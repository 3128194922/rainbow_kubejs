// priority: 0
// ==========================================
// 物品修改
// Item Modifications
// ==========================================
// 修改现有物品的属性、稀有度和添加功能（如背罐飞行能力）
// Modifies properties, rarity, and adds functionality (like backtank flight) to existing items

// 修改物品稀有度和属性
/*ItemEvents.modification(event => {
   let list = ['gimmethat:gravity_core', 'gimmethat:giants_ring', 'gimmethat:moai_charm']

   // 批量修改稀有度为 epic
   list.forEach(item => {
      event.modify(item, item_ => {
         item_.rarity = "epic"
      })
   })

   // 修改 legendary_monsters:the_great_frost 物品，增加攻击距离
   event.modify("legendary_monsters:the_great_frost", event => {
      event.addAttribute("forge:entity_reach", "62808577-5866-484f-a397-7b9340fd7c0b", "the_great_frost", 1.0, "addition")
   })
})
*/
/*
ItemEvents.modification(event => {
   const backtanks = [
      'create:copper_backtank',
      'create:netherite_backtank'
   ];

   backtanks.forEach(id => {
      event.modify(id, item => {
         item.attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
               .curioTick((slotContext, stack) => {
                  let player = slotContext.entity();
                  if (!player) return;
                  if (!stack.nbt) stack.nbt = {};
                  stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
               })
               .modifyAttribute(attributeModificationContext => {
                  let { slotContext } = attributeModificationContext;
                  let player = slotContext.entity();
                  if (!player) return;

                  // --- 判断是否穿齐民主套装 ---
                  let armor = ["head", "chest", "legs", "feet"];
                  let fullSet = armor.every(slot =>
                     player.getItemBySlot(slot).id == `gimmethat:democracy_${slot == "head" ? "helmet" :
                        slot == "chest" ? "chestplate" :
                           slot == "legs" ? "leggings" : "boots"
                     }`
                  );
                  if (!fullSet) return; // 没穿齐不加飞行

                  attributeModificationContext.modify(
                     "attributeslib:creative_flight",
                     "2d884127-8af5-4c8b-ad67-35d86bb7f56d",
                     1,
                     'addition'
                  );
               })
         );
      });
   });
});*/

/*
ItemEvents.modification(event => {
   event.modify('chromaticarsenal:golden_heart', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .addAttribute(
                   "minecraft:generic.max_health",
                   "golden_heart",
                   20,
                   'addition'
               )
       )
   })
})*/

//锡纸
ItemEvents.modification(event => {
   event.modify('caverns_and_chasms:tinplate', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .addAttribute(
                   "minecraft:generic.armor_toughness",
                   "tinplate",
                   3,
                   'addition'
               )
       )
   })
})
//鞍背蛋
ItemEvents.modification(event => {
   event.modify('caverns_and_chasms:saddled_egg', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .addAttribute(
                   "minecraft:generic.armor_toughness",
                   "saddled_egg",
                   6,
                   'addition'
               )
       )
   })
})
//魔术硬币
ItemEvents.modification(event => {
   event.modify('species:wicked_swapper', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .addAttribute(
                   "attributeslib:dodge_chance",
                   "wicked_swapper",
                   0.15,
                   'multiply_base'
               )
       )
   })
})
//滴水兽
ItemEvents.modification(event => {
   event.modify('oreganized:gargoyle', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'oreganized:gargoyle')) return false;
                    return true;
                })
               .modifyAttribute(ev => {
                    let stack = ev.stack;
                    let moving = stack.getOrCreateTag().getBoolean("Moving");
                    if (!moving) {
                        ev.modify("minecraft:generic.armor", "sprite", 10, "addition");
                    }
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

                    if (!moving) {
                        stack.nbt.putBoolean("Moving", false);
                    }else
                    {
                        stack.nbt.putBoolean("Moving", true);
                    }
                })
       )
   })
})
//动能核心
ItemEvents.modification(event => {
   event.modify('species:kinetic_core', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'species:kinetic_core')) return false;
                    return true;
                })
       )
   })
})

// 延迟加载 Tide 类（运行时首次使用时才加载，避免 startup 阶段提前加载 Tide 类破坏 mod 注册流程）
function getTideClass(name) {
    try {
        if (global._tideClasses == null) global._tideClasses = {};
        if (global._tideClasses[name] != null) return global._tideClasses[name];
        let cls = Java.tryLoadClass(name);
        global._tideClasses[name] = cls; // 加载失败缓存 null，避免重复尝试
        if (cls == null) console.log("getTideClass 未加载到类: " + name); // 帮助排查 classfilter/类名问题
        return cls;
    } catch (e) {
        console.log("getTideClass 加载失败(" + name + "): " + e);
        return null;
    }
}

// 读取玩家 Tide 图鉴数据 NBT（服务端优先读 Forge 持久化数据，客户端走 CLIENT_DATA 兜底）
// ⚠️ 切记：KubeJS 6 (1.20.1) 的 entity.persistentData 是 KubeJS 自己的数据（实体NBT键 KubeJSPersistentData），
//          Tide 写入的是 Forge 的 Entity.getPersistentData()（实体NBT键 ForgeData），两者完全不同，
//          必须通过 entity.nbt（实体完整 NBT）读 ForgeData 才能拿到 Tide 的玩家图鉴数据
function getTideJournalTag(entity) {
    // ① 服务端/权威数据：Forge 持久化数据（Tide 通过 LoaderPlatform.getPlayerData → Forge 机制）
    try {
        if (entity && entity.nbt) {
            let forgeData = entity.nbt.getCompound("ForgeData");
            if (forgeData != null && forgeData.contains("TidePlayerData")) {
                return forgeData.getCompound("TidePlayerData");
            }
        }
    } catch (e) {
        console.log("getTideJournalTag ForgeData 读取失败: " + e);
    }
    // ② 客户端兜底：Tide 网络同步的 CLIENT_DATA（结构相同）
    try {
        let TidePlayerDataCls = getTideClass('com.li64.tide.data.player.TidePlayerData');
        if (TidePlayerDataCls) {
            let tag = TidePlayerDataCls.CLIENT_DATA.getAsTag();
            if (tag && tag.contains("fish_data")) return tag;
        }
    } catch (e) {
        console.log("getTideJournalTag CLIENT_DATA 读取失败: " + e);
    }
    return null;
}

// 计算鱼类图鉴解锁数量（已解锁条目数）
function getTideFishUnlockCount(tag) {
    let unlocked = 0;
    try {
        if (!tag || !tag.contains("fish_data")) return 0;
        let list = tag.getList("fish_data", 10);
        for (let i = 0; i < list.size(); i++) {
            let entry = list.getCompound(i);
            if (entry.getCompound("data").getBoolean("is_unlocked")) unlocked++;
        }
    } catch (e) {
        console.log("getTideFishUnlockCount 解析失败: " + e);
    }
    return unlocked;
}

// 返回鱼类图鉴总条目数（Tide 数据加载器），失败时兜底为 1 防除零
function getTideFishTotalCount() {
    try {
        let TideDataCls = getTideClass('com.li64.tide.data.TideData');
        if (TideDataCls && TideDataCls.FISH) {
            let total = TideDataCls.FISH.journalEntryCount();
            if (total > 0) return total;
        }
    } catch (e) {
        console.log("getTideFishTotalCount 获取总数失败: " + e);
    }
    return 1;
}

//百鱼全书：鱼类图鉴解锁进度 → 幸运加成（1% 解锁度 +1 幸运）
// 数据来源（参考 Tide-2 源码）：
//   服务端：ForgeData."TidePlayerData".fish_data 列表，每项 data.is_unlocked 为已解锁
//           （⚠️ KubeJS 6 的 persistentData 是 KubeJS 私有数据，读不到 Tide；必须读实体NBT的 ForgeData）
//   客户端：TidePlayerData.CLIENT_DATA（Tide 网络同步后的图鉴数据，结构相同）
//   总数：TideData.FISH.journalEntryCount()（Tide mod 数据加载器中的图鉴条目数）
ItemEvents.modification(event => {
   event.modify('tide:fishing_journal', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'tide:fishing_journal')) return false;
                    return true;
                })
               // ================================
               // ❤️ 核心机制：根据玩家鱼类解锁进度等比例加成幸运
               //（已解锁数 / 总数 → 解锁比例(0~1) → ×25 取整，100% 解锁 = 25 幸运）
               // ================================
               .modifyAttribute(ev => {
                    let entity = ev.slotContext.entity();
                    if (entity == null) return;

                    // 已解锁数 / 总数 → 解锁比例 → ×25 取整
                    let tag = getTideJournalTag(entity);
                    let unlocked = getTideFishUnlockCount(tag);
                    let total = getTideFishTotalCount();
                    let luck = Math.floor(unlocked / total * 25);
                    if (luck <= 0) return;

                    ev.modify("minecraft:generic.luck", "fishing_journal_luck", luck, "addition");
               })
               // ================================
               // ❤️ 属性重算触发：只有解锁进度变化时才翻转 update 通知 CuriosJS 重算属性
               // (每 5 秒检查一次，解锁数存入 NBT 做对比，避免无效重算/频繁序列化实体NBT)
               // ================================
               .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (entity == null) return;
                    if (entity.age % 100 != 0) return;

                    let tag = getTideJournalTag(entity);
                    let unlocked = getTideFishUnlockCount(tag);
                    let total = getTideFishTotalCount();
                    let luck = Math.floor(unlocked / total * 25);

                    // 进度未变化则不重算
                    if (stack.getOrCreateTag().getInt("journal_luck") == luck) return;
                    stack.getOrCreateTag().putInt("journal_luck", luck);
                    stack.getOrCreateTag().putBoolean("update", !stack.getOrCreateTag().getBoolean("update"));
                    console.log("百鱼全书 幸运更新: 解锁 " + unlocked + "/" + total + " → 幸运 +" + luck); 
            })
        )
   })
})

//末影手套
/*ItemEvents.modification(event => {
   event.modify('royalvariations:spectral_gauntlet', item => {
       item.attachCuriosCapability(
           CuriosJSCapabilityBuilder.create()
               .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;
                    if (hasCurios(entity, 'royalvariations:spectral_gauntlet')) return false;
                    if(hasCuriosTag(entity, "rainbow:glove")) return false;
                    return true;
                })
       )
   })
})*/
//铜 套装 宠物流派 - 根据氧化状态提供不同加成
// 打蜡变体锁定对应阶段的加成值（不继续氧化）
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        let armorTypes = ["helmet", "chestplate", "leggings", "boots"]
        let armorSlots = ["head", "chest", "legs", "feet"]

        let id = item.id

        // 氧化状态 → 宠物伤害加成（multiply_base）
        let bonusMap = {
            "copper": 1,
            "exposed_copper": 1,
            "weathered_copper": 1,
            "oxidized_copper": 1
        }

        let uuids = [
            "62808577-5866-484f-a397-7b9340fd7c0b",
            "72808577-5866-484f-a397-7b9340fd7c0b",
            "82808577-5866-484f-a397-7b9340fd7c0b",
            "92808577-5866-484f-a397-7b9340fd7c0b"
        ]

        for (var i = 0; i < armorSlots.length; i++) {
            if (slotType !== armorSlots[i]) continue

            for (var prefix in bonusMap) {
                var expectedId = "caverns_and_chasms:" + prefix + "_" + armorTypes[i]
                if (id === expectedId) {
                    event.addModifier(
                        "rainbow:generic.pet_damage",
                        new AttributeModifier(
                            uuids[i],
                            'copper_pet_' + prefix,
                            bonusMap[prefix],
                            "addition"
                        )
                    )
                    return
                }

                // 打蜡变体（加成值与对应氧化阶段相同，但不会继续氧化）
                var waxedId = "caverns_and_chasms:waxed_" + prefix + "_" + armorTypes[i]
                if (id === waxedId) {
                    event.addModifier(
                        "rainbow:generic.pet_damage",
                        new AttributeModifier(
                            uuids[i],
                            'copper_pet_waxed_' + prefix,
                            bonusMap[prefix],
                            "addition"
                        )
                    )
                    return
                }
            }
        }
    } catch (e) {
        console.log("铜套装宠物流派属性修改出错：")
        console.log(e)
    }
})
// 鱼骨剑
/*ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
      //event.addAttribute("minecraft:generic.attack_speed", "", "skelewag_sword", -1.0, "addition")
         event.addModifier(
            "alexsmobs:skelewag_sword",
            new AttributeModifier(
               "df799a56-f54d-4e1a-bf64-699943718318",
               'skelewag_sword',
               -1.0,
               "addition"
            )
         )
    } catch (e) {
        console.log("鱼骨剑属性修改出错：")
        console.log(e)
    }
});*/

// 骑士 套装 宠物流派
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        let items = ['royalvariations:royal_knight_helmet','royalvariations:royal_knight_cuirass','royalvariations:royal_knight_leggings','royalvariations:royal_knight_boots']
        let uuids = [
            "61808577-4399-484f-a397-7b9340fd7c0b",
            "71808577-4399-484f-a397-7b9340fd7c0b",
            "81808577-4399-484f-a397-7b9340fd7c0b",
            "91808577-4399-484f-a397-7b9340fd7c0b"
        ]
        let armorSlots = ["head", "chest", "legs", "feet"]

        for (let i = 0; i < items.length; i++) {
            if (item.id === items[i] && slotType === armorSlots[i]) {
                event.addModifier(
                    "rainbow:generic.pet_damage",
                    new AttributeModifier(
                        uuids[i],
                        'royal_knight',
                        3,
                        "addition"
                    )
                )
                break
            }
        }
    } catch (e) {
        console.log("骑士套装属性修改出错：")
        console.log(e)
    }
});

// 铂金 套装 动能流派
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        let items = ['oreganized:electrum_helmet', 'oreganized:electrum_chestplate', 'oreganized:electrum_leggings', 'oreganized:electrum_boots']
        let uuids = [
            "61808577-5866-484f-a397-7b9340fd7c0b",
            "71808577-5866-484f-a397-7b9340fd7c0b",
            "81808577-5866-484f-a397-7b9340fd7c0b",
            "91808577-5866-484f-a397-7b9340fd7c0b"
        ]
        let armorSlots = ["head", "chest", "legs", "feet"]

        for (let i = 0; i < items.length; i++) {
            if (item.id === items[i] && slotType === armorSlots[i]) {
                event.addModifier(
                    "oreganized:kinetic_damage",
                    new AttributeModifier(
                        uuids[i],
                        'electrum_kinetic',
                        1,
                        "addition"
                    )
                )
                break
            }
        }
    } catch (e) {
        console.log("铂金套装属性修改出错：")
        console.log(e)
    }
});

// 银 套装 魔法流派
ItemEvents.modification(event => {
   let items = ['caverns_and_chasms:silver_helmet','caverns_and_chasms:silver_chestplate','caverns_and_chasms:silver_leggings', 'caverns_and_chasms:silver_boots']
   let uuids = [
      "61908577-5866-484f-a397-7b9340fd7c0b",
      "71908577-5866-484f-a397-7b9340fd7c0b",
      "81908577-5866-484f-a397-7b9340fd7c0b",
      "91908577-5866-484f-a397-7b9340fd7c0b"
   ]
   items.forEach(item => {
      event.modify(item, event => {
         event.addAttribute("caverns_and_chasms:magic_damage", uuids[items.indexOf(item)], item, 0.5, "addition")
      })
   })
})

// 防爆 套装 爆炸流派
ItemEvents.modification(event => {
   let items = ['savage_and_ravage:griefer_helmet','savage_and_ravage:griefer_chestplate','savage_and_ravage:griefer_leggings', 'savage_and_ravage:griefer_boots']
   let uuids = [
      "61908571-5866-484f-a397-7b9340fd7c0b",
      "71908571-5866-484f-a397-7b9340fd7c0b",
      "81908571-5866-484f-a397-7b9340fd7c0b",
      "91908571-5866-484f-a397-7b9340fd7c0b"
   ]
   items.forEach(item => {
      event.modify(item, event => {
         event.addAttribute("rainbow:generic.boom_damage", uuids[items.indexOf(item)], item, 0.1, "multiply_base")
      })
   })
})