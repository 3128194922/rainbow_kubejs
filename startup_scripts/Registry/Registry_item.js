// priority: 1000
// ==========================================
// 🍎 注册物品
// ==========================================
StartupEvents.registry("item", event => {

    // 副本通行证
    for (let i = 1; i <= 5; i++) {
        event.create(`rainbow:instance_pass${i}`, 'basic')
            .texture('rainbow:item/instance_pass')
            .tag('rainbow:instance_pass');
    }

    // 牢大饮料 (冰红茶)
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

    // nbt工具
    event.create("rainbow:nbt_util").texture('fruitfulfun:item/inspector').unstackable().glow(true)
    // 金手指
    event.create("rainbow:golden_finger").texture('create:item/brass_hand').unstackable().glow(true)

    // 洛阳铲
    //event.create("rainbow:luoyang_shovel","sword").maxDamage(100).attackDamageBonus(1).maxStackSize(1).attackDamageBaseline(1)

    // 秘封琥珀
    event.create("rainbow:amber_bee")

    // 远程标靶信号器
    event.create("rainbow:controller").texture('alexscaves:item/remote_detonator')

    // 发条怀表 (饰品)
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
                    // 定时给予时间相关的药水效果
                    player.potionEffects.add("runiclib:chronos", SecoundToTick(10), 0, false, false)
                })
        )

    // 乐谱
    //event.create("rainbow:musical_score")
    // 升级模板
    event.create("rainbow:cleaver_upgrade")
    // 收容中心
    event.create("rainbow:mind_ctroller_detention")

    // 净化绢布：使用后移除副手物品的诅咒附魔和修复代价
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

    // 大肉面：回复大量饱食度和饱和度，给予滋养和舒适效果
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

    // 血肉：回复少量饱食度和饱和度
    event.create("rainbow:flesh", "basic").maxStackSize(64).rarity("epic")
        .food(foodBuilder => {
            foodBuilder
                .alwaysEdible()
                .meat()
                .hunger(5)
                .saturation(5.0)
        })

    // 群系之刃：高攻击力剑
    event.create("rainbow:biome_of_sword", "sword").maxDamage(100).attackDamageBonus(3).maxStackSize(1).attackDamageBaseline(4.0)

    // 决斗剑：对同类型生物伤害增加
    event.create("rainbow:duel", "sword").maxDamage(100).attackDamageBonus(3).maxStackSize(1).attackDamageBaseline(4.0)
        .tooltip("§6对同一类型生物伤害增加1.5")

    // 虚空粗矿
    event.create("rainbow:raw_voidore", "basic")
    // 魔爪
    //event.create("rainbow:mozhua", "basic")

    // 霜冻金属镐：挖掘等级高，耐久高
    event.create("rainbow:frostium_pickaxe", "pickaxe")
        .maxDamage(1500)
        .maxStackSize(1)
        .tooltip("§6对硬度高的方块挖掘更快")
        .tag("minecraft:pickaxes")
        .tier(Tiers.DIAMOND)

    // 黏液棒：具有多种功能（生成平台、救生罩、脱装备）
    event.create("rainbow:slime_rod", "sword").unstackable().glow(true).attackDamageBonus(0.0).attackDamageBaseline(0.0)
        .tooltip("右键：生成救生平台")
        .tooltip("潜行右键：生成救生罩")
        .tooltip("左键：脱下实体装备")
        .tag("curios:charm")

    // 提尔锋：对有护甲敌人造成额外伤害
    event.create("rainbow:tyrfing", "sword").unstackable().attackDamageBonus(3.0).attackDamageBaseline(0.0).maxDamage(511)
        .tooltip("§6对有护甲的敌人造成额外伤害")

    // 重锤：根据下落速度造成伤害
    event.create("rainbow:heavy_axe", "axe").unstackable().attackDamageBonus(3.0).attackDamageBaseline(0.0).maxDamage(501)
        .tooltip("§6根据你的下落加速度造成伤害")

    // 饕餮之锅：攻速慢，伤害高
    event.create("rainbow:eldritch_pan", "sword")
        .speedBaseline(-3.1)
        .attackDamageBonus(4.0)
        .rarity("epic")
        .maxDamage(0)
    /*
        // 饕餮剑：吞噬剑以成长
        event.create("rainbow:eldritch_sword", "sword")
            .speedBaseline(-2.4)
            .attackDamageBonus(4.0)
            .rarity("epic")
            .maxDamage(0)
            */
    // 超精密构件：合成材料
    event.create("rainbow:super_mechanism", "basic")
        .tooltip("§6集黑暗科技时代圣遗物，绿皮的铁炸弹，钛君的OS，机械神教的神秘小系统于一身")

    // 屎：食用后反胃，甚至关闭游戏
    /*event.create("rainbow:shit", "basic").food(foodBuilder => { foodBuilder.meat().hunger(-1).saturation(2.0).alwaysEdible().fastToEat().effect("minecraft:nausea", 300, 5, 0.99) })
        .tooltip("食用关闭游戏(吃晕了")*/

    // 七彩石
    event.create("rainbow:rainbow_stone", "basic")
    // 奇迹物质
    event.create("rainbow:miracle", "basic")
    // 货币
    event.create("rainbow:coin_1", "basic")
    event.create("rainbow:coin_2", "basic")

    // 动力剑系列
    event.create("rainbow:baseball_bat", "sword").attackDamageBonus(7.0).attackDamageBaseline(0.0)
    event.create("rainbow:baseball_power", "sword")
        .attackDamageBonus(19.0)
        .attackDamageBaseline(0.0)

    // 泰拉刃：强大的武器
    event.create("rainbow:terasword", "sword")

    //村民脑子
    event.create("rainbow:brain").maxDamage(300)

    //战壕哨
    event.create("rainbow:whistle")

    //虚空之眼
    //event.create("rainbow:void_eye")

    //活体金属
    event.create("rainbow:living_metal")

    // 逻辑数字：用于自动化或逻辑计算的物品
    let Numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'plus', 'minus', 'multiply', 'divide', 'missingno']
    Numbers.forEach(id => {
        event.create(`rainbow:${id}`, "basic").displayName(`逻辑 ${ItemToNumberF(id)}`)
    })
})
