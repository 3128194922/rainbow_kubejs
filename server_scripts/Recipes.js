// priority: 0
// ==========================================
// 📜 配方修改脚本
// ==========================================

// 修改配方
ServerEvents.recipes(event => {
    // 删除金苹果配方
    event.remove({ output: 'minecraft:enchanted_golden_apple' })

    // 移除永恒之门相关珍珠配方
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:basic/blaze"}') })//删除输出为指定物品和NBT的配方
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:basic/enderman"}') })
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:basic/slime"}') })
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:emerald_grove"}') })
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:endless/blaze"}') })
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:overworldian_nights"}') })
    event.remove({ output: Item.of('gateways:gate_pearl', '{gateway:"gateways:hellish_fortress"}') })

    // 移除 CCK 实验性物品配方
    event.remove({ output: 'environmental:cherry_pie' })//删除配方，通过物品ID
    event.remove({ output: 'environmental:truffle_pie' })

    // 修改单元箱配方：将铁粒替换为潜影盒
    event.replaceInput({ output: 'backpack_pixel:unitbox' }, 'minecraft:iron_nugget', 'minecraft:shulker_box')

    // 移除虚空钢锭的混合配方
    event.remove({ id: "createutilities:mixing/void_steel_ingot" })

    // --- 音乐播放器相关配方修改 ---
    event.remove({ output: 'netmusic:music_player' })
    event.shaped('netmusic:music_player', [
        ['#minecraft:planks', '#minecraft:planks', '#minecraft:planks'],
        ['#minecraft:planks', 'create:precision_mechanism', '#minecraft:planks'],
        ['#minecraft:planks', 'create:precision_mechanism', '#minecraft:planks'],
        ['#minecraft:planks', '#minecraft:planks', '#minecraft:planks']])
    
    event.remove({ output: 'netmusic:cd_burner' })
    event.shaped('netmusic:cd_burner', [
        ['#minecraft:planks', '#minecraft:planks', '#minecraft:planks'],
        ['#minecraft:planks', '#forge:ingots/iron', '#minecraft:planks'],
        ['#minecraft:planks', 'create:precision_mechanism', '#minecraft:planks'],
        ['#minecraft:planks', '#minecraft:planks', '#minecraft:planks']])
    
    event.remove({ output: 'netmusic:computer' })
    event.shaped('netmusic:computer', [
        ['#minecraft:planks', '#minecraft:planks', '#minecraft:planks'],
        ['#minecraft:planks', '#forge:ingots/gold', '#minecraft:planks'],
        ['#minecraft:planks', 'create:precision_mechanism', '#minecraft:planks'],
        ['#minecraft:planks', '#minecraft:planks', '#minecraft:planks']])
    
    // 召唤祭坛 (已注释)
    /*    event.shaped('summoningrituals:altar',[
            ['','minecraft:wither_skeleton_skull',''],
            ['#minecraft:candles','#minecraft:candles','#minecraft:candles'],
            ['minecraft:gold_ingot','minecraft:lectern','minecraft:gold_ingot']])
        event.shaped('summoningrituals:indestructible_altar',[
            ['','create:sturdy_sheet',''],
            ['create:sturdy_sheet','summoningrituals:altar','create:sturdy_sheet'],
            ['','create:sturdy_sheet',''],])*/

    //炮塔docker
    event.shapeless('rainbow:docker_shooter_fire','rainbow:docker_shooter')
    event.shapeless('rainbow:docker_shooter_plus','rainbow:docker_shooter_fire')
    event.shapeless('rainbow:docker_shooter','rainbow:docker_shooter_plus')
    event.shaped('rainbow:docker_shooter', [
        ['minecraft:dropper', 'minecraft:dispenser', 'minecraft:redstone'],
        ['quark:redstone_randomizer', 'minecraft:repeater', 'minecraft:comparator'],
        ['minecraft:redstone_torch', 'minecraft:redstone_block', 'minecraft:target']])

    //末影docker
    event.shaped('rainbow:docker_ender', [
        ['#minecraft:planks','#minecraft:planks','#minecraft:planks'],
        ['#minecraft:planks','minecraft:ender_chest', '#minecraft:planks'],
        ['#minecraft:planks','#minecraft:planks','#minecraft:planks']])
    
    //末影docker加强型
    event.shaped('rainbow:docker_ender_player', [
        ['createutilities:void_casing','createutilities:void_casing','createutilities:void_casing'],
        ['createutilities:void_casing','rainbow:docker_ender','createutilities:void_casing'],
        ['createutilities:void_casing','createutilities:void_casing','createutilities:void_casing']])

    // 农夫乐事：切洋葱获得皮
    event.recipes.farmersdelight.cutting(
        'farmersdelight:onion',
        '#farmersdelight:tools/knives', // tool
        [ // results
            'overweight_farming:vegetable_peels',
        ],
        // '' // sound
    );

    // 万能钥匙配方
    event.shapeless('uniyesmod:master_key',['minecraft:netherite_axe','rainbow:plus','minecraft:netherite_pickaxe','rainbow:plus','minecraft:netherite_shovel'])

    // 毒化烂泥
    event.recipes.create.mixing(['8x alexscaves:unrefined_waste',"alexscaves:metal_barrel"], ['alexscaves:waste_drum', '8x #minecraft:dirt'])

    // 契约戒配方
    event.remove({ output: 'petconnect:pet_connect' })
    event.shaped('petconnect:pet_connect', [
        ["", "waystones:warp_dust", ""],
        ["waystones:warp_dust", "oreganized:silver_mirror", 'minecraft:obsidian'],
        ["", 'minecraft:obsidian', ""]
    ])

    // 炽足兽蛋配方：替换镐子输入
    event.replaceInput({ id: 'mynethersdelight:cutting/strider_egg' },
        Ingredient.of('#forge:tools/pickaxes'),
        Ingredient.of('#minecraft:pickaxes'))
    
    // 说明书配方
    event.shapeless(Item.of('patchouli:guide_book', '{"patchouli:book":"patchouli:encyclopedia"}'), 'minecraft:dirt')

    // 创造蛋糕配方
    event.shapeless('create:creative_blaze_cake',['rainbow:missingno', 'rainbow:plus', 'rainbow:plus'])

    // 传送石价格降低
    event.remove({ output: Item.of('waystones:warp_stone', '{Damage:0}') })
    event.shapeless(Item.of('waystones:warp_stone', '{Damage:0}'), ['minecraft:emerald', 'minecraft:ender_pearl'])

    // 泥土粉碎配方
    event.recipes.create.crushing('minecraft:dirt', 'minecraft:flint').processingTime(500)//.withChance(0.12)

    // 命名牌配方
    event.shapeless('minecraft:name_tag', ['#forge:string', '#minecraft:planks', 'minecraft:name_tag']).keepIngredient({ item: 'minecraft:name_tag' })

    // 切石机加强
    event.stonecutting('3x minecraft:iron_bars', 'minecraft:iron_door')
    event.stonecutting('create:cogwheel', 'create:large_cogwheel')
    event.stonecutting('create:water_wheel', 'create:large_water_wheel')
    event.stonecutting('create:shaft', 'create:cogwheel')

    // 量天尺配方
    event.shapeless('atmospheric:dragon_roots', ['atmospheric:dragon_fruit', 'minecraft:vine'])

    // 腐肉制作
    event.recipes.create.haunting('minecraft:rotten_flesh', '#mynethersdelight:curry_meats')

    // 烈焰棒合成
    event.shapeless('minecraft:blaze_rod', '6x minecraft:blaze_powder')

    // 海晶砂砾合成
    event.recipes.create.crushing(['minecraft:prismarine_crystals', Item.of('2x minecraft:prismarine_crystals').withChance(0.12)], 'minecraft:prismarine_shard').processingTime(100)//.withChance(0.12)

    // 煤炭合成
    event.recipes.create.haunting(Item.of('minecraft:coal').withChance(0.75), 'minecraft:charcoal')

    // 细雪桶
    event.recipes.create.haunting('minecraft:powder_snow_bucket', 'minecraft:water_bucket')

    // 雪球
    event.recipes.create.mixing(['5x minecraft:snowball', 'minecraft:bucket'], ['minecraft:powder_snow_bucket', '#forge:cobblestone'])

    // 缠魂棒
    event.recipes.create.haunting(Item.of('netherexp:banshee_rod').withChance(0.75), 'minecraft:blaze_rod')

    // 虚空粗矿
    event.blasting('rainbow:raw_voidore', 'rainbow:void_ore', 5, 2000)

    // 煤炭量产/下界合金
    event.recipes.create.crushing(['minecraft:coal', Item.of('minecraft:netherite_scrap').withChance(0.0001)], 'minecraft:blackstone').processingTime(150)//.withChance(0.12)

    // 鲨鱼牙齿
    event.recipes.create.crushing(['minecraft:water_bucket', '3x alexsmobs:serrated_shark_tooth'], 'alexsmobs:frilled_shark_bucket').processingTime(150)

    // 熔渣
    event.recipes.create.crushing(['create:crushed_raw_lead', 'oreganized:raw_asbestos'], 'create:scoria').processingTime(150)
    event.recipes.create.crushing(['create:crushed_raw_silver', 'oreganized:raw_asbestos'], 'create:scorchia').processingTime(150)

    // 下界岩量产
    event.recipes.create.mixing("minecraft:netherrack", [Fluid.of("minecraft:lava", 25), 'minecraft:cobblestone', 'create:cinder_flour'])

    // 岩浆量产
    event.recipes.create.mixing(Fluid.of("minecraft:lava", 200), [Fluid.of("minecraft:lava", 100), "minecraft:cobblestone"])

    // 鬼火瓶
    event.recipes.create.filling('netherexp:wisp_bottle', [Fluid.of("netherexp:ectoplasm", 200), 'quark:bottled_cloud'])

    // 鲸液
    event.recipes.create.filling('alexsmobs:ambergris', [Fluid.of("youkaishomecoming:suigei", 1000), 'rainbow:shit'])

    // 臭屁瓶
    event.recipes.create.mixing('alexsmobs:stink_bottle', ['rainbow:shit', 'quark:bottled_cloud'])

    // 710配方
    event.recipes.create.mixing(Fluid.of("rainbow:oil", 1000), ['rainbow:shit','alexsmobs:cockroach_wing_fragment']).heated()

    // 雕刻南瓜
    event.stonecutting("minecraft:carved_pumpkin", "minecraft:pumpkin");

    // 凋零骷髅合成
    event.recipes.create.haunting('minecraft:wither_skeleton_skull', 'minecraft:player_head')

    // 超精密构件
    event.recipes.create.sequenced_assembly([
        // 主要输出：成功时获得，设置权重为1（占总权重的50%）
        Item.of('rainbow:super_mechanism').withChance(global.SUPER_MECHAISM),
        // 废料输出：失败时获得，也设置权重为1（占总权重的50%）
        Item.of('create:precision_mechanism') // 例如，失败时返还一个精密机械结构
    ], 'create:precision_mechanism', [
        event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'minecraft:nether_star']),
        event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'rainbow:docker_nether_on']),
        event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'uniyesmod:nether_of_voice'])
    ]).transitionalItem('create:incomplete_precision_mechanism').loops(1)

    // 液态逻辑
    event.recipes.create.mixing(Fluid.of("rainbow:number_water", 50), ["rainbow:super_mechanism", Fluid.of("rainbow:oil", 50)]).superheated()

    // 奇迹物质
    event.recipes.create.filling('rainbow:miracle', [Fluid.of("rainbow:number_water", 1000), 'rainbow:rainbow_stone'])

    // 逻辑运算符
    event.recipes.create.crushing([Item.of('rainbow:plus').withChance(0.25), Item.of('rainbow:minus').withChance(0.25), Item.of('rainbow:multiply').withChance(0.25), Item.of('rainbow:divide').withChance(0.25)], 'rainbow:miracle').processingTime(150)

    // 熔渣-红石
    event.recipes.create.crushing(Item.of('minecraft:redstone').withChance(0.20), 'create:scoria').processingTime(150)

    // 焦黑熔渣-萤石
    event.recipes.create.crushing(Item.of('minecraft:glowstone_dust').withChance(0.20), 'create:scorchia').processingTime(150)

    // 石灰石-银
    event.recipes.create.crushing([Item.of('create:crushed_raw_silver').withChance(0.20), Item.of('oreganized:silver_nugget').withChance(0.20)], 'create:limestone').processingTime(150)

    // 逻辑运算符 - 数字
    event.recipes.create.filling('rainbow:three', [Fluid.of("rainbow:number_water", 1000), 'create:nixie_tube'])
    event.recipes.create.filling('rainbow:eight', [Fluid.of("rainbow:number_water", 1000), 'rainbow:three'])

    // 南瓜灯
    event.recipes.create.sequenced_assembly(
        'minecraft:jack_o_lantern', 'minecraft:carved_pumpkin',
        [event.recipes.createDeploying('minecraft:carved_pumpkin', ['minecraft:carved_pumpkin', 'minecraft:torch'])]
    ).transitionalItem('minecraft:carved_pumpkin').loops(1)

    // 灵魂南瓜灯
    event.recipes.create.sequenced_assembly(
        'netherexp:soul_jack_o_lantern', 'minecraft:carved_pumpkin',
        [event.recipes.createDeploying('minecraft:carved_pumpkin', ['minecraft:carved_pumpkin', 'minecraft:soul_torch'])]
    ).transitionalItem('minecraft:carved_pumpkin').loops(1)

    // 创造马达
    event.shaped('create:creative_motor', [ 
        ['create:andesite_alloy_block', 'rainbow:super_mechanism', 'rainbow:super_mechanism', 'create:shaft', 'rainbow:super_mechanism', 'rainbow:super_mechanism', 'create:andesite_alloy_block'],
        ['rainbow:super_mechanism', 'create:cogwheel', 'create:cogwheel', 'create:flywheel', 'create:large_cogwheel', 'create:large_cogwheel', 'rainbow:super_mechanism'],
        ['rainbow:super_mechanism', 'create:deployer', 'create:stressometer', 'create:hand_crank', 'create:speedometer', 'create:deployer', 'rainbow:super_mechanism'],
        ['create:rotation_speed_controller', 'minecraft:water_bucket', 'create:large_water_wheel', 'create:flywheel', 'create:white_sail', 'create:windmill_bearing', 'create:rotation_speed_controller'],
        ['rainbow:super_mechanism', 'create:deployer', 'create:copper_valve_handle', 'create:flywheel', 'create:hand_crank', 'create:deployer', 'rainbow:super_mechanism'],
        ['rainbow:super_mechanism', 'create:blaze_burner', 'create:fluid_tank', 'create:steam_engine', 'create:fluid_tank', 'create:blaze_burner', 'rainbow:super_mechanism'],
        ['create:andesite_alloy_block', 'rainbow:super_mechanism', 'rainbow:super_mechanism', 'create:rotation_speed_controller', 'rainbow:super_mechanism', 'rainbow:super_mechanism', 'create:andesite_alloy_block']
    ])

    // 生锈铜
    event.recipes.create.splashing('minecraft:weathered_copper', 'minecraft:copper_block')
    event.recipes.create.splashing('minecraft:waxed_weathered_copper', 'minecraft:waxed_copper_block')

    // 黄铜溶液
    event.recipes.create.mixing(Fluid.of("rainbow:brass_fluid", 1000), ["create:brass_block"]).heated()

    // 铜溶液
    event.recipes.create.mixing(Fluid.of("rainbow:copper_fluid", 1000), ['minecraft:copper_block']).heated()

    // 710元素 (原油)
    event.recipes.create.mixing(Fluid.of("createdieselgenerators:crude_oil", 250), ["5x rainbow:shit"]).heated()

    // 黄铜块制作
    event.recipes.create.mixing("2x create:brass_block", ["create:zinc_block", "minecraft:copper_block"]).heated()

    // 青金石
    event.recipes.create.filling('minecraft:lapis_lazuli', [Fluid.of("create_enchantment_industry:experience", 200), 'oreganized:refined_asbestos'])

    // 超经验配方
    event.remove({ id: 'create_enchantment_industry:mixing/hyper_experience' })
    event.recipes.create.mixing(Fluid.of("create_enchantment_industry:hyper_experience", 100), ['#rainbow:oldbook', 'minecraft:lapis_lazuli', Fluid.of("create_enchantment_industry:experience", 1000)]).superheated()

    // SFM电脑配方
    event.replaceInput({input:"minecraft:repeater"},"minecraft:repeater",'rainbow:super_mechanism');

    // 灵魂粉加工
    const list = ['alexsmobs:skreecher_soul', 'netherexp:wraithing_lesion', 'netherexp:wraithing_flesh', 'netherexp:banshee_rod', 'netherexp:banshee_powder', 'quark:soul_bead', 'netherexp:phasmo_shard', 'netherexp:soul_magma_block']
    const value = [32, 64, 4, 3, 1, 16, 4, 4]
    list.forEach((item, index) => {
        event.recipes.create.mixing(`${value[index]}x hmag:soul_powder`, [item, Fluid.of("netherexp:ectoplasm", 250)])
    })
    event.recipes.create.mixing(['8x hmag:soul_powder', 'minecraft:glass_bottle'], ['netherexp:wisp_bottle', Fluid.of("netherexp:ectoplasm", 250)])

    const list2 = ['hmag:repulsion_gadget', 'hmag:fortune_crystal_plus', 'hmag:fortune_crystal', 'hmag:greedy_crystal_plus', 'hmag:greedy_crystal', 'hmag:honeyed_apple', 'hmag:evil_thorn', 'hmag:evil_prismarine', 'hmag:evil_flame', Item.of('hmag:insomnia_fruit', '{hmag.level:1b}'), 'hmag:soul_apple', 'hmag:randomberry', 'hmag:copper_nugget', 'hmag:reinforcing_chain', 'hmag:multiplex_reinforcing_chain']
    list2.forEach(item => {
        event.remove({ output: item })
    })


    const corundoms = ['quark:red_corundum_cluster', 'quark:orange_corundum_cluster', 'quark:yellow_corundum_cluster', 'quark:green_corundum_cluster', 'quark:blue_corundum_cluster', 'quark:indigo_corundum_cluster', 'quark:violet_corundum_cluster', 'quark:white_corundum_cluster', 'quark:black_corundum_cluster']
    const creates = ['create:veridium', 'create:scorchia', 'create:scoria', 'create:ochrum', 'create:limestone', 'create:asurine', 'create:crimsite', 'quark:myalite', 'quark:dusky_myalite', 'minecraft:basalt', 'quark:limestone', 'oreganized:glance']
    // 刚玉合成七彩石
    event.shapeless('9x rainbow:rainbow_stone', corundoms)
    // 七彩石合成对应材料
    creates.forEach(item => {
        event.recipes.create.mixing(Item.of(item, 64), [item, "rainbow:rainbow_stone", Fluid.of("minecraft:lava", 1000)])
    })
    // 逻辑数字合成
    const Numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    const Operaror = ['plus', 'minus', 'multiply', 'divide']
    const NumbersM = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    Numbers.forEach(num1 => {
        Operaror.forEach(op => {
            NumbersM.forEach(num2 => {
                const result = StringNumerOperaror(num1, op, num2);
                if (NumberisOk(result)) {
                    const Item1 = `rainbow:${num1}`;
                    const Result = `rainbow:${NumberToItem(result)}`;
                    const Op = `rainbow:${op}`;
                    const Item2 = `rainbow:${num2}`;
                    event.shaped(Result, [Item1, Op, Item2]);
                } else {
                    const Item1 = `rainbow:${num1}`;
                    const Op = `rainbow:${op}`;
                    const Item2 = `rainbow:${num2}`;
                    event.shaped("rainbow:missingno", [Item1, Op, Item2]);
                }
            });
        });
    });

})
// 斩切刀配方事件
ServerEvents.recipes(event => {
    // 移除原有的斩切刀合成配方
    const cleavers = [
        "dungeonsdelight:flint_cleaver",
        "dungeonsdelight:iron_cleaver",
        "dungeonsdelight:diamond_cleaver",
        "dungeonsdelight:netherite_cleaver",
        "dungeonsdelight:golden_cleaver",
        "dungeonsdelight:stained_cleaver"
    ];
    cleavers.forEach(item => {
        event.remove({ id: item }); // [6](@ref)
    });

    // 创建新的锻造升级模板配方（工作台合成）
    event.shaped(Item.of('rainbow:cleaver_upgrade', 2), [ // [3](@ref)
        ['minecraft:diamond', 'rainbow:cleaver_upgrade', 'minecraft:diamond'],
        ['minecraft:diamond', 'dungeonsdelight:stained_scrap', 'minecraft:diamond'],
        ['minecraft:diamond', 'minecraft:diamond', 'minecraft:diamond']
    ]);

    // 定义升级映射：刀 -> 对应的斩切刀
    const knifeToCleaverMap = {
        'farmersdelight:flint_knife': 'dungeonsdelight:flint_cleaver',
        'farmersdelight:iron_knife': 'dungeonsdelight:iron_cleaver',
        'farmersdelight:diamond_knife': 'dungeonsdelight:diamond_cleaver',
        'farmersdelight:netherite_knife': 'dungeonsdelight:netherite_cleaver',
        'farmersdelight:golden_knife': 'dungeonsdelight:golden_cleaver',
        'dungeonsdelight:stained_knife': 'dungeonsdelight:stained_cleaver'
    };

    // 定义每种刀升级所需的材料
    const upgradeMaterials = {
        'farmersdelight:flint_knife': 'minecraft:flint',
        'farmersdelight:iron_knife': 'minecraft:iron_ingot',
        'farmersdelight:diamond_knife': 'minecraft:diamond',
        'farmersdelight:netherite_knife': 'minecraft:netherite_ingot',
        'farmersdelight:golden_knife': 'minecraft:gold_ingot',
        'dungeonsdelight:stained_knife': 'dungeonsdelight:stained_scrap'
    };

    // 为每一种刀创建锻造台升级配方
    Object.keys(knifeToCleaverMap).forEach(knifeId => {
        const baseItem = knifeId; // 基础的刀
        const additionItem = upgradeMaterials[knifeId]; // 升级材料
        const resultItem = knifeToCleaverMap[knifeId]; // 升级后的斩切刀
        const templateItem = 'rainbow:cleaver_upgrade'; // 锻造模板

        // 使用 Smithing 配方类型
        event.custom({
            type: 'minecraft:smithing_transform', // [6,8](@ref)
            base: Ingredient.of(baseItem).toJson(),
            addition: Ingredient.of(additionItem).toJson(),
            template: Ingredient.of(templateItem).toJson(),
            result: Item.of(resultItem).toJson()
        });
    });

    //灵脂蜡块
    event.custom({
        "type":"lychee:item_inside",
        "item_in": { "item": "netherexp:ancient_wax_block" },
        "block_in": { "blocks": ["netherexp:ectoplasm"] },
        "post":  {  "type": "drop_item",  "item": "rainbow:soul_hex_block"}
    })
});

