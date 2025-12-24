// priority: 500
// 饰品宠物增强体系 - 特定宠物加成模块

/**
 * 特定宠物类型的加成配置
 * 为不同类型的宠物提供专门的增强效果
 */
const SPECIFIC_PET_BONUSES = {
    // 狗类宠物加成
    'minecraft:wolf': {
        // 忠诚守护者套装
        'rainbow:guardian_pendant': {
            healthMultiplier: 1.5,        // 生命值增加50%
            damageMultiplier: 1.3,        // 攻击力增加30%
            specialEffects: ['minecraft:resistance', 'minecraft:regeneration'],
            effectLevels: [1, 0],         // 抗性II，再生I
            description: '忠诚守护者 - 狗获得额外生命和防护'
        },
        'rainbow:pet_strength_charm': {
            damageMultiplier: 1.4,        // 攻击力增加40%
            criticalChance: 0.25,         // 25%暴击几率
            specialEffects: ['minecraft:strength'],
            effectLevels: [2],            // 力量III
            description: '野性之力 - 狗的攻击更加凶猛'
        },
        'rainbow:speed_boots': {
            speedMultiplier: 1.6,         // 速度增加60%
            specialEffects: ['minecraft:speed', 'minecraft:jump_boost'],
            effectLevels: [2, 1],         // 速度III，跳跃提升II
            description: '疾风追踪 - 狗的移动和追击能力大幅提升'
        }
    },
    
    // 袋鼠加成（假设使用Alex's Mobs模组）
    'alexsmobs:kangaroo': {
        'rainbow:speed_boots': {
            jumpMultiplier: 2.0,          // 跳跃高度翻倍
            speedMultiplier: 1.8,         // 速度增加80%
            specialEffects: ['minecraft:jump_boost', 'minecraft:slow_falling'],
            effectLevels: [3, 0],         // 跳跃提升IV，缓降I
            description: '超级跳跃 - 袋鼠的跳跃能力达到极致'
        },
        'rainbow:guardian_pendant': {
            healthMultiplier: 1.4,        // 生命值增加40%
            carryCapacity: 2,             // 可携带物品数量增加
            specialEffects: ['minecraft:resistance'],
            effectLevels: [1],            // 抗性II
            description: '强壮体魄 - 袋鼠更加强壮，可携带更多物品'
        }
    },
    
    // 猫类宠物加成
    'minecraft:cat': {
        'rainbow:speed_boots': {
            stealthMode: true,            // 潜行模式
            nightVision: true,            // 夜视能力
            specialEffects: ['minecraft:invisibility', 'minecraft:night_vision'],
            effectLevels: [0, 0],         // 隐身I，夜视I
            description: '暗夜猎手 - 猫获得潜行和夜视能力'
        },
        'rainbow:regeneration_core': {
            healthMultiplier: 1.2,        // 生命值增加20%
            healingRate: 2.0,             // 治疗速度翻倍
            specialEffects: ['minecraft:regeneration'],
            effectLevels: [1],            // 再生II
            description: '九命神猫 - 猫的生存能力大幅提升'
        }
    },
    
    // 马类宠物加成
    'minecraft:horse': {
        'rainbow:speed_boots': {
            speedMultiplier: 2.0,         // 速度翻倍
            jumpMultiplier: 1.5,          // 跳跃高度增加50%
            specialEffects: ['minecraft:speed', 'minecraft:jump_boost'],
            effectLevels: [3, 2],         // 速度IV，跳跃提升III
            description: '神驹奔腾 - 马的速度和跳跃达到传说级别'
        },
        'rainbow:guardian_pendant': {
            healthMultiplier: 1.6,        // 生命值增加60%
            armorValue: 10,               // 额外护甲值
            specialEffects: ['minecraft:resistance'],
            effectLevels: [2],            // 抗性III
            description: '战马护甲 - 马获得强大的防护能力'
        }
    },
    
    // 鹦鹉加成
    'minecraft:parrot': {
        'rainbow:speed_boots': {
            flyingSpeed: 2.0,             // 飞行速度翻倍
            scoutRange: 64,               // 侦察范围64格
            specialEffects: ['minecraft:slow_falling'],
            effectLevels: [0],            // 缓降I
            description: '天空侦察兵 - 鹦鹉成为优秀的空中侦察员'
        }
    }
};

