// priority: 100

// 配置
const GeneConfig = {
    // 属性配置 (ID -> 属性定义)
    attributes: {
        'hormone_0': { attribute: 'minecraft:generic.armor', amount: 1.0, operation: 'addition', displayName: '护甲值' },
        'hormone_1': { attribute: 'minecraft:generic.attack_damage', amount: 1.0, operation: 'addition', displayName: '攻击伤害' },
        'hormone_2': { attribute: 'minecraft:generic.attack_knockback', amount: 0.5, operation: 'addition', displayName: '击退' },
        'hormone_3': { attribute: 'attributeslib:armor_pierce', amount: 1.0, operation: 'addition', displayName: '盔甲穿透' },
        'hormone_4': { attribute: 'minecraft:generic.knockback_resistance', amount: 0.1, operation: 'addition', displayName: '击退抗性' },
        'hormone_5': { attribute: 'minecraft:generic.max_health', amount: 2.0, operation: 'addition', displayName: '最大生命值' },
        'hormone_6': { attribute: 'minecraft:generic.movement_speed', amount: 0.02, operation: 'addition', displayName: '速度' },
        'hormone_7': { attribute: 'attributeslib:arrow_damage', amount: 1.0, operation: 'addition', displayName: '弹射物伤害' },
        'hormone_8': { attribute: 'attributeslib:cold_damage', amount: 1.0, operation: 'addition', displayName: '冰霜伤害' },
        'hormone_9': { attribute: 'rainbow:generic.magic_damage', amount: 1.0, operation: 'addition', displayName: '魔法伤害' },
        'hormone_10': { attribute: 'rainbow:generic.thrown_damage', amount: 1.0, operation: 'addition', displayName: '抛射物伤害' },
        'hormone_11': { attribute: 'rainbow:generic.boom_damage', amount: 1.0, operation: 'addition', displayName: '爆炸伤害' },
        'hormone_12': { attribute: 'gimmethat:size_scale', amount: 1.0, operation: 'addition', displayName: '实体大小' }
    },
    
    // 全局默认上限 (属性ID -> 最大加成值)
    defaultLimits: {
        'minecraft:generic.armor': 20.0,
        'minecraft:generic.attack_damage': 20.0,
        'minecraft:generic.attack_knockback': 5.0,
        'attributeslib:armor_pierce': 5.0,
        'minecraft:generic.knockback_resistance': 0.5,
        'minecraft:generic.max_health': 100.0,
        'minecraft:generic.movement_speed': 0.5,
        'attributeslib:arrow_damage': 1.5,
        'attributeslib:cold_damage': 5.0,
        'rainbow:generic.magic_damage': 1.5,
        'rainbow:generic.thrown_damage': 1.5,
        'rainbow:generic.boom_damage': 1.5,
        'gimmethat:size_scale': 1.5
    },

    // 生物适配性配置 (生物ID -> { 属性ID -> { max: 上限, color: 颜色代码 } })
    // 颜色代码参考: https://minecraft.fandom.com/wiki/Formatting_codes (如 'GOLD', 'RED', 'AQUA')
    adaptability: {
        'minecraft:wolf': {
            'minecraft:generic.attack_damage': { max: 50.0, color: 'DARK_RED' }
        },
    }
}