// 光源方块合成 - 使用循环优化
ServerEvents.recipes(event => {
    // 使用火把合成亮度等级 1-9
    for (let level = 1; level <= 9; level++) {
        event.shapeless(
            Item.of('minecraft:light', `{BlockStateTag:{level:"${level}"}}`), // 输出物品及其 NBT 数据
            `${level}x minecraft:torch` // 输入材料
        ).id(`kubejs:light_${level}_manual_only`); // 配方 ID
    }

    // 使用灯笼合成亮度等级 10-15
    // 注意：亮度等级10需要1个灯笼，11需要2个，以此类推，所以循环变量与灯笼数量的关系是 lanternCount = level - 9
    for (let level = 10; level <= 15; level++) {
        let lanternCount = level - 9; // 计算所需的灯笼数量
        event.shapeless(
            Item.of('minecraft:light', `{BlockStateTag:{level:"${level}"}}`), // 输出物品及其 NBT 数据
            `${lanternCount}x minecraft:lantern` // 输入材料
        ).id(`kubejs:light_${level}_manual_only`); // 配方 ID
    }
});

// 物品同化表（只要在这里写数组即可）
// AofB[x] 代表一组互相可转化的物品
const AofB_A = ['alexsmobs:flying_fish','collectorsreap:pomegranate']
const AofB_B = ['tome_of_wonders:flying_fish','fruitfulfun:pomegranate']

ServerEvents.recipes(event => {
    for(let i=0;i<AofB_A.length;i++)
        {
            event.shapeless(AofB_A[i],AofB_B[i])
            event.shapeless(AofB_B[i],AofB_A[i])
        }
});