/**
 * 监听实体生成事件，为特定宠物应用初始加成
 */
EntityEvents.spawned(event => {
    let entity = event.entity;
    
    // 延迟检查，确保实体完全加载
    entity.server.scheduleInTicks(20, () => {
        checkAndApplySpecificPetBonuses(entity);
    });
});

/**
 * 定期检查并更新特定宠物的加成效果
 */
ServerEvents.tick(event => {
    // 每10秒检查一次
    if (event.server.tickCount % 200 !== 0) return;
    
    event.server.getPlayers().forEach(player => {
        updateSpecificPetBonuses(player);
    });
});

/**
 * 检查并应用特定宠物加成
 * @param {Internal.Entity} entity 实体
 */
function checkAndApplySpecificPetBonuses(entity) {
    if (!entity || !entity.isLiving()) return;
    
    // 检查是否为宠物
    let owner = global.PetEnhancementConfig.utils.getPetOwner(entity);
    if (!owner) return;
    
    let entityType = entity.type;
    let bonusConfig = SPECIFIC_PET_BONUSES[entityType];
    
    if (!bonusConfig) return;
    
    // 遍历该宠物类型的所有可能加成
    Object.entries(bonusConfig).forEach(([itemId, config]) => {
        if (hasCurios(owner, itemId)) {
            applySpecificPetBonus(entity, owner, itemId, config);
        }
    });
}

/**
 * 更新玩家宠物的特定加成
 * @param {Internal.Player} player 玩家
 */
function updateSpecificPetBonuses(player) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    
    nearbyPets.forEach(pet => {
        checkAndApplySpecificPetBonuses(pet);
    });
}

/**
 * 应用特定宠物加成效果
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {string} itemId 饰品ID
 * @param {Object} config 加成配置
 */
function applySpecificPetBonus(pet, owner, itemId, config) {
    // 应用生命值加成
    if (config.healthMultiplier && config.healthMultiplier > 1.0) {
        applyHealthMultiplier(pet, config.healthMultiplier);
    }
    
    // 应用攻击力加成
    if (config.damageMultiplier && config.damageMultiplier > 1.0) {
        applyDamageMultiplier(pet, config.damageMultiplier);
    }
    
    // 应用速度加成
    if (config.speedMultiplier && config.speedMultiplier > 1.0) {
        applySpeedMultiplier(pet, config.speedMultiplier);
    }
    
    // 应用跳跃加成
    if (config.jumpMultiplier && config.jumpMultiplier > 1.0) {
        applyJumpMultiplier(pet, config.jumpMultiplier);
    }
    
    // 应用特殊效果
    if (config.specialEffects && config.effectLevels) {
        config.specialEffects.forEach((effectId, index) => {
            let level = config.effectLevels[index] || 0;
            pet.potionEffects.add(effectId, 220, level, false, false);
        });
    }
    
    // 应用特殊能力
    applySpecialAbilities(pet, owner, config);
    
    // 显示加成效果粒子
    if (Math.random() < 0.1) {
        showSpecificPetBonusParticles(pet, owner, config);
    }
    
    console.log(`[特定宠物加成] ${owner.displayName.getString()}的${pet.type}获得${config.description} (${itemId})`);
}

/**
 * 应用生命值倍数加成
 * @param {Internal.Entity} pet 宠物
 * @param {number} multiplier 倍数
 */
function applyHealthMultiplier(pet, multiplier) {
    let baseMaxHealth = pet.getAttributeBaseValue('minecraft:generic.max_health');
    let newMaxHealth = baseMaxHealth * multiplier;
    
    // 设置新的最大生命值
    pet.modifyAttribute('minecraft:generic.max_health', 'pet_enhancement_health', newMaxHealth - baseMaxHealth, 'addition');
    
    // 如果当前生命值比例保持不变
    let healthRatio = pet.health / pet.maxHealth;
    pet.health = pet.maxHealth * healthRatio;
}

/**
 * 应用攻击力倍数加成
 * @param {Internal.Entity} pet 宠物
 * @param {number} multiplier 倍数
 */
