// priority: 500
// 饰品宠物增强体系 - 宠物buff模块

/**
 * 定期为装备相应饰品的玩家的宠物刷新buff效果
 */
ServerEvents.tick(event => {
    // 每5秒检查一次宠物buff
    if (event.server.tickCount % 100 !== 0) return;
    
    event.server.getPlayers().forEach(player => {
        refreshPetBuffs(player);
    });
});

/**
 * 为玩家的宠物刷新buff效果
 * @param {Internal.Player} player 玩家
 */
function refreshPetBuffs(player) {
    if (!player || !player.isLiving()) return;
    
    // 获取玩家附近的宠物
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    
    if (nearbyPets.length === 0) return;
    
    // 遍历宠物buff配置
    Object.entries(global.PetEnhancementConfig.petBuffs).forEach(([itemId, config]) => {
        // 检查玩家是否装备了该饰品
        if (!hasCurios(player, itemId)) return;
        
        // 检查是否需要主动激活
        if (config.needsActivation) {
            if (!global.PetEnhancementConfig.utils.isActiveSkillActive(player, itemId)) {
                return;
            }
        }
        
        // 为每只宠物应用buff
        nearbyPets.forEach(pet => {
            applyPetBuff(pet, player, itemId, config);
        });
    });
}

/**
 * 为单只宠物应用buff效果
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {string} itemId 饰品ID
 * @param {Object} config 配置
 */
