// priority: 500
// 饰品宠物增强体系 - 宠物伤害增强模块

/**
 * 监听实体受伤事件，为装备相应饰品的玩家的宠物增加攻击伤害
 */
EntityEvents.hurt(event => {
    let attacker = event.source.actual;
    let victim = event.entity;
    
    // 确保攻击者存在且为生物实体
    if (!attacker || !attacker.isLiving()) return;
    
    // 检查攻击者是否为宠物
    if (!global.PetEnhancementConfig.utils.isSupportedPet(attacker)) return;
    
    // 查找宠物的主人
    let owner = null;
    if (attacker.persistentData && attacker.persistentData.OwnerName) {
        owner = event.server.getPlayer(attacker.persistentData.OwnerName);
    } else if (attacker.isOwnedBy) {
        // 对于原版驯服动物，尝试找到主人
        let players = event.server.getPlayers();
        for (let player of players) {
            if (attacker.isOwnedBy(player)) {
                owner = player;
                break;
            }
        }
    }
    
    if (!owner) return;
    
    // 检查主人是否在合理范围内
    if (owner.distanceToEntity(attacker) > 64) return;
    
    let originalDamage = event.damage;
    let totalDamageMultiplier = 1.0;
    let hasEnhancement = false;
    
    // 遍历伤害增强配置
    Object.entries(global.PetEnhancementConfig.damageEnhancement).forEach(([itemId, config]) => {
        // 检查玩家是否装备了该饰品
        if (!hasCurios(owner, itemId)) return;
        
        // 检查是否需要主动激活
        if (config.needsActivation) {
            if (!global.PetEnhancementConfig.utils.isActiveSkillActive(owner, itemId)) {
                return;
            }
        }
        
        // 应用伤害倍数
        totalDamageMultiplier *= config.damageMultiplier;
        hasEnhancement = true;
        
        // 输出调试信息
        console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}使用${itemId}增强伤害: ${originalDamage} -> ${originalDamage * config.damageMultiplier}`);
    });
    
    // 检查特定宠物加成
    Object.entries(global.PetEnhancementConfig.specificPetBonuses).forEach(([itemId, config]) => {
        // 检查玩家是否装备了该饰品
        if (!hasCurios(owner, itemId)) return;
        
        // 检查是否为目标宠物类型
        let isPetMatch = config.targetPets.some(petType => {
            if (petType.endsWith('*')) {
                return attacker.type.startsWith(petType.slice(0, -1));
            }
            return attacker.type === petType;
        });
        
        if (!isPetMatch) return;
        
        // 检查是否需要主动激活
        if (config.needsActivation) {
            if (!global.PetEnhancementConfig.utils.isActiveSkillActive(owner, itemId)) {
                return;
            }
        }
        
        // 应用特定宠物的伤害加成
        if (config.bonuses && config.bonuses.damageMultiplier) {
            totalDamageMultiplier *= config.bonuses.damageMultiplier;
            hasEnhancement = true;
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的${attacker.type}获得特定宠物加成${itemId}: 伤害倍数${config.bonuses.damageMultiplier}`);
        }
    });
    
    // 应用最终伤害
    if (hasEnhancement && totalDamageMultiplier > 1.0) {
        let newDamage = originalDamage * totalDamageMultiplier;
        event.damage = newDamage;
        
        // 在宠物头上显示伤害增强效果
        if (Math.random() < 0.3) {  // 30%概率显示粒子效果
            owner.server.runCommandSilent(
                `execute at ${attacker.getUuid()} run particle minecraft:crit ~ ~1 ~ 0.3 0.3 0.3 0.1 5`
            );
        }
        
        console.log(`[宠物增强] 最终伤害: ${originalDamage} -> ${newDamage} (倍数: ${totalDamageMultiplier})`);
    }
});

/**
 * 为特定宠物应用额外属性加成（生命值、速度等）
 * 在宠物生成或主人装备饰品时触发
 */
