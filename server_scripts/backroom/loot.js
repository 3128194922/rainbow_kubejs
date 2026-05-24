// priority: 0
// 房间箱子
ServerEvents.genericLootTables(event => {
    //陶片
    const normal_room_items = ['windswept:offshoot_pottery_sherd', 'windswept:flake_pottery_sherd', 'windswept:drupes_pottery_sherd'
    ,'netherexp:sealed_pottery_sherd', 'netherexp:spectre_pottery_sherd', 'netherexp:marionette_pottery_sherd', 'netherexp:eldritch_pottery_sherd',
     'netherexp:deception_pottery_sherd', 'netherexp:firearm_pottery_sherd', 'netherexp:botanical_pottery_sherd', 'windswept:hoot_pottery_sherd', 
     'windswept:plumage_pottery_sherd', 'minecraft:angler_pottery_sherd', 'minecraft:archer_pottery_sherd', 'minecraft:arms_up_pottery_sherd', 
     'minecraft:blade_pottery_sherd', 'minecraft:brewer_pottery_sherd', 'minecraft:burn_pottery_sherd', 'minecraft:danger_pottery_sherd',
      'minecraft:explorer_pottery_sherd', 'minecraft:friend_pottery_sherd', 'minecraft:heart_pottery_sherd', 'minecraft:heartbreak_pottery_sherd',
       'minecraft:howl_pottery_sherd', 'minecraft:miner_pottery_sherd', 'minecraft:mourner_pottery_sherd', 'minecraft:plenty_pottery_sherd', 
       'minecraft:prize_pottery_sherd', 'minecraft:sheaf_pottery_sherd', 'minecraft:shelter_pottery_sherd', 'minecraft:skull_pottery_sherd', 
       'minecraft:snort_pottery_sherd', 'atmospheric:scythe_pottery_sherd', 'atmospheric:succulent_pottery_sherd', 'atmospheric:sun_pottery_sherd',
        'caverns_and_chasms:boom_pottery_sherd', 'caverns_and_chasms:cast_pottery_sherd', 'caverns_and_chasms:ride_pottery_sherd', 
        'caverns_and_chasms:stalker_pottery_sherd']
    //模板
    const template = ['netherexp:pump_charge_upgrade_smithing_template', 'netherexp:rift_armor_trim_smithing_template', 
    'netherexp:spirit_armor_trim_smithing_template', 'netherexp:valor_armor_trim_smithing_template', 
    'oreganized:electrum_upgrade_smithing_template', 'quark:smithing_template_rune', 'rainbow:cleaver_upgrade', 
    'royalvariations:royal_upgrade_smithing_template', 'wetland_whimsy:dots_armor_trim_smithing_template', 
    'minecraft:netherite_upgrade_smithing_template', 'minecraft:sentry_armor_trim_smithing_template', 
    'minecraft:vex_armor_trim_smithing_template', 'minecraft:wild_armor_trim_smithing_template', 
    'minecraft:coast_armor_trim_smithing_template', 'minecraft:dune_armor_trim_smithing_template', 
    'minecraft:wayfinder_armor_trim_smithing_template', 'minecraft:raiser_armor_trim_smithing_template', 
    'minecraft:shaper_armor_trim_smithing_template', 'minecraft:host_armor_trim_smithing_template', 
    'minecraft:ward_armor_trim_smithing_template', 'minecraft:silence_armor_trim_smithing_template', 
    'minecraft:tide_armor_trim_smithing_template', 'minecraft:snout_armor_trim_smithing_template', 
    'minecraft:rib_armor_trim_smithing_template', 'minecraft:eye_armor_trim_smithing_template', 
    'minecraft:spire_armor_trim_smithing_template', 'atmospheric:petrified_armor_trim_smithing_template', 
    'atmospheric:druid_armor_trim_smithing_template', 'atmospheric:apostle_armor_trim_smithing_template', 
    'caverns_and_chasms:trim_modifier_smithing_template', 'caverns_and_chasms:core_armor_trim_smithing_template', 
    'caverns_and_chasms:forger_armor_trim_smithing_template', 'caverns_and_chasms:immolate_armor_trim_smithing_template', 
    'caverns_and_chasms:plate_armor_trim_smithing_template', 'caverns_and_chasms:rim_armor_trim_smithing_template', 
    'caverns_and_chasms:exile_armor_trim_smithing_template']

    //矿物
    const mineral = ['minecraft:amethyst_shard', 'caverns_and_chasms:raw_silver', 'oreganized:raw_silver', 
    'minecraft:raw_gold', 'caverns_and_chasms:raw_tin', 'oreganized:raw_lead', 'minecraft:raw_copper', 
    'minecraft:raw_iron', 'minecraft:charcoal', 'minecraft:coal', 'minecraft:amethyst_shard', 'minecraft:quartz',
     'minecraft:ancient_debris', 'minecraft:diamond', 'caverns_and_chasms:zirconia', 'caverns_and_chasms:turquoise', 
     'caverns_and_chasms:spinel', 'minecraft:lapis_lazuli', 'minecraft:emerald']

    //饰品和武器
    const curios = ['zgmobs:heart_crystal', 'rainbow:gravity_core', 'rainbow:moai_charm', 'rainbow:giants_ring', 
    'rainbow:big_stomach', Item.of('rainbow:lyre', '{submenu:{1:"鼓舞",2:"战曲",3:"小奏",4:"终曲"},the_end:0}'), 
    'rainbow:ancientaegis',Item.of('rainbow:tyrfing', '{Damage:0}'),'scepterofdominion:scepter_of_dominion']
    
    //普通房箱子：食物、矿物
    event.addGeneric('backroom:rooms/normal_room', loot => {
        //食物池
        loot.addPool(pool => {
            pool.addItem('rainbow:tengzou_noodles')
        })
        //矿物池
        loot.addPool(pool => {
            //随机抽取1-5个
            pool.setUniformRolls(1, 3)
            mineral.forEach(item=>{
                pool.addItem(item).count(32)
            })
        })
    })
    //高级房箱子：食物、矿物、陶片
    event.addGeneric('backroom:rooms/advanced_room', loot => {
        //食物池
        loot.addPool(pool => {
            pool.addItem('rainbow:tengzou_noodles')
            pool.addItem('mysticartifacts:rubber')
        })
        //陶片池
        loot.addPool(pool => {
            //随机抽取0-1个
            pool.setUniformRolls(0, 1)
            normal_room_items.forEach(item=>{
                pool.addItem(item)
            })
        })
        //矿物池
        loot.addPool(pool => {
            //随机抽取1-5个
            pool.setUniformRolls(1, 5)
            mineral.forEach(item=>{
                pool.addItem(item).count(32)
            })
        })
    })
    //隐藏房箱子：附魔书、陶片、法术
    event.addGeneric('backroom:rooms/hidden_room', loot => {
        //陶片池
        loot.addPool(pool => {
            //随机抽取1-2个
            pool.setUniformRolls(1, 2)
            normal_room_items.forEach(item=>{
                pool.addItem(item)
            })
        })
        // 附魔池
        loot.addPool(pool => {
            pool.setUniformRolls(1, 5)
            pool.addItem(Item.of('minecraft:book'))
            .enchantRandomly(global.allEnchantments)
        })
    })
    //密码房箱子：各路神器、饰品
    event.addGeneric('backroom:rooms/password_room', loot => {
        //饰品武器
        loot.addPool(pool => {
            //随机抽取1个
            pool.setUniformRolls(1, 1)
            curios.forEach(item=>{
                pool.addItem(item)
            })
        })
    })
    //红房箱子
    /*event.addGeneric('backroom:rooms/red_room', loot => {
        loot.addPool(pool => {
            pool.addItem('youkaishomecoming:flesh_chocolate_mousse')
        })
    })*/
})