// 交互事件
ItemEvents.entityInteracted(event => {
    const { item, target, player, level, hand } = event
    
    // 支持 rainbow 命名空间
    if (!item.id.startsWith('rainbow:hormone_')) return
    
    const hormoneId = item.id.split(':')[1]
    const config = GeneConfig.attributes[hormoneId]
    
    if (!config) return
    
    // 关键修正：必须同时检查是否是客户端，以及是否是主手，并取消事件以防止原版交互（如坐下）
    if (hand != 'MAIN_HAND') return; // 只允许主手交互
    
    if (level.isClientSide()) {
        // 客户端也需要 cancel 以防止预测的交互（如坐下动画）
        event.cancel()
        return
    }
    
    if (!target.isLiving()) return
    
    let attribute = target.getAttribute(config.attribute)
    if (attribute) {
        
        // 1. 计算该生物对该属性的上限
        let maxLimit = GeneConfig.defaultLimits[config.attribute] || 100.0; // 默认兜底
        let adaptabilityConfig = null;
        
        let entityType = target.type; // e.g., "minecraft:zombie"
        if (GeneConfig.adaptability[entityType]) {
            if (GeneConfig.adaptability[entityType][config.attribute]) {
                adaptabilityConfig = GeneConfig.adaptability[entityType][config.attribute];
                maxLimit = adaptabilityConfig.max;
            }
        }

        let op = 0
        if (config.operation === 'multiply_base') op = 1
        else if (config.operation === 'multiply_total') op = 2
        
        // 优化方案：使用固定 UUID
        let uuidStr = `GeneModifier_${hormoneId}`
        let uuid = Java.loadClass('java.util.UUID').nameUUIDFromBytes(Java.loadClass('java.lang.String').valueOf(uuidStr).getBytes())
        let name = `GeneModifier_${hormoneId}`
        
        let currentAmount = 0
        let existingModifier = attribute.getModifier(uuid)
        
        if (existingModifier) {
            // 获取现有值
            currentAmount = existingModifier.amount
            // 移除旧的
            attribute.removeModifier(uuid)
        }
        
        // 2. 检查是否超过上限
        let newAmount = currentAmount + config.amount
        if (newAmount > maxLimit) {
            newAmount = maxLimit; // 封顶
            // 如果已经达到上限（即加成前就已经 >= limit），则提示并退出
            if (currentAmount >= maxLimit) {
                player.tell(Text.red(`该生物的 ${config.displayName} 基因加成已达上限 (${maxLimit})！`));
                // 恢复旧的 modifier (因为前面移除了)
                if (existingModifier) {
                    attribute.addPermanentModifier(existingModifier);
                }
                event.cancel();
                return;
            }
        }
        
        let AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
        let Operation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
        
        let opEnum = op == 0 ? Operation.ADDITION :
                     op == 1 ? Operation.MULTIPLY_BASE :
                     Operation.MULTIPLY_TOTAL
        
        // 使用 new AttributeModifier(...)
        let modifier = new AttributeModifier(uuid, name, newAmount, opEnum)
        
        attribute.addPermanentModifier(modifier)
        
        // 记录九龙加成到实体的 PersistentData (用于 Jade 显示)
        let pData = target.persistentData
        if (!pData.contains('KowloonBonuses')) pData.put('KowloonBonuses', new (Java.loadClass('net.minecraft.nbt.CompoundTag'))())
        let bonuses = pData.get('KowloonBonuses')
        bonuses.putDouble(hormoneId, newAmount)
        
        // 记录上限信息和颜色 (用于 Jade 显示)
        if (!pData.contains('KowloonLimits')) pData.put('KowloonLimits', new (Java.loadClass('net.minecraft.nbt.CompoundTag'))())
        let limits = pData.get('KowloonLimits')
        limits.putDouble(hormoneId, maxLimit)
        
        if (adaptabilityConfig && adaptabilityConfig.color) {
            if (!pData.contains('KowloonColors')) pData.put('KowloonColors', new (Java.loadClass('net.minecraft.nbt.CompoundTag'))())
            let colors = pData.get('KowloonColors')
            colors.putString(hormoneId, adaptabilityConfig.color)
        }

        // 如果是生命值，增加上限后需要回血
        if (config.attribute === 'minecraft:generic.max_health') {
             target.heal(config.amount)
        }
        
        if (!player.isCreative()) {
            item.shrink(1)
        }
        
        player.level.playSound(null, player.x, player.y, player.z, 'minecraft:entity.experience_orb.pickup',"voice", 1.0, 1.0)
        // 成功应用后，取消事件以阻止后续的原版交互
        event.cancel()
    }
})

// 【前端变前台，后端变后厨，python送到家，Java炒米粉】