function applyPetAttributeBonuses(pet, owner) {
    if (!pet || !owner) return;
    
    Object.entries(global.PetEnhancementConfig.specificPetBonuses).forEach(([itemId, config]) => {
        // 检查玩家是否装备了该饰品
        if (!hasCurios(owner, itemId)) return;
        
        // 检查是否为目标宠物类型
        let isPetMatch = config.targetPets.some(petType => {
            if (petType.endsWith('*')) {
                return pet.type.startsWith(petType.slice(0, -1));
            }
            return pet.type === petType;
        });
        
        if (!isPetMatch) return;
        
        // 检查是否需要主动激活
        if (config.needsActivation) {
            if (!global.PetEnhancementConfig.utils.isActiveSkillActive(owner, itemId)) {
                return;
            }
        }
        
        let bonuses = config.bonuses;
        if (!bonuses) return;
        
        // 应用生命值加成
        if (bonuses.healthBonus && bonuses.healthBonus > 0) {
            let currentMaxHealth = pet.maxHealth;
            let newMaxHealth = currentMaxHealth + bonuses.healthBonus;
            
            // 设置新的最大生命值
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run attribute @s minecraft:generic.max_health modifier add pet_health_bonus 0-0-0-0-1 ${bonuses.healthBonus} add`
            );
            
            // 如果当前生命值低于新的最大值，则恢复到满血
            if (pet.health < newMaxHealth) {
                pet.heal(bonuses.healthBonus);
            }
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的${pet.type}获得生命值加成: +${bonuses.healthBonus}`);
        }
        
        // 应用速度加成
        if (bonuses.speedBonus && bonuses.speedBonus > 0) {
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run attribute @s minecraft:generic.movement_speed modifier add pet_speed_bonus 0-0-0-0-2 ${bonuses.speedBonus} multiply`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的${pet.type}获得速度加成: +${bonuses.speedBonus * 100}%`);
        }
        
        // 应用跳跃加成（主要针对袋鼠）
        if (bonuses.jumpBonus && bonuses.jumpBonus > 0) {
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run effect give @s minecraft:jump_boost 999999 ${Math.floor(bonuses.jumpBonus)} true`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的${pet.type}获得跳跃加成: ${bonuses.jumpBonus}倍`);
        }
        
        // 应用潜行模式（主要针对猫科动物）
        if (bonuses.stealthMode) {
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run effect give @s minecraft:invisibility 999999 0 true`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的${pet.type}获得潜行模式`);
        }
        
        // 应用夜视能力
        if (bonuses.nightVision) {
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run effect give @s minecraft:night_vision 999999 0 true`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的${pet.type}获得夜视能力`);
        }
    });
}

/**
 * 监听宠物生成事件，应用属性加成
 */
EntityEvents.spawned(event => {
    let entity = event.entity;
    
    // 检查是否为支持的宠物类型
    if (!global.PetEnhancementConfig.utils.isSupportedPet(entity)) return;
    
    // 延迟执行，确保宠物的主人信息已设置
    entity.server.scheduleInTicks(20, () => {  // 1秒后执行
        let owner = null;
        
        if (entity.persistentData && entity.persistentData.OwnerName) {
            owner = entity.server.getPlayer(entity.persistentData.OwnerName);
        } else if (entity.isOwnedBy) {
            let players = entity.server.getPlayers();
            for (let player of players) {
                if (entity.isOwnedBy(player)) {
                    owner = player;
                    break;
                }
            }
        }
        
        if (owner) {
            applyPetAttributeBonuses(entity, owner);
        }
    });
});

/**
 * 定期检查并更新宠物的属性加成（每30秒）
 * 用于处理玩家更换饰品的情况
 */
ServerEvents.tick(event => {
    if (event.server.tickCount % 600 !== 0) return;  // 每30秒执行一次
    
    event.server.getPlayers().forEach(player => {
        let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
        
        nearbyPets.forEach(pet => {
            // 清除现有的属性修饰符
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run attribute @s minecraft:generic.max_health modifier remove pet_health_bonus`
            );
            pet.server.runCommandSilent(
                `execute as ${pet.getUuid()} run attribute @s minecraft:generic.movement_speed modifier remove pet_speed_bonus`
            );
            
            // 重新应用属性加成
            applyPetAttributeBonuses(pet, player);
        });
    });
});

console.log('[宠物增强系统] 伤害增强模块已加载');