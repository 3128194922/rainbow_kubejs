// priority: 500
// ==========================================
// 🏷️ 标签注册脚本
// ==========================================

ServerEvents.tags("item", event => {
    // 特殊增加：将所有食物加入 rainbow:food
    global.foodlist.forEach(food=>{
        event.add("rainbow:food",food)
    })
    
    // 饰品相关标签
    event.add("curios:charm",['create:copper_backtank', 'create:netherite_backtank','royalvariations:royal_staff'])
    event.add('rainbow:venison',['youkaisfeasts:raw_venison','environmental:venison'])
    event.add('rainbow:democracy',['gimmethat:democracy_helmet','gimmethat:democracy_boots','gimmethat:democracy_chestplate','gimmethat:democracy_leggings'])
    
    // 技能饰品
    event.add('rainbow:skill_charm',['rainbow:monster_charm', 'rainbow:rage_syringe', 'rainbow:resilience_syringe', 'rainbow:drowned_heart', 
    'rainbow:frozen_heart', 'rainbow:gritty_heart', 'rainbow:gunk_heart', 'rainbow:rotten_heart','rainbow:chronos','rainbow:phantom_body',
    'rainbow:beacon_ball','royalvariations:royal_staff','rainbow:reload_core','rainbow:short_core'])
    
    // 批量添加饰品标签 (护符/项链/手镯等)
    retagItem(event,["chromaticarsenal:thunderguard", "chromaticarsenal:advancing_heart", "chromaticarsenal:glass_shield",
     "chromaticarsenal:golden_heart",'chromaticarsenal:vital_stone', 'chromaticarsenal:ascended_star', 'chromaticarsenal:harpy_feather',
      'chromaticarsenal:viewer_item','chromaticarsenal:momentum_stone', 'chromaticarsenal:bubble_amulet', 'chromaticarsenal:duality_rings',
       'chromaticarsenal:cryo_ring', 'chromaticarsenal:copper_ring', 'chromaticarsenal:amethyst_ring','rainbow:ice_tea','gimmethat:gravity_core',
       'gimmethat:giants_ring','gimmethat:plastic_drinking_hat','gimmethat:moai_charm','artifacts:charm_of_sinking', 'artifacts:thorn_pendant', 
       'artifacts:flame_pendant', 'artifacts:shock_pendant', 'artifacts:panic_necklace', 'artifacts:scarf_of_invisibility', 'artifacts:lucky_scarf',
        'artifacts:cross_necklace', 'artifacts:whoopee_cushion', 'artifacts:chorus_totem', 'artifacts:helium_flamingo', 'artifacts:crystal_heart',
         'artifacts:universal_attractor', 'artifacts:antidote_vessel', 'artifacts:obsidian_skull', 'artifacts:cloud_in_a_bottle','artifacts:aqua_dashers', 
         'artifacts:bunny_hoppers', 'artifacts:kitty_slippers', 'artifacts:running_shoes', 'artifacts:snowshoes', 'artifacts:steadfast_spikes', 
         'artifacts:flippers', 'artifacts:rooted_boots', 'artifacts:pickaxe_heater', 'artifacts:onion_ring', 'artifacts:golden_hook', 
         'artifacts:vampiric_glove', 'artifacts:pocket_piston', 'artifacts:fire_gauntlet', 'artifacts:power_glove', 'artifacts:feral_claws',
          'artifacts:digging_claws'],
       "curios:charm")
/*
    // 铁魔法书饰品标签
    retagItem(event,['irons_spellbooks:poisonward_ring', 'irons_spellbooks:frostward_ring', 'irons_spellbooks:emerald_stoneplate_ring',
    'irons_spellbooks:fireward_ring', 'irons_spellbooks:heavy_chain_necklace', 'irons_spellbooks:silver_ring', 'irons_spellbooks:cooldown_ring', 
    'irons_spellbooks:cast_time_ring', 'irons_spellbooks:mana_ring', 'irons_spellbooks:amethyst_resonance_charm', 
    'irons_spellbooks:concentration_amulet', 'irons_spellbooks:affinity_ring', 'irons_spellbooks:conjurers_talisman'],
        ["curios:charm",'irons_spellbooks:salvageable_curio'])

    // 清除铁魔法书的默认标签（可能是为了重新分类）
    const irons_spellbooks = [
        "irons_spellbooks:rotten_spell_book",
        "irons_spellbooks:necronomicon_spell_book",
        "irons_spellbooks:evoker_spell_book",
        "irons_spellbooks:copper_spell_book",
        "irons_spellbooks:iron_spell_book",
        "irons_spellbooks:gold_spell_book",
        "irons_spellbooks:diamond_spell_book",
        "irons_spellbooks:netherite_spell_book",
        "irons_spellbooks:blaze_spell_book",
        "irons_spellbooks:druidic_spell_book",
        "irons_spellbooks:villager_spell_book",
        "irons_spellbooks:dragonskin_spell_book"
    ].forEach(item=>{
        event.removeAllTagsFrom(item)
    })*/

    // 背部饰品标签
    retagItem(event,['minecraft:tnt', 'oreganized:shrapnel_bomb', 'savage_and_ravage:spore_bomb', 'minecraft:end_rod','alexscaves:nuclear_bomb'],
        "curios:back"
    )
    
    // 头部饰品标签
    retagItem(event,['farmersdelight:skillet', 'rainbow:eldritch_pan', 'dungeonsdelight:golden_cleaver', 'farmersdelight:basket'],
        "curios:head")
    
    // 箭矢标签
    event.add("minecraft:arrows", ['rainbow:frost_arrow', 'oreganized:lead_bolt', 'rainbow:tnt_arrow', "rainbow:toxic_arrow", "gimmethat:slime_arrow", "gimmethat:nether_of_voice", "gimmethat:airburst_arrow"])
    
    // 怪肉类食物标签
    event.add('rainbow:monster_meat', [
        'rainbow:flesh'
    ])

    // 古籍标签
    event.add("rainbow:oldbook", ['quark:ancient_tome'])

    // 自动提示标签
    event.add('rainbow:food_tooltip', [
        'collectorsreap:portobello_quiche_slice',
        'collectorsreap:portobello_burger',
        'atmospheric:yucca_fruit',
        'dungeonsdelight:sculk_dogapple',
        'dungeonsdelight:sculk_apple',
        'dungeonsdelight:sculk_catblueberry',
        'dungeonsdelight:sculk_mayo'
    ])
    
    // 回旋镖标签
    event.add("rainbow:pika", ["quark:pickarang","quark:flamerang"])
    
    // 旗帜作为背部饰品
    event.add("curios:back", ['minecraft:white_banner', 'minecraft:light_gray_banner', 'minecraft:gray_banner', 'minecraft:black_banner', 'minecraft:brown_banner', 'minecraft:red_banner', 'minecraft:orange_banner', 'minecraft:yellow_banner', 'minecraft:lime_banner', 'minecraft:green_banner', 'minecraft:cyan_banner', 'minecraft:light_blue_banner', 'minecraft:blue_banner', 'minecraft:purple_banner', 'minecraft:magenta_banner', 'minecraft:pink_banner'])

    //event.add("rainbow:heart", ['rainbow:drowned_heart', 'rainbow:frozen_heart', 'rainbow:gritty_heart', 'rainbow:gunk_heart', 'rainbow:rotten_heart'])
})

