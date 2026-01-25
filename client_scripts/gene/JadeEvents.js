// priority: 0
// ==========================================
// 🧬 基因矩阵 Jade 提示
// ==========================================

const $LivingEntity = Java.loadClass('net.minecraft.world.entity.LivingEntity')

// 配置映射，需与 server_scripts 保持一致
const GeneDisplayName = {
    'hormone_0': '护甲值',
    'hormone_1': '攻击伤害',
    'hormone_2': '击退',
    'hormone_3': '盔甲穿透',
    'hormone_4': '击退抗性',
    'hormone_5': '最大生命值',
    'hormone_6': '速度',
    'hormone_7': '弹射物伤害',
    'hormone_8': '冰霜伤害',
    'hormone_9': '魔法伤害',
    'hormone_10': '抛射物伤害',
    'hormone_11': '爆炸伤害'
}

JadeEvents.onClientRegistration((event) => {
    
    // 显示九龙加成
    // 监听所有 LivingEntity，因为激素可以应用给任何生物
    // 参数1: 唯一的 Provider ID (命名空间:ID)
    // 参数2: 目标实体类
    event.entity('gene:hormone_bonuses', $LivingEntity).tooltip((tooltip, accessor, pluginConfig) => {
        let {serverData} = accessor;
        if (!serverData || !serverData.contains('KowloonBonuses')) return;
        
        let bonuses = serverData.get('KowloonBonuses');
        let limits = serverData.contains('KowloonLimits') ? serverData.get('KowloonLimits') : null;
        let colors = serverData.contains('KowloonColors') ? serverData.get('KowloonColors') : null;
        
        let keys = bonuses.getAllKeys(); // Set<String>
        
        if (keys && !keys.isEmpty()) {
            tooltip.add(Text.darkPurple('=== 九龙加成 ==='));
            
            // 转换为数组并排序，确保显示顺序一致
            let sortedKeys = keys.stream().sorted().toList();
            
            sortedKeys.forEach(key => {
                let amount = bonuses.getDouble(key);
                
                // 忽略几乎为0的加成
                if (Math.abs(amount) < 0.001) return;

                let name = GeneDisplayName[key] || key;
                
                // 格式化数值，保留1位小数
                let amountStr = amount.toFixed(1);
                if (amount > 0) amountStr = "+" + amountStr;
                
                // 获取上限
                let maxStr = "";
                if (limits && limits.contains(key)) {
                    maxStr = ` / ${limits.getDouble(key).toFixed(1)}`;
                }
                
                // 构建基础文本
                let displayText = Text.literal(`${name}: ${amountStr}${maxStr}`);
                
                // 应用颜色
                if (colors && colors.contains(key)) {
                    // 获取颜色名称 (e.g. "RED", "GOLD")
                    let colorName = colors.getString(key);
                    try {
                        // 尝试使用预定义颜色
                        displayText.withStyle(colorName.toLowerCase());
                    } catch (e) {
                        // 默认颜色
                        displayText.lightPurple();
                    }
                } else {
                    // 默认颜色
                    displayText.lightPurple();
                }
                
                tooltip.add(displayText);
            });
        }
    });
});
