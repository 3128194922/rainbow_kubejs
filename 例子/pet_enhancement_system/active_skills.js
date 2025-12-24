// priority: 500
// 饰品宠物增强体系 - 主动技能模块

/**
 * 处理宠物增强饰品的主动技能激活
 * 监听来自客户端的网络事件
 */
NetworkEvents.dataReceived("petEnhancementSkill", (event) => {
    let player = event.player;
    let data = event.data;
    
    if (!player || !data || !data.action) return;
    
    switch (data.action) {
        case "activate":
            activatePetEnhancementSkill(player);
            break;
        case "toggle":
            togglePetEnhancementSkill(player, data.itemId);
            break;
        case "query_status":
            sendSkillStatusToClient(player);
            break;
    }
});

/**
 * 激活宠物增强技能（通用激活）
 * 检查玩家装备的所有可激活饰品并尝试激活
 * @param {Internal.Player} player 玩家
 */
function activatePetEnhancementSkill(player) {
    let activatedSkills = [];
    let failedSkills = [];
    
    // 检查伤害增强饰品
    Object.entries(global.PetEnhancementConfig.damageEnhancement).forEach(([itemId, config]) => {
        if (!config.needsActivation) return;
        if (!hasCurios(player, itemId)) return;
        
        if (tryActivateSkill(player, itemId, config)) {
            activatedSkills.push({ itemId, type: 'damage', config });
        } else {
            failedSkills.push({ itemId, reason: 'cooldown' });
        }
    });
    
    // 检查攻击buff饰品
    Object.entries(global.PetEnhancementConfig.attackBuffs).forEach(([itemId, config]) => {
        if (!config.needsActivation) return;
        if (!hasCurios(player, itemId)) return;
        
        if (tryActivateSkill(player, itemId, config)) {
            activatedSkills.push({ itemId, type: 'attack_buff', config });
        } else {
            failedSkills.push({ itemId, reason: 'cooldown' });
        }
    });
    
    // 检查宠物buff饰品
    Object.entries(global.PetEnhancementConfig.petBuffs).forEach(([itemId, config]) => {
        if (!config.needsActivation) return;
        if (!hasCurios(player, itemId)) return;
        
        if (tryActivateSkill(player, itemId, config)) {
            activatedSkills.push({ itemId, type: 'pet_buff', config });
        } else {
            failedSkills.push({ itemId, reason: 'cooldown' });
        }
    });
    
    // 检查特定宠物加成饰品
    Object.entries(global.PetEnhancementConfig.specificPetBonuses).forEach(([itemId, config]) => {
        if (!config.needsActivation) return;
        if (!hasCurios(player, itemId)) return;
        
        if (tryActivateSkill(player, itemId, config)) {
            activatedSkills.push({ itemId, type: 'specific_bonus', config });
        } else {
            failedSkills.push({ itemId, reason: 'cooldown' });
        }
    });
    
    // 处理激活结果
    if (activatedSkills.length > 0) {
        handleSkillActivation(player, activatedSkills);
        
        // 发送成功消息给玩家
        let message = `§a[宠物增强] 激活了 ${activatedSkills.length} 个技能:`;
        activatedSkills.forEach(skill => {
            message += `\n§7- ${getItemDisplayName(skill.itemId)} (${skill.config.duration || 30}秒)`;
        });
        player.tell(message);
        
        // 播放激活音效
        player.server.runCommandSilent(
            `execute at ${player.getUuid()} run playsound minecraft:block.enchantment_table.use player @s ~ ~ ~ 1.0 1.2`
        );
        
        // 显示激活粒子效果
        player.server.runCommandSilent(
            `execute at ${player.getUuid()} run particle minecraft:enchant ~ ~1 ~ 0.5 1 0.5 0.1 20`
        );
    } else if (failedSkills.length > 0) {
        // 发送冷却消息
        player.tell("§c[宠物增强] 所有可激活的技能都在冷却中！");
        
        // 播放失败音效
        player.server.runCommandSilent(
            `execute at ${player.getUuid()} run playsound minecraft:block.note_block.bass player @s ~ ~ ~ 1.0 0.5`
        );
    } else {
        // 没有可激活的技能
        player.tell("§e[宠物增强] 没有装备可激活的宠物增强饰品！");
    }
}

/**
 * 尝试激活单个技能
 * @param {Internal.Player} player 玩家
 * @param {string} itemId 饰品ID
 * @param {Object} config 技能配置
 * @returns {boolean} 是否激活成功
 */