function applyDamageMultiplier(pet, multiplier) {
    let baseDamage = pet.getAttributeBaseValue('minecraft:generic.attack_damage');
    let bonusDamage = baseDamage * (multiplier - 1.0);
    
    pet.modifyAttribute('minecraft:generic.attack_damage', 'pet_enhancement_damage', bonusDamage, 'addition');
}

/**
 * 应用速度倍数加成
 * @param {Internal.Entity} pet 宠物
 * @param {number} multiplier 倍数
 */
function applySpeedMultiplier(pet, multiplier) {
    let baseSpeed = pet.getAttributeBaseValue('minecraft:generic.movement_speed');
    let bonusSpeed = baseSpeed * (multiplier - 1.0);
    
    pet.modifyAttribute('minecraft:generic.movement_speed', 'pet_enhancement_speed', bonusSpeed, 'addition');
}

/**
 * 应用跳跃倍数加成
 * @param {Internal.Entity} pet 宠物
 * @param {number} multiplier 倍数
 */
function applyJumpMultiplier(pet, multiplier) {
    // 通过跳跃提升效果实现
    let jumpLevel = Math.floor(multiplier) - 1;
    if (jumpLevel > 0) {
        pet.potionEffects.add('minecraft:jump_boost', 220, jumpLevel, false, false);
    }
}

/**
 * 应用特殊能力
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {Object} config 配置
 */
function applySpecialAbilities(pet, owner, config) {
    // 暴击几率
    if (config.criticalChance) {
        // 在攻击事件中处理暴击
        if (!pet.persistentData.contains('criticalChance')) {
            pet.persistentData.putFloat('criticalChance', config.criticalChance);
        }
    }
    
    // 潜行模式
    if (config.stealthMode) {
        // 降低被发现的几率
        pet.potionEffects.add('minecraft:invisibility', 100, 0, false, false);
    }
    
    // 夜视能力
    if (config.nightVision) {
        pet.potionEffects.add('minecraft:night_vision', 400, 0, false, false);
    }
    
    // 侦察范围
    if (config.scoutRange) {
        // 标记附近的敌对生物
        markNearbyEnemies(pet, owner, config.scoutRange);
    }
    
    // 携带能力
    if (config.carryCapacity) {
        // 增加宠物的物品携带能力（通过NBT实现）
        if (!pet.persistentData.contains('carryCapacity')) {
            pet.persistentData.putInt('carryCapacity', config.carryCapacity);
        }
    }
}

/**
 * 标记附近的敌对生物
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {number} range 范围
 */
function markNearbyEnemies(pet, owner, range) {
    let nearbyEnemies = pet.level.getEntitiesWithin(pet.getBoundingBox().inflate(range))
        .filter(entity => {
            return entity.isLiving() && 
                   entity.isMonster && 
                   entity.distanceToEntity(pet) <= range;
        });
    
    nearbyEnemies.forEach(enemy => {
        // 给敌人添加发光效果
        enemy.potionEffects.add('minecraft:glowing', 100, 0, false, false);
        
        // 向主人发送警告消息
        if (Math.random() < 0.1) {  // 降低消息频率
            owner.tell(`§e[侦察警报] §f你的${pet.type}发现了附近的${enemy.type}！`);
        }
    });
}

/**
 * 显示特定宠物加成粒子效果
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {Object} config 配置
 */
function showSpecificPetBonusParticles(pet, owner, config) {
    let particleType = 'minecraft:enchant';
    let particleCount = 5;
    
    // 根据加成类型选择不同的粒子效果
    if (config.healthMultiplier && config.healthMultiplier > 1.5) {
        particleType = 'minecraft:heart';
        particleCount = 8;
    } else if (config.damageMultiplier && config.damageMultiplier > 1.3) {
        particleType = 'minecraft:crit';
        particleCount = 10;
    } else if (config.speedMultiplier && config.speedMultiplier > 1.5) {
        particleType = 'minecraft:cloud';
        particleCount = 12;
    } else if (config.stealthMode) {
        particleType = 'minecraft:smoke';
        particleCount = 3;
    }
    
    owner.server.runCommandSilent(
        `execute at ${pet.getUuid()} run particle ${particleType} ~ ~1 ~ 0.3 0.3 0.3 0.1 ${particleCount}`
    );
}