ServerEvents.tags("block", event => {
    // 骑乘存储箱子
    event.add("create:chest_mounted_storage", ['quark:acacia_chest', 'quark:jungle_chest', 'quark:birch_chest', 'quark:spruce_chest', 'quark:oak_chest', 'quark:blossom_chest', 'quark:azalea_chest', 'quark:ancient_chest', 'quark:prismarine_chest', 'quark:purpur_chest', 'quark:nether_brick_chest', 'quark:cherry_chest', 'quark:bamboo_chest', 'quark:mangrove_chest', 'quark:warped_chest', 'quark:crimson_chest', 'quark:dark_oak_chest', 'createutilities:void_chest'])
    
    // 可替换的虚空矿石
    event.add('rainbow:void_ore_replaceable',['minecraft:end_stone'])
    
    // 考古方块标签
    event.add('rainbow:archaeology',['minecraft:suspicious_sand', 'atmospheric:suspicious_arid_sand', 'atmospheric:suspicious_red_arid_sand', 'minecraft:suspicious_gravel', 'netherexp:suspicious_soul_sand', 'species:red_suspicious_sand'])
    
    // 刚玉簇
    event.add("rainbow:corundum_cluster",['quark:red_corundum_cluster', 'quark:orange_corundum_cluster', 'quark:yellow_corundum_cluster', 'quark:green_corundum_cluster', 'quark:blue_corundum_cluster', 'quark:indigo_corundum_cluster', 'quark:violet_corundum_cluster', 'quark:white_corundum_cluster', 'quark:black_corundum_cluster'])
})

ServerEvents.tags("worldgen/biome", event => {

})

