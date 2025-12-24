
/**
 * 注册合成配方
 */
ServerEvents.recipes(event => {
    // 宠物精华合成配方
    event.shaped('rainbow:pet_essence', [
        'ABA',
        'CDC',
        'ABA'
    ], {
        A: 'minecraft:bone',
        B: 'minecraft:rotten_flesh',
        C: 'minecraft:spider_eye',
        D: 'minecraft:fermented_spider_eye'
    });
    
    // 野性水晶合成配方
    event.shaped('rainbow:wild_crystal', [
        'EAE',
        'ADA',
        'EAE'
    ], {
        A: 'rainbow:pet_essence',
        D: 'minecraft:diamond',
        E: 'minecraft:emerald'
    });
    
    // 忠诚宝石合成配方
    event.shaped('rainbow:loyalty_gem', [
        'CAC',
        'ADA',
        'CAC'
    ], {
        A: 'rainbow:wild_crystal',
        C: 'minecraft:crying_obsidian',
        D: 'minecraft:netherite_ingot'
    });
    
    // 生命结晶合成配方
    event.shaped('rainbow:life_crystal', [
        'GAG',
        'ADA',
        'GAG'
    ], {
        A: 'rainbow:loyalty_gem',
        D: 'minecraft:dragon_egg',
        G: 'minecraft:golden_apple'
    });
    
    // 守护者吊坠合成配方
    event.shaped('rainbow:guardian_pendant', [
        'SAS',
        'AEA',
        'SAS'
    ], {
        A: 'rainbow:pet_essence',
        E: 'minecraft:emerald',
        S: 'minecraft:string'
    });
    
    // 宠物力量护符合成配方
    event.shaped('rainbow:pet_strength_charm', [
        'IAI',
        'AEA',
        'IAI'
    ], {
        A: 'rainbow:pet_essence',
        E: 'rainbow:wild_crystal',
        I: 'minecraft:iron_ingot'
    });
    
    // 疾风之靴合成配方
    event.shaped('rainbow:speed_boots', [
        'A A',
        'AEA',
        'F F'
    ], {
        A: 'rainbow:pet_essence',
        E: 'minecraft:emerald',
        F: 'minecraft:feather'
    });
    
    // 再生核心合成配方
    event.shaped('rainbow:regeneration_core', [
        'GAG',
        'AEA',
        'GAG'
    ], {
        A: 'rainbow:pet_essence',
        E: 'rainbow:wild_crystal',
        G: 'minecraft:ghast_tear'
    });
    
    // 野性之心合成配方
    event.shaped('rainbow:wild_heart', [
        'CAC',
        'AEA',
        'CAC'
    ], {
        A: 'rainbow:wild_crystal',
        E: 'rainbow:loyalty_gem',
        C: 'minecraft:blaze_powder'
    });
    
    // 元素护符合成配方
    event.shaped('rainbow:elemental_amulet', [
        'WLF',
        'AEA',
        'WLF'
    ], {
        A: 'rainbow:pet_essence',
        E: 'rainbow:wild_crystal',
        W: 'minecraft:water_bucket',
        L: 'minecraft:lava_bucket',
        F: 'minecraft:fire_charge'
    });
    
    // 猎手徽章合成配方
    event.shaped('rainbow:hunter_badge', [
        'BAB',
        'AEA',
        'BAB'
    ], {
        A: 'rainbow:wild_crystal',
        E: 'rainbow:loyalty_gem',
        B: 'minecraft:bow'
    });
    
    // 忠诚之戒合成配方
    event.shaped('rainbow:loyalty_ring', [
        'GAG',
        'AEA',
        'GAG'
    ], {
        A: 'rainbow:loyalty_gem',
        E: 'rainbow:life_crystal',
        G: 'minecraft:gold_ingot'
    });
    
    // 召唤师法杖合成配方
    event.shaped('rainbow:summoner_staff', [
        '  E',
        ' S ',
        'S  '
    ], {
        E: 'rainbow:life_crystal',
        S: 'minecraft:stick'
    });
    
    // 生命之源合成配方
    event.shaped('rainbow:life_source', [
        'EAE',
        'ACA',
        'EAE'
    ], {
        A: 'rainbow:loyalty_gem',
        C: 'rainbow:life_crystal',
        E: 'minecraft:end_crystal'
    });
    
    console.log('[宠物增强系统] 已注册14个合成配方');
});

/**
 * 注册战利品表 - 在特定生物死亡时掉落制作材料
 */
LootJS.modifiers(event => {
    // 宠物精华掉落
    event.addEntityLootModifier('minecraft:wolf')
        .randomChance(0.1)  // 10%几率
        .addLoot('rainbow:pet_essence');
    
    event.addEntityLootModifier('minecraft:cat')
        .randomChance(0.1)
        .addLoot('rainbow:pet_essence');
    
    event.addEntityLootModifier('minecraft:horse')
        .randomChance(0.15)  // 马类掉落几率稍高
        .addLoot('rainbow:pet_essence');
    
    event.addEntityLootModifier('minecraft:parrot')
        .randomChance(0.08)
        .addLoot('rainbow:pet_essence');
    
    // 野性水晶掉落（稀有生物）
    event.addEntityLootModifier('minecraft:wither')
        .randomChance(0.5)
        .addLoot('rainbow:wild_crystal');
    
    event.addEntityLootModifier('minecraft:ender_dragon')
        .randomChance(1.0)  // 100%掉落
        .addLoot('rainbow:wild_crystal')
        .addLoot('rainbow:loyalty_gem');
    
    // 忠诚宝石掉落（Boss级生物）
    event.addEntityLootModifier('minecraft:elder_guardian')
        .randomChance(0.3)
        .addLoot('rainbow:loyalty_gem');
    
    // 生命结晶掉落（终极Boss）
    event.addEntityLootModifier('minecraft:warden')
        .randomChance(0.2)
        .addLoot('rainbow:life_crystal');
    
    console.log('[宠物增强系统] 已配置战利品表掉落');
});

/**
 * 物品使用事件处理
 */
ItemEvents.rightClicked(event => {
    let player = event.player;
    let item = event.item;
    
    // 处理饰品的右键激活
    if (item.id.startsWith('rainbow:') && item.hasTag('curios:curio')) {
        // 检查是否需要主动激活
        let needsActivation = [
            'rainbow:wild_heart',
            'rainbow:hunter_badge',
            'rainbow:summoner_staff'
        ];
        
        if (needsActivation.includes(item.id)) {
            // 发送网络事件到服务器
            player.server.runCommandSilent(
                `kubejs network_event petEnhancementSkill {player:"${player.uuid}",action:"activate",itemId:"${item.id}"}`
            );
            
            player.tell(`§a[宠物增强] §f尝试激活 ${item.displayName.getString()}`);
            event.cancel();
        }
    }
});