/**
 * 处理特定宠物的暴击攻击
 */
EntityEvents.hurt(event => {
    let attacker = event.source.actual;
    
    if (!attacker || !attacker.isLiving()) return;
    
    // 检查攻击者是否为宠物且有暴击几率
    if (attacker.persistentData.contains('criticalChance')) {
        let critChance = attacker.persistentData.getFloat('criticalChance');
        
        if (Math.random() < critChance) {
            // 暴击伤害增加50%
            let originalDamage = event.damage;
            event.damage = originalDamage * 1.5;
            
            // 显示暴击效果
            let owner = global.PetEnhancementConfig.utils.getPetOwner(attacker);
            if (owner) {
                owner.server.runCommandSilent(
                    `execute at ${event.entity.getUuid()} run particle minecraft:crit ~ ~1 ~ 0.5 0.5 0.5 0.2 15`
                );
                
                owner.tell(`§c[暴击] §f你的${attacker.type}造成了暴击伤害！`);
            }
            
            console.log(`[特定宠物加成] ${attacker.type}触发暴击，伤害: ${originalDamage} -> ${event.damage}`);
        }
    }
});

/**
 * 特定宠物加成状态监控
 */
ServerEvents.tick(event => {
    // 每60秒报告一次特定宠物加成状态
    if (event.server.tickCount % 1200 !== 0) return;
    
    event.server.getPlayers().forEach(player => {
        reportSpecificPetBonusStatus(player);
    });
});

/**
 * 报告特定宠物加成状态
 * @param {Internal.Player} player 玩家
 */
function reportSpecificPetBonusStatus(player) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    let activeBonuses = [];
    
    nearbyPets.forEach(pet => {
        let entityType = pet.type;
        let bonusConfig = SPECIFIC_PET_BONUSES[entityType];
        
        if (bonusConfig) {
            Object.entries(bonusConfig).forEach(([itemId, config]) => {
                if (hasCurios(player, itemId)) {
                    activeBonuses.push(`${entityType}: ${config.description}`);
                }
            });
        }
    });
    
    if (activeBonuses.length > 0) {
        console.log(`[特定宠物加成] ${player.displayName.getString()}的活跃加成:`);
        activeBonuses.forEach(bonus => console.log(`  ${bonus}`));
    }
}

/**
 * 宠物类型识别辅助函数
 * @param {Internal.Entity} entity 实体
 * @returns {string} 宠物类型分类
 */
function getPetCategory(entity) {
    let entityType = entity.type;
    
    if (entityType === 'minecraft:wolf') return 'canine';
    if (entityType === 'minecraft:cat' || entityType === 'minecraft:ocelot') return 'feline';
    if (entityType === 'minecraft:horse' || entityType === 'minecraft:donkey' || entityType === 'minecraft:mule') return 'equine';
    if (entityType === 'minecraft:parrot') return 'avian';
    if (entityType.includes('kangaroo')) return 'marsupial';
    
    return 'other';
}

/**
 * 根据宠物类别应用通用加成
 * @param {Internal.Entity} pet 宠物
 * @param {Internal.Player} owner 主人
 * @param {string} category 宠物类别
 */
function applyCategoryBonus(pet, owner, category) {
    // 犬科动物通用加成
    if (category === 'canine' && hasCurios(owner, 'rainbow:guardian_pendant')) {
        pet.potionEffects.add('minecraft:resistance', 200, 0, false, false);
    }
    
    // 猫科动物通用加成
    if (category === 'feline' && hasCurios(owner, 'rainbow:speed_boots')) {
        pet.potionEffects.add('minecraft:speed', 200, 1, false, false);
    }
    
    // 马科动物通用加成
    if (category === 'equine' && hasCurios(owner, 'rainbow:speed_boots')) {
        pet.potionEffects.add('minecraft:speed', 200, 2, false, false);
        pet.potionEffects.add('minecraft:jump_boost', 200, 1, false, false);
    }
}

console.log('[宠物增强系统] 特定宠物加成模块已加载');
console.log(`[特定宠物加成] 已配置${Object.keys(SPECIFIC_PET_BONUSES).length}种特定宠物类型的加成效果`);