function applyPetBuff(pet, owner, itemId, config) {
    if (!pet || !pet.isLiving() || !config.petEffect) return;
    
    let effectId = config.petEffect;
    let level = config.effectLevel || 0;
    let duration = config.refreshInterval || 100;  // 默认5秒刷新间隔
    
    // 检查宠物是否已有该效果，如果没有或即将过期则重新应用
    let currentEffect = pet.getEffect(effectId);
    if (!currentEffect || currentEffect.duration < 40) {  // 剩余时间少于2秒时刷新
        pet.potionEffects.add(effectId, duration + 40, level, false, false);  // 多给2秒缓冲
        
        // 显示buff刷新粒子（降低频率避免过多粒子）
        if (Math.random() < 0.1) {  // 10%概率显示粒子
            let particleType = getBuffParticleType(effectId);
            owner.server.runCommandSilent(
                `execute at ${pet.getUuid()} run particle ${particleType} ~ ~1 ~ 0.2 0.2 0.2 0.05 3`
            );
        }
        
        console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${pet.type}获得${effectId}效果 (${itemId})`);
    }
}

/**
 * 根据效果类型返回对应的粒子效果
 * @param {string} effectId 效果ID
 * @returns {string} 粒子效果名称
 */
function getBuffParticleType(effectId) {
    const particleMap = {
        'minecraft:resistance': 'minecraft:enchanted_hit',
        'minecraft:speed': 'minecraft:cloud',
        'minecraft:regeneration': 'minecraft:heart',
        'minecraft:strength': 'minecraft:angry_villager',
        'minecraft:fire_resistance': 'minecraft:flame',
        'minecraft:water_breathing': 'minecraft:bubble',
        'minecraft:night_vision': 'minecraft:end_rod',
        'minecraft:invisibility': 'minecraft:mycelium',
        'minecraft:jump_boost': 'minecraft:totem_of_undying',
        'minecraft:absorption': 'minecraft:happy_villager'
    };
    
    return particleMap[effectId] || 'minecraft:enchant';
}

/**
 * 高级宠物buff系统 - 组合效果
 * 当玩家同时装备多个相关饰品时，提供组合加成
 */
ServerEvents.tick(event => {
    // 每10秒检查一次组合效果
    if (event.server.tickCount % 200 !== 0) return;
    
    event.server.getPlayers().forEach(player => {
        checkCombinationBuffs(player);
    });
});

/**
 * 检查并应用组合buff效果
 * @param {Internal.Player} player 玩家
 */
function checkCombinationBuffs(player) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    if (nearbyPets.length === 0) return;
    
    // 守护者套装：抗性提升 + 生命恢复
    if (hasCurios(player, 'rainbow:guardian_pendant') && hasCurios(player, 'rainbow:regeneration_core')) {
        nearbyPets.forEach(pet => {
            pet.potionEffects.add('minecraft:resistance', 220, 2, false, false);  // 提升到III级
            pet.potionEffects.add('minecraft:regeneration', 220, 2, false, false);  // 提升到III级
            
            // 显示组合效果粒子
            if (Math.random() < 0.2) {
                player.server.runCommandSilent(
                    `execute at ${pet.getUuid()} run particle minecraft:totem_of_undying ~ ~1 ~ 0.3 0.3 0.3 0.1 5`
                );
            }
        });
        
        console.log(`[宠物增强] ${player.displayName.getString()}的宠物获得守护者套装组合效果`);
    }
    
    // 战斗大师套装：力量 + 速度 + 抗性
    if (hasCurios(player, 'rainbow:pet_strength_charm') && 
        hasCurios(player, 'rainbow:speed_boots') && 
        hasCurios(player, 'rainbow:guardian_pendant')) {
        
        nearbyPets.forEach(pet => {
            pet.potionEffects.add('minecraft:strength', 220, 1, false, false);
            pet.potionEffects.add('minecraft:speed', 220, 3, false, false);  // 提升到IV级
            pet.potionEffects.add('minecraft:resistance', 220, 1, false, false);
            
            // 显示战斗大师粒子
            if (Math.random() < 0.15) {
                player.server.runCommandSilent(
                    `execute at ${pet.getUuid()} run particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 0.1 8`
                );
            }
        });
        
        console.log(`[宠物增强] ${player.displayName.getString()}的宠物获得战斗大师套装组合效果`);
    }
}

/**
 * 智能buff管理系统
 * 根据宠物的状态和环境自动调整buff效果
 */
ServerEvents.tick(event => {
    // 每15秒进行一次智能调整
    if (event.server.tickCount % 300 !== 0) return;
    
    event.server.getPlayers().forEach(player => {
        adaptiveBuffManagement(player);
    });
});

/**
 * 自适应buff管理
 * @param {Internal.Player} player 玩家
 */
function adaptiveBuffManagement(player) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    
    nearbyPets.forEach(pet => {
        // 检查宠物生命值，低血量时增强恢复效果
        if (pet.health / pet.maxHealth < 0.3) {
            if (hasCurios(player, 'rainbow:regeneration_core') || hasCurios(player, 'rainbow:guardian_pendant')) {
                pet.potionEffects.add('minecraft:regeneration', 200, 3, false, false);  // 紧急恢复
                pet.potionEffects.add('minecraft:resistance', 200, 2, false, false);   // 额外保护
                
                // 显示紧急治疗粒子
                player.server.runCommandSilent(
                    `execute at ${pet.getUuid()} run particle minecraft:heart ~ ~1 ~ 0.5 0.5 0.5 0.1 10`
                );
                
                console.log(`[宠物增强] ${player.displayName.getString()}的宠物${pet.type}生命值过低，启动紧急恢复`);
            }
        }
        
        // 检查环境危险，在危险环境中增强保护
        let dangerousEnvironment = checkEnvironmentalDangers(pet);
        if (dangerousEnvironment.length > 0) {
            applyEnvironmentalProtection(pet, player, dangerousEnvironment);
        }
        
        // 检查战斗状态，在战斗中增强战斗能力
        if (isInCombat(pet)) {
            applyCombatBuffs(pet, player);
        }
    });
}

/**
 * 检查环境危险
 * @param {Internal.Entity} pet 宠物
 * @returns {string[]} 危险类型列表
 */
function checkEnvironmentalDangers(pet) {
    let dangers = [];
    
    // 检查是否在水中
    if (pet.isInWater()) {
        dangers.push('water');
    }
    
    // 检查是否在岩浆中
    if (pet.isInLava()) {
        dangers.push('lava');
    }
    
    // 检查是否在火中
    if (pet.isOnFire()) {
        dangers.push('fire');
    }
    
    // 检查周围是否有敌对生物
    let nearbyEnemies = pet.level.getEntitiesWithin(pet.getBoundingBox().inflate(8))
        .filter(entity => {
            return entity.isLiving() && 
                   entity.isMonster && 
                   entity.distanceToEntity(pet) <= 8;
        });
    
    if (nearbyEnemies.length > 3) {
        dangers.push('surrounded');
    }
    
    return dangers;
}

/**
 * 应用环境保护效果
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {string[]} dangers 危险类型
 */
function applyEnvironmentalProtection(pet, owner, dangers) {
    dangers.forEach(danger => {
        switch (danger) {
            case 'water':
                if (hasCurios(owner, 'rainbow:guardian_pendant')) {
                    pet.potionEffects.add('minecraft:water_breathing', 400, 0, false, false);
                }
                break;
                
            case 'lava':
            case 'fire':
                if (hasCurios(owner, 'rainbow:guardian_pendant')) {
                    pet.potionEffects.add('minecraft:fire_resistance', 400, 0, false, false);
                }
                break;
                
            case 'surrounded':
                if (hasCurios(owner, 'rainbow:speed_boots')) {
                    pet.potionEffects.add('minecraft:speed', 200, 4, false, false);  // 高速逃脱
                }
                if (hasCurios(owner, 'rainbow:guardian_pendant')) {
                    pet.potionEffects.add('minecraft:resistance', 200, 3, false, false);  // 强化防护
                }
                break;
        }
    });
    
    console.log(`[宠物增强] ${owner.displayName.getString()}的宠物获得环境保护: ${dangers.join(', ')}`);
}

/**
 * 检查宠物是否在战斗中
 * @param {Internal.Entity} pet 宠物
 * @returns {boolean}
 */
function isInCombat(pet) {
    // 检查宠物是否有攻击目标
    if (pet.target && pet.target.isLiving()) {
        return true;
    }
    
    // 检查宠物是否最近受到伤害
    if (pet.hurtTime > 0) {
        return true;
    }
    
    // 检查周围是否有正在攻击的敌人
    let nearbyEnemies = pet.level.getEntitiesWithin(pet.getBoundingBox().inflate(6))
        .filter(entity => {
            return entity.isLiving() && 
                   entity.isMonster && 
                   entity.target && 
                   entity.target.getUuid().toString() === pet.getUuid().toString();
        });
    
    return nearbyEnemies.length > 0;
}

/**
 * 应用战斗buff
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 */
function applyCombatBuffs(pet, owner) {
    // 战斗力量增强
    if (hasCurios(owner, 'rainbow:pet_strength_charm')) {
        pet.potionEffects.add('minecraft:strength', 100, 2, false, false);
    }
    
    // 战斗速度增强
    if (hasCurios(owner, 'rainbow:speed_boots')) {
        pet.potionEffects.add('minecraft:speed', 100, 2, false, false);
    }
    
    // 战斗恢复
    if (hasCurios(owner, 'rainbow:regeneration_core')) {
        pet.potionEffects.add('minecraft:regeneration', 100, 1, false, false);
    }
    
    // 显示战斗状态粒子
    if (Math.random() < 0.3) {
        owner.server.runCommandSilent(
            `execute at ${pet.getUuid()} run particle minecraft:angry_villager ~ ~1 ~ 0.3 0.3 0.3 0.1 3`
        );
    }
}

/**
 * 宠物buff状态监控
 * 监控宠物的buff状态并提供反馈
 */
ServerEvents.tick(event => {
    // 每30秒进行一次状态报告
    if (event.server.tickCount % 600 !== 0) return;
    
    event.server.getPlayers().forEach(player => {
        reportPetBuffStatus(player);
    });
});

/**
 * 报告宠物buff状态
 * @param {Internal.Player} player 玩家
 */
function reportPetBuffStatus(player) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    
    if (nearbyPets.length === 0) return;
    
    let totalActiveBuffs = 0;
    let petBuffSummary = [];
    
    nearbyPets.forEach(pet => {
        let activeEffects = [];
        
        // 检查常见的增益效果
        ['minecraft:strength', 'minecraft:speed', 'minecraft:regeneration', 
         'minecraft:resistance', 'minecraft:fire_resistance', 'minecraft:water_breathing'].forEach(effectId => {
            if (pet.hasEffect(effectId)) {
                let effect = pet.getEffect(effectId);
                activeEffects.push(`${effectId.split(':')[1]}(${effect.amplifier + 1})`);
                totalActiveBuffs++;
            }
        });
        
        if (activeEffects.length > 0) {
            petBuffSummary.push(`${pet.type}: ${activeEffects.join(', ')}`);
        }
    });
    
    if (totalActiveBuffs > 0) {
        console.log(`[宠物增强] ${player.displayName.getString()}的宠物buff状态 - 总计${totalActiveBuffs}个活跃效果:`);
        petBuffSummary.forEach(summary => console.log(`  ${summary}`));
    }
}

console.log('[宠物增强系统] 宠物buff模块已加载');