
/**
 * 物品提示信息动态更新
 */
ItemEvents.tooltip(event => {
    // 为宠物增强饰品添加动态提示
    if (event.itemStack.id.startsWith('rainbow:') && event.itemStack.hasTag('curios:curio')) {
        let itemId = event.itemStack.id;
        
        // 添加使用说明
        event.add('§8使用方法:');
        event.add('§8- 装备到对应的饰品槽位');
        event.add('§8- 靠近宠物时自动生效');
        
        // 添加冷却时间信息（如果有）
        let cooldownItems = {
            'rainbow:wild_heart': 300,      // 5分钟
            'rainbow:hunter_badge': 180,    // 3分钟
            'rainbow:summoner_staff': 600   // 10分钟
        };
        
        if (cooldownItems[itemId]) {
            event.add(`§8- 主动技能冷却: ${cooldownItems[itemId]}秒`);
        }
        
        // 添加兼容性信息
        event.add('§8兼容性:');
        event.add('§8- 需要 Curios API 模组');
        event.add('§8- 支持大部分宠物模组');
    }
});

console.log('[宠物增强系统] 物品注册模块已加载');
console.log('[宠物增强系统] 已注册10个饰品物品和4个制作材料');