function tryActivateSkill(player, itemId, config) {
    // 检查冷却时间
    if (player.cooldowns.isOnCooldown(itemId)) {
        return false;
    }
    
    // 检查是否已经激活
    if (global.PetEnhancementConfig.utils.isActiveSkillActive(player, itemId)) {
        return false;
    }
    
    // 激活技能
    let duration = config.duration || 30;
    global.PetEnhancementConfig.utils.activateSkill(player, itemId, duration);
    
    // 设置冷却时间
    let cooldown = config.cooldown || 60;
    player.cooldowns.addCooldown(itemId, SecoundToTick(cooldown));
    
    return true;
}

/**
 * 处理技能激活后的效果
 * @param {Internal.Player} player 玩家
 * @param {Array} activatedSkills 激活的技能列表
 */
function handleSkillActivation(player, activatedSkills) {
    activatedSkills.forEach(skill => {
        let { itemId, type, config } = skill;
        
        switch (type) {
            case 'pet_buff':
                // 立即为附近的宠物应用buff
                applyImmediatePetBuffs(player, itemId, config);
                break;
                
            case 'specific_bonus':
                // 立即应用特定宠物加成
                applySpecificPetBonuses(player, itemId, config);
                break;
                
            case 'damage':
            case 'attack_buff':
                // 这些效果在攻击时触发，这里只需要记录激活状态
                console.log(`[宠物增强] ${player.displayName.getString()}激活了${itemId}技能`);
                break;
        }
    });
}

/**
 * 立即为宠物应用buff效果
 * @param {Internal.Player} player 玩家
 * @param {string} itemId 饰品ID
 * @param {Object} config 配置
 */
function applyImmediatePetBuffs(player, itemId, config) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    
    nearbyPets.forEach(pet => {
        if (config.petEffect) {
            let duration = SecoundToTick(config.duration || 30);
            let level = config.effectLevel || 0;
            
            pet.potionEffects.add(config.petEffect, duration, level, false, false);
            
            // 显示buff应用粒子
            player.server.runCommandSilent(
                `execute at ${pet.getUuid()} run particle minecraft:happy_villager ~ ~1 ~ 0.3 0.3 0.3 0.1 5`
            );
        }
    });
    
    console.log(`[宠物增强] ${player.displayName.getString()}为${nearbyPets.length}只宠物应用了${itemId}的buff效果`);
}

/**
 * 应用特定宠物加成
 * @param {Internal.Player} player 玩家
 * @param {string} itemId 饰品ID
 * @param {Object} config 配置
 */
function applySpecificPetBonuses(player, itemId, config) {
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    let affectedPets = 0;
    
    nearbyPets.forEach(pet => {
        // 检查是否为目标宠物类型
        let isPetMatch = config.targetPets.some(petType => {
            if (petType.endsWith('*')) {
                return pet.type.startsWith(petType.slice(0, -1));
            }
            return pet.type === petType;
        });
        
        if (!isPetMatch) return;
        
        let bonuses = config.bonuses;
        if (!bonuses) return;
        
        let duration = config.duration || 30;
        
        // 应用潜行模式
        if (bonuses.stealthMode) {
            pet.potionEffects.add('minecraft:invisibility', SecoundToTick(duration), 0, false, false);
        }
        
        // 应用夜视能力
        if (bonuses.nightVision) {
            pet.potionEffects.add('minecraft:night_vision', SecoundToTick(duration), 0, false, false);
        }
        
        // 应用速度加成
        if (bonuses.speedBonus) {
            pet.potionEffects.add('minecraft:speed', SecoundToTick(duration), 2, false, false);
        }
        
        // 显示特殊效果粒子
        player.server.runCommandSilent(
            `execute at ${pet.getUuid()} run particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 0.1 10`
        );
        
        affectedPets++;
    });
    
    console.log(`[宠物增强] ${player.displayName.getString()}为${affectedPets}只特定宠物应用了${itemId}的加成效果`);
}

/**
 * 切换特定饰品的激活状态
 * @param {Internal.Player} player 玩家
 * @param {string} itemId 饰品ID
 */
function togglePetEnhancementSkill(player, itemId) {
    if (!itemId || !hasCurios(player, itemId)) {
        player.tell("§c[宠物增强] 未装备指定的饰品！");
        return;
    }
    
    // 查找对应的配置
    let config = null;
    let type = null;
    
    if (global.PetEnhancementConfig.damageEnhancement[itemId]) {
        config = global.PetEnhancementConfig.damageEnhancement[itemId];
        type = 'damage';
    } else if (global.PetEnhancementConfig.attackBuffs[itemId]) {
        config = global.PetEnhancementConfig.attackBuffs[itemId];
        type = 'attack_buff';
    } else if (global.PetEnhancementConfig.petBuffs[itemId]) {
        config = global.PetEnhancementConfig.petBuffs[itemId];
        type = 'pet_buff';
    } else if (global.PetEnhancementConfig.specificPetBonuses[itemId]) {
        config = global.PetEnhancementConfig.specificPetBonuses[itemId];
        type = 'specific_bonus';
    }
    
    if (!config || !config.needsActivation) {
        player.tell("§c[宠物增强] 该饰品不支持主动激活！");
        return;
    }
    
    // 检查是否已激活
    if (global.PetEnhancementConfig.utils.isActiveSkillActive(player, itemId)) {
        player.tell("§e[宠物增强] 该技能已经激活中！");
        return;
    }
    
    // 检查冷却时间
    if (player.cooldowns.isOnCooldown(itemId)) {
        let remainingTicks = player.cooldowns.getCooldownPercent(itemId, 0) * SecoundToTick(config.cooldown || 60);
        let remainingSeconds = Math.ceil(remainingTicks / 20);
        player.tell(`§c[宠物增强] 技能冷却中，还需等待 ${remainingSeconds} 秒！`);
        return;
    }
    
    // 激活技能
    if (tryActivateSkill(player, itemId, config)) {
        handleSkillActivation(player, [{ itemId, type, config }]);
        
        let itemName = getItemDisplayName(itemId);
        player.tell(`§a[宠物增强] 成功激活 ${itemName} 技能！持续 ${config.duration || 30} 秒`);
        
        // 播放激活音效
        player.server.runCommandSilent(
            `execute at ${player.getUuid()} run playsound minecraft:block.enchantment_table.use player @s ~ ~ ~ 1.0 1.2`
        );
    } else {
        player.tell("§c[宠物增强] 技能激活失败！");
    }
}

/**
 * 发送技能状态信息给客户端
 * @param {Internal.Player} player 玩家
 */
function sendSkillStatusToClient(player) {
    let statusInfo = [];
    
    // 收集所有装备的可激活饰品状态
    let allConfigs = {
        ...global.PetEnhancementConfig.damageEnhancement,
        ...global.PetEnhancementConfig.attackBuffs,
        ...global.PetEnhancementConfig.petBuffs,
        ...global.PetEnhancementConfig.specificPetBonuses
    };
    
    Object.entries(allConfigs).forEach(([itemId, config]) => {
        if (!config.needsActivation || !hasCurios(player, itemId)) return;
        
        let isActive = global.PetEnhancementConfig.utils.isActiveSkillActive(player, itemId);
        let isOnCooldown = player.cooldowns.isOnCooldown(itemId);
        let cooldownPercent = isOnCooldown ? player.cooldowns.getCooldownPercent(itemId, 0) : 0;
        
        statusInfo.push({
            itemId: itemId,
            name: getItemDisplayName(itemId),
            isActive: isActive,
            isOnCooldown: isOnCooldown,
            cooldownPercent: cooldownPercent,
            description: config.description || '无描述'
        });
    });
    
    // 发送状态信息到客户端（如果有客户端处理的话）
    console.log(`[宠物增强] ${player.displayName.getString()}的技能状态:`, statusInfo);
}

/**
 * 获取物品的显示名称
 * @param {string} itemId 物品ID
 * @returns {string} 显示名称
 */
function getItemDisplayName(itemId) {
    try {
        return Item.of(itemId).displayName.getString();
    } catch (e) {
        return itemId.split(':')[1] || itemId;
    }
}

/**
 * 定期检查并清理过期的主动技能效果
 */
ServerEvents.tick(event => {
    if (event.server.tickCount % 100 !== 0) return;  // 每5秒检查一次
    
    event.server.getPlayers().forEach(player => {
        // 检查过期的技能并发送提醒
        let expiredSkills = [];
        
        Object.keys(global.PetEnhancementConfig.activeSkills).forEach(key => {
            if (key.startsWith(player.getUuid().toString())) {
                let skillData = global.PetEnhancementConfig.activeSkills[key];
                let currentTime = Date.now();
                
                // 检查即将过期的技能（剩余5秒）
                if (currentTime + 5000 >= skillData.endTime && currentTime < skillData.endTime) {
                    let itemId = key.split('_')[1];
                    expiredSkills.push(getItemDisplayName(itemId));
                }
            }
        });
        
        if (expiredSkills.length > 0) {
            player.tell(`§e[宠物增强] 以下技能即将结束: ${expiredSkills.join(', ')}`);
        }
    });
});

console.log('[宠物增强系统] 主动技能模块已加载');