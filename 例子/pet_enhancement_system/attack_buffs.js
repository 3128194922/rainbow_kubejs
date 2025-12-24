// priority: 500
// 饰品宠物增强体系 - 宠物攻击附加buff模块

/**
 * 监听实体受伤事件，为装备相应饰品的玩家的宠物攻击添加buff效果
 */
EntityEvents.hurt(event => {
    let attacker = event.source.actual;
    let victim = event.entity;
    
    // 确保攻击者和受害者都存在且为生物实体
    if (!attacker || !attacker.isLiving() || !victim || !victim.isLiving()) return;
    
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
    
    // 遍历攻击buff配置
    Object.entries(global.PetEnhancementConfig.attackBuffs).forEach(([itemId, config]) => {
        // 检查玩家是否装备了该饰品
        if (!hasCurios(owner, itemId)) return;
        
        // 检查是否需要主动激活
        if (config.needsActivation) {
            if (!global.PetEnhancementConfig.utils.isActiveSkillActive(owner, itemId)) {
                return;
            }
        }
        
        // 检查触发概率
        if (Math.random() > config.chance) return;
        
        // 应用效果到目标
        if (config.targetEffect) {
            let effectId = config.targetEffect;
            let level = config.effectLevel || 0;
            let duration = config.effectDuration || 100;
            
            // 为目标添加效果
            victim.potionEffects.add(effectId, duration, level, false, false);
            
            // 显示粒子效果
            let particleEffect = getParticleForEffect(effectId);
            if (particleEffect) {
                owner.server.runCommandSilent(
                    `execute at ${victim.getUuid()} run particle ${particleEffect} ~ ~1 ~ 0.5 0.5 0.5 0.1 10`
                );
            }
            
            // 播放音效
            let soundEffect = getSoundForEffect(effectId);
            if (soundEffect) {
                owner.server.runCommandSilent(
                    `execute at ${victim.getUuid()} run playsound ${soundEffect} hostile @a[distance=..16] ~ ~ ~ 0.5 1.0`
                );
            }
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}使用${itemId}对${victim.type}施加${effectId}效果`);
        }
        
        // 应用自身增益效果（如果配置了的话）
        if (config.selfEffect) {
            let effectId = config.selfEffect;
            let level = config.selfEffectLevel || 0;
            let duration = config.selfEffectDuration || 100;
            
            attacker.potionEffects.add(effectId, duration, level, false, false);
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}使用${itemId}获得${effectId}效果`);
        }
    });
});

/**
 * 根据效果类型返回对应的粒子效果
 * @param {string} effectId 效果ID
 * @returns {string} 粒子效果名称
 */
function getParticleForEffect(effectId) {
    const particleMap = {
        'minecraft:poison': 'minecraft:item_slime',
        'minecraft:slowness': 'minecraft:item_snowball',
        'minecraft:weakness': 'minecraft:smoke',
        'minecraft:wither': 'minecraft:large_smoke',
        'minecraft:blindness': 'minecraft:squid_ink',
        'minecraft:nausea': 'minecraft:portal',
        'minecraft:mining_fatigue': 'minecraft:cloud',
        'minecraft:hunger': 'minecraft:item_crack minecraft:rotten_flesh',
        'minecraft:instant_damage': 'minecraft:damage_indicator'
    };
    
    return particleMap[effectId] || 'minecraft:crit';
}

/**
 * 根据效果类型返回对应的音效
 * @param {string} effectId 效果ID
 * @returns {string} 音效名称
 */
function getSoundForEffect(effectId) {
    const soundMap = {
        'minecraft:poison': 'minecraft:entity.spider.hurt',
        'minecraft:slowness': 'minecraft:block.powder_snow.step',
        'minecraft:weakness': 'minecraft:entity.witch.drink',
        'minecraft:wither': 'minecraft:entity.wither.hurt',
        'minecraft:blindness': 'minecraft:entity.bat.takeoff',
        'minecraft:nausea': 'minecraft:block.portal.ambient',
        'minecraft:mining_fatigue': 'minecraft:entity.elder_guardian.curse',
        'minecraft:hunger': 'minecraft:entity.player.burp',
        'minecraft:instant_damage': 'minecraft:entity.player.hurt'
    };
    
    return soundMap[effectId] || 'minecraft:entity.experience_orb.pickup';
}

/**
 * 特殊攻击效果处理
 * 处理一些需要特殊逻辑的攻击效果
 */
EntityEvents.hurt(event => {
    let attacker = event.source.actual;
    let victim = event.entity;
    
    if (!attacker || !attacker.isLiving() || !victim || !victim.isLiving()) return;
    if (!global.PetEnhancementConfig.utils.isSupportedPet(attacker)) return;
    
    let owner = null;
    if (attacker.persistentData && attacker.persistentData.OwnerName) {
        owner = event.server.getPlayer(attacker.persistentData.OwnerName);
    } else if (attacker.isOwnedBy) {
        let players = event.server.getPlayers();
        for (let player of players) {
            if (attacker.isOwnedBy(player)) {
                owner = player;
                break;
            }
        }
    }
    
    if (!owner || owner.distanceToEntity(attacker) > 64) return;
    
    // 检查特殊攻击效果饰品
    checkSpecialAttackEffects(owner, attacker, victim, event);
});

/**
 * 检查并应用特殊攻击效果
 * @param {Internal.Player} owner 宠物主人
 * @param {Internal.Entity} attacker 攻击者（宠物）
 * @param {Internal.Entity} victim 受害者
 * @param {Internal.EntityHurtEvent} event 伤害事件
 */
function checkSpecialAttackEffects(owner, attacker, victim, event) {
    // 吸血效果饰品
    if (hasCurios(owner, 'rainbow:vampire_fang')) {
        if (Math.random() < 0.2) {  // 20%概率
            let healAmount = event.damage * 0.3;  // 恢复30%伤害的生命值
            attacker.heal(healAmount);
            
            // 显示治疗粒子
            owner.server.runCommandSilent(
                `execute at ${attacker.getUuid()} run particle minecraft:heart ~ ~1 ~ 0.3 0.3 0.3 0.1 3`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}吸血恢复${healAmount}生命值`);
        }
    }
    
    // 击退效果饰品
    if (hasCurios(owner, 'rainbow:knockback_collar')) {
        if (Math.random() < 0.4) {  // 40%概率
            let knockbackStrength = 2.0;
            
            // 计算击退方向
            let dx = victim.x - attacker.x;
            let dz = victim.z - attacker.z;
            let distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0) {
                dx = (dx / distance) * knockbackStrength;
                dz = (dz / distance) * knockbackStrength;
                
                // 应用击退
                victim.setDeltaMovement(dx, 0.4, dz);
                
                // 显示击退粒子
                owner.server.runCommandSilent(
                    `execute at ${victim.getUuid()} run particle minecraft:explosion ~ ~ ~ 0.5 0.5 0.5 0.1 5`
                );
                
                console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}击退目标`);
            }
        }
    }
    
    // 燃烧效果饰品
    if (hasCurios(owner, 'rainbow:flame_collar')) {
        if (Math.random() < 0.3) {  // 30%概率
            victim.setSecondsOnFire(5);  // 燃烧5秒
            
            // 显示火焰粒子
            owner.server.runCommandSilent(
                `execute at ${victim.getUuid()} run particle minecraft:flame ~ ~1 ~ 0.3 0.3 0.3 0.1 8`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}点燃目标`);
        }
    }
    
    // 冰冻效果饰品
    if (hasCurios(owner, 'rainbow:frost_bite')) {
        if (Math.random() < 0.25) {  // 25%概率
            // 应用冰冻效果（缓慢+挖掘疲劳）
            victim.potionEffects.add('minecraft:slowness', 100, 3, false, false);
            victim.potionEffects.add('minecraft:mining_fatigue', 100, 2, false, false);
            
            // 在目标周围生成冰块效果
            owner.server.runCommandSilent(
                `execute at ${victim.getUuid()} run particle minecraft:item_snowball ~ ~1 ~ 0.5 0.5 0.5 0.1 15`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}冰冻目标`);
        }
    }
    
    // 雷电效果饰品
    if (hasCurios(owner, 'rainbow:thunder_collar')) {
        if (Math.random() < 0.15) {  // 15%概率
            // 在目标位置召唤闪电
            owner.server.runCommandSilent(
                `execute at ${victim.getUuid()} run summon minecraft:lightning_bolt ~ ~ ~`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}召唤雷电攻击目标`);
        }
    }
    
    // 治疗主人效果饰品
    if (hasCurios(owner, 'rainbow:healing_bond')) {
        if (Math.random() < 0.1) {  // 10%概率
            let healAmount = 2.0;  // 恢复2点生命值
            owner.heal(healAmount);
            
            // 显示治疗连线效果
            owner.server.runCommandSilent(
                `execute at ${owner.getUuid()} run particle minecraft:heart ~ ~1 ~ 0.3 0.3 0.3 0.1 5`
            );
            
            console.log(`[宠物增强] ${owner.displayName.getString()}通过宠物攻击恢复生命值`);
        }
    }
}

/**
 * 群体攻击效果
 * 某些饰品可以让宠物的攻击影响周围的敌人
 */
EntityEvents.hurt(event => {
    let attacker = event.source.actual;
    let victim = event.entity;
    
    if (!attacker || !attacker.isLiving() || !victim || !victim.isLiving()) return;
    if (!global.PetEnhancementConfig.utils.isSupportedPet(attacker)) return;
    
    let owner = null;
    if (attacker.persistentData && attacker.persistentData.OwnerName) {
        owner = event.server.getPlayer(attacker.persistentData.OwnerName);
    } else if (attacker.isOwnedBy) {
        let players = event.server.getPlayers();
        for (let player of players) {
            if (attacker.isOwnedBy(player)) {
                owner = player;
                break;
            }
        }
    }
    
    if (!owner || owner.distanceToEntity(attacker) > 64) return;
    
    // 群体毒雾效果
    if (hasCurios(owner, 'rainbow:toxic_aura') && Math.random() < 0.2) {
        let nearbyEnemies = victim.level.getEntitiesWithin(victim.getBoundingBox().inflate(5))
            .filter(entity => {
                return entity.isLiving() && 
                       entity !== attacker && 
                       entity !== owner && 
                       !global.PetEnhancementConfig.utils.isPlayerPet(entity, owner);
            });
        
        nearbyEnemies.forEach(enemy => {
            enemy.potionEffects.add('minecraft:poison', 60, 1, false, false);
        });
        
        // 显示毒雾效果
        owner.server.runCommandSilent(
            `execute at ${victim.getUuid()} run particle minecraft:item_slime ~ ~1 ~ 3 1 3 0.1 30`
        );
        
        console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}释放毒雾，影响${nearbyEnemies.length}个敌人`);
    }
    
    // 群体减速效果
    if (hasCurios(owner, 'rainbow:chill_aura') && Math.random() < 0.25) {
        let nearbyEnemies = victim.level.getEntitiesWithin(victim.getBoundingBox().inflate(4))
            .filter(entity => {
                return entity.isLiving() && 
                       entity !== attacker && 
                       entity !== owner && 
                       !global.PetEnhancementConfig.utils.isPlayerPet(entity, owner);
            });
        
        nearbyEnemies.forEach(enemy => {
            enemy.potionEffects.add('minecraft:slowness', 80, 2, false, false);
        });
        
        // 显示冰霜效果
        owner.server.runCommandSilent(
            `execute at ${victim.getUuid()} run particle minecraft:item_snowball ~ ~1 ~ 2 1 2 0.1 25`
        );
        
        console.log(`[宠物增强] ${owner.displayName.getString()}的宠物${attacker.type}释放冰霜光环，影响${nearbyEnemies.length}个敌人`);
    }
});

console.log('[宠物增强系统] 攻击buff模块已加载');