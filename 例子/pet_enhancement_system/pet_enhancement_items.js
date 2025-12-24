// priority: 100
// 饰品宠物增强体系 - 物品注册模块

/**
 * 注册宠物增强饰品物品
 */
StartupEvents.registry('item', event => {
    // 守护者吊坠 - 提供防护和生命恢复
    event.create('rainbow:guardian_pendant' )
        .displayName('§b守护者吊坠')
        .tooltip('§7装备后为宠物提供抗性和再生效果')
        .tooltip('§7对狗类宠物有额外加成')
        .tooltip('§e右键激活特殊能力')
        .rarity('uncommon')
        .maxStackSize(1)
        .texture('rainbow:item/guardian_pendant')
        .tag('curios:necklace');
    
    // 宠物力量护符 - 增加宠物攻击力
    event.create('rainbow:pet_strength_charm' )
        .displayName('§c宠物力量护符')
        .tooltip('§7大幅增加宠物的攻击伤害')
        .tooltip('§7为宠物攻击附加力量效果')
        .tooltip('§7对狗类宠物提供暴击几率')
        .rarity('rare')
        .maxStackSize(1)
        .texture('rainbow:item/pet_strength_charm')
        .tag('curios:charm');
    
    // 疾风之靴 - 增加移动速度
    event.create('rainbow:speed_boots' )
        .displayName('§a疾风之靴')
        .tooltip('§7为宠物提供速度和跳跃提升')
        .tooltip('§7对不同宠物类型有特殊效果')
        .tooltip('§7袋鼠: 超级跳跃能力')
        .tooltip('§7马: 传说级速度')
        .rarity('uncommon')
        .maxStackSize(1)
        .texture('rainbow:item/speed_boots')
        .tag('curios:feet');
    
    // 再生核心 - 生命恢复和治疗
    event.create('rainbow:regeneration_core' )
        .displayName('§d再生核心')
        .tooltip('§7为宠物提供强力再生效果')
        .tooltip('§7低血量时自动触发紧急治疗')
        .tooltip('§7对猫类宠物有额外治疗加成')
        .rarity('rare')
        .maxStackSize(1)
        .texture('rainbow:item/regeneration_core')
        .tag('curios:body');
    
    // 野性之心 - 综合战斗增强
    event.create('rainbow:wild_heart' )
        .displayName('§6野性之心')
        .tooltip('§7激发宠物的野性本能')
        .tooltip('§7提供力量、速度和抗性')
        .tooltip('§7战斗中额外增强效果')
        .tooltip('§c需要主动激活')
        .rarity('epic')
        .maxStackSize(1)
        .texture('rainbow:item/wild_heart')
        .tag('curios:charm');
    
    // 元素护符 - 环境适应
    event.create('rainbow:elemental_amulet' )
        .displayName('§9元素护符')
        .tooltip('§7为宠物提供环境保护')
        .tooltip('§7火焰抗性、水下呼吸、缓降')
        .tooltip('§7根据环境自动调整保护类型')
        .rarity('rare')
        .maxStackSize(1)
        .texture('rainbow:item/elemental_amulet')
        .tag('curios:necklace');
    
    // 猎手徽章 - 战斗专精
    event.create('rainbow:hunter_badge' )
        .displayName('§8猎手徽章')
        .tooltip('§7提升宠物的战斗能力')
        .tooltip('§7增加暴击几率和攻击速度')
        .tooltip('§7标记附近的敌对生物')
        .tooltip('§c需要主动激活')
        .rarity('epic')
        .maxStackSize(1)
        .texture('rainbow:item/hunter_badge')
        .tag('curios:charm');
    
    // 忠诚之戒 - 宠物忠诚度增强
    event.create('rainbow:loyalty_ring' )
        .displayName('§e忠诚之戒')
        .tooltip('§7增强与宠物的羁绊')
        .tooltip('§7宠物不会受到友军伤害')
        .tooltip('§7提供额外的生命值加成')
        .tooltip('§7死亡时有几率复活宠物')
        .rarity('epic')
        .maxStackSize(1)
        .texture('rainbow:item/loyalty_ring')
        .tag('curios:ring');
    
    // 召唤师法杖 - 召唤和控制
    event.create('rainbow:summoner_staff' )
        .displayName('§5召唤师法杖')
        .tooltip('§7增强召唤和控制能力')
        .tooltip('§7可以同时控制更多宠物')
        .tooltip('§7为所有宠物提供群体buff')
        .tooltip('§c需要主动激活')
        .rarity('epic')
        .maxStackSize(1)
        .texture('rainbow:item/summoner_staff')
        .tag('curios:hands');
    
    // 生命之源 - 终极治疗
    event.create('rainbow:life_source' )
        .displayName('§a生命之源')
        .tooltip('§7终极的生命力增强')
        .tooltip('§7大幅增加宠物最大生命值')
        .tooltip('§7持续的强力再生效果')
        .tooltip('§7免疫大部分负面状态')
        .rarity('epic')
        .maxStackSize(1)
        .texture('rainbow:item/life_source')
        .tag('curios:body');
    
    console.log('[宠物增强系统] 已注册10个宠物增强饰品物品');
});