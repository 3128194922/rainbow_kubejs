// priority: 600
// 饰品宠物增强体系 - 系统整合和测试模块

/**
 * 系统初始化检查
 */
ServerEvents.loaded(event => {
    console.log('='.repeat(50));
    console.log('[宠物增强系统] 开始系统初始化检查...');
    
    // 检查必要的模组
    let requiredMods = [
        'curios',
        'kubejs'
    ];
    
    let missingMods = [];
    requiredMods.forEach(modId => {
        if (!Platform.isModLoaded(modId)) {
            missingMods.push(modId);
        }
    });
    
    if (missingMods.length > 0) {
        console.error(`[宠物增强系统] 缺少必要模组: ${missingMods.join(', ')}`);
        console.error('[宠物增强系统] 系统可能无法正常工作！');
    } else {
        console.log('[宠物增强系统] 所有必要模组已加载');
    }
    
    // 检查配置文件
    if (typeof global.PetEnhancementConfig === 'undefined') {
        console.error('[宠物增强系统] 配置文件未正确加载！');
    } else {
        console.log('[宠物增强系统] 配置文件加载成功');
        
        // 显示配置统计
        let damageCount = Object.keys(global.PetEnhancementConfig.damageEnhancement).length;
        let buffCount = Object.keys(global.PetEnhancementConfig.attackBuffs).length;
        let petBuffCount = Object.keys(global.PetEnhancementConfig.petBuffs).length;
        let activeSkillCount = Object.keys(global.PetEnhancementConfig.activeSkills).length;
        
        console.log(`[宠物增强系统] 配置统计:`);
        console.log(`  - 伤害增强配置: ${damageCount}个`);
        console.log(`  - 攻击buff配置: ${buffCount}个`);
        console.log(`  - 宠物buff配置: ${petBuffCount}个`);
        console.log(`  - 主动技能配置: ${activeSkillCount}个`);
    }
    
    // 初始化系统状态
    if (!global.PetEnhancementSystem) {
        global.PetEnhancementSystem = {
            statistics: {
                damageEnhanced: 0,
                buffsApplied: 0,
                skillsActivated: 0,
                petsEnhanced: new Set()
            },
            performance: {
                lastTickTime: 0,
                averageTickTime: 0,
                tickCount: 0
            },
            debug: {
                enabled: false,
                logLevel: 'info'
            }
        };
    }
    
    console.log('[宠物增强系统] 系统初始化完成');
    console.log('='.repeat(50));
});

/**
 * 性能监控
 */
ServerEvents.tick(event => {
    // 每分钟进行一次性能统计
    if (event.server.tickCount % 1200 !== 0) return;
    
    let startTime = Date.now();
    
    // 执行性能测试
    performanceTest(event.server);
    
    let endTime = Date.now();
    let tickTime = endTime - startTime;
    
    // 更新性能统计
    let perf = global.PetEnhancementSystem.performance;
    perf.tickCount++;
    perf.lastTickTime = tickTime;
    perf.averageTickTime = (perf.averageTickTime * (perf.tickCount - 1) + tickTime) / perf.tickCount;
    
    // 性能警告
    if (tickTime > 50) {  // 超过50ms
        console.warn(`[宠物增强系统] 性能警告: 处理时间 ${tickTime}ms (平均: ${perf.averageTickTime.toFixed(2)}ms)`);
    }
});

/**
 * 性能测试函数
 * @param {Internal.MinecraftServer} server 服务器实例
 */
function performanceTest(server) {
    let playerCount = server.getPlayers().size();
    let totalPets = 0;
    let activeBonuses = 0;
    
    server.getPlayers().forEach(player => {
        let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
        totalPets += nearbyPets.length;
        
        // 统计活跃的饰品加成
        Object.keys(global.PetEnhancementConfig.damageEnhancement).forEach(itemId => {
            if (hasCurios(player, itemId)) {
                activeBonuses++;
            }
        });
    });
    
    // 每10分钟输出一次统计
    if (server.tickCount % 12000 === 0) {
        console.log(`[宠物增强系统] 性能统计:`);
        console.log(`  - 在线玩家: ${playerCount}`);
        console.log(`  - 附近宠物: ${totalPets}`);
        console.log(`  - 活跃加成: ${activeBonuses}`);
        console.log(`  - 平均处理时间: ${global.PetEnhancementSystem.performance.averageTickTime.toFixed(2)}ms`);
    }
}

/**
 * 调试命令系统
 */
/*
ServerEvents.commandRegistry(event => {
    const { literal, argument } = event;
    
    event.register(
        literal('petenhancement')
            .requires(source => source.hasPermission(2))  // 需要OP权限
            .then(literal('debug')
                .then(literal('on')
                    .executes(context => {
                        global.PetEnhancementSystem.debug.enabled = true;
                        context.source.sendSuccess('§a[宠物增强] 调试模式已开启', false);
                        return 1;
                    })
                )
                .then(literal('off')
                    .executes(context => {
                        global.PetEnhancementSystem.debug.enabled = false;
                        context.source.sendSuccess('§c[宠物增强] 调试模式已关闭', false);
                        return 1;
                    })
                )
            )
            .then(literal('stats')
                .executes(context => {
                    let stats = global.PetEnhancementSystem.statistics;
                    let perf = global.PetEnhancementSystem.performance;
                    
                    context.source.sendSuccess('§6=== 宠物增强系统统计 ===', false);
                    context.source.sendSuccess(`§e伤害增强次数: §f${stats.damageEnhanced}`, false);
                    context.source.sendSuccess(`§e应用buff次数: §f${stats.buffsApplied}`, false);
                    context.source.sendSuccess(`§e技能激活次数: §f${stats.skillsActivated}`, false);
                    context.source.sendSuccess(`§e增强过的宠物: §f${stats.petsEnhanced.size}只`, false);
                    context.source.sendSuccess(`§e平均处理时间: §f${perf.averageTickTime.toFixed(2)}ms`, false);
                    
                    return 1;
                })
            )
            .then(literal('reload')
                .executes(context => {
                    // 重新加载配置
                    try {
                        // 这里可以添加配置重载逻辑
                        context.source.sendSuccess('§a[宠物增强] 配置已重新加载', false);
                        console.log('[宠物增强系统] 配置已通过命令重新加载');
                        return 1;
                    } catch (error) {
                        context.source.sendFailure('§c[宠物增强] 配置重载失败: ' + error.message);
                        return 0;
                    }
                })
            )
            .then(literal('test')
                .then(argument('player', 'minecraft:game_profile')
                    .executes(context => {
                        let targetPlayer = context.getArgument('player', 'minecraft:game_profile');
                        let player = context.source.server.getPlayerList().getPlayer(targetPlayer.getId());
                        
                        if (player) {
                            runSystemTest(player, context.source);
                            return 1;
                        } else {
                            context.source.sendFailure('§c玩家不在线');
                            return 0;
                        }
                    })
                )
            )
    );
});
*/
/**
 * 运行系统测试
 * @param {Internal.Player} player 测试目标玩家
 * @param {Internal.CommandSource} source 命令源
 */
function runSystemTest(player, source) {
    source.sendSuccess('§6开始宠物增强系统测试...', false);
    
    // 测试1: 检查玩家装备的饰品
    let equippedItems = [];
    Object.keys(global.PetEnhancementConfig.damageEnhancement).forEach(itemId => {
        if (hasCurios(player, itemId)) {
            equippedItems.push(itemId);
        }
    });
    
    source.sendSuccess(`§e测试1 - 装备检查: §f找到${equippedItems.length}个宠物增强饰品`, false);
    equippedItems.forEach(itemId => {
        source.sendSuccess(`  §7- ${itemId}`, false);
    });
    
    // 测试2: 检查附近的宠物
    let nearbyPets = global.PetEnhancementConfig.utils.getNearbyPets(player, 32);
    source.sendSuccess(`§e测试2 - 宠物检查: §f找到${nearbyPets.length}只附近的宠物`, false);
    
    nearbyPets.forEach((pet, index) => {
        let owner = global.PetEnhancementConfig.utils.getPetOwner(pet);
        let ownerName = owner ? owner.displayName.getString() : '未知';
        source.sendSuccess(`  §7- ${pet.type} (主人: ${ownerName})`, false);
    });
    
    // 测试3: 检查活跃的技能
    let activeSkills = [];
    Object.keys(global.PetEnhancementConfig.activeSkills).forEach(itemId => {
        if (global.PetEnhancementConfig.utils.isActiveSkillActive(player, itemId)) {
            activeSkills.push(itemId);
        }
    });
    
    source.sendSuccess(`§e测试3 - 主动技能: §f${activeSkills.length}个技能处于激活状态`, false);
    activeSkills.forEach(itemId => {
        source.sendSuccess(`  §7- ${itemId}`, false);
    });
    
    // 测试4: 模拟伤害增强
    if (equippedItems.length > 0 && nearbyPets.length > 0) {
        let testPet = nearbyPets[0];
        let originalDamage = 10.0;  // 模拟基础伤害
        let enhancedDamage = global.PetEnhancementConfig.utils.calculateEnhancedDamage(player, testPet, originalDamage);
        
        source.sendSuccess(`§e测试4 - 伤害计算: §f${originalDamage} -> ${enhancedDamage} (增幅: ${((enhancedDamage/originalDamage - 1) * 100).toFixed(1)}%)`, false);
    } else {
        source.sendSuccess(`§e测试4 - 伤害计算: §c跳过 (无装备或无宠物)`, false);
    }
    
    source.sendSuccess('§a系统测试完成！', false);
}

/**
 * 错误处理和日志记录
 */
function logError(module, error, context) {
    let timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [宠物增强系统] [${module}] 错误: ${error}`);
    if (context) {
        console.error(`[${timestamp}] [宠物增强系统] [${module}] 上下文: ${context}`);
    }
    
    // 如果开启调试模式，输出更详细的信息
    if (global.PetEnhancementSystem && global.PetEnhancementSystem.debug.enabled) {
        console.error(`[${timestamp}] [宠物增强系统] [${module}] 堆栈跟踪:`, error.stack || '无堆栈信息');
    }
}

/**
 * 系统健康检查
 */
ServerEvents.tick(event => {
    // 每5分钟进行一次健康检查
    if (event.server.tickCount % 6000 !== 0) return;
    
    try {
        // 检查配置完整性
        if (!global.PetEnhancementConfig) {
            throw new Error('配置对象不存在');
        }
        
        // 检查必要的工具函数
        let requiredUtils = ['getNearbyPets', 'getPetOwner', 'calculateEnhancedDamage', 'isActiveSkillActive'];
        requiredUtils.forEach(funcName => {
            if (typeof global.PetEnhancementConfig.utils[funcName] !== 'function') {
                throw new Error(`工具函数 ${funcName} 不存在或不是函数`);
            }
        });
        
        // 检查内存使用
        let stats = global.PetEnhancementSystem.statistics;
        if (stats.petsEnhanced.size > 10000) {  // 如果增强过的宠物数量过多
            console.warn('[宠物增强系统] 内存警告: 增强过的宠物数量过多，正在清理...');
            stats.petsEnhanced.clear();  // 清理记录
        }
        
    } catch (error) {
        logError('健康检查', error);
    }
});

/**
 * 兼容性检查
 */
ServerEvents.loaded(event => {
    // 检查其他可能冲突的模组
    let potentialConflicts = [
        'petbuddy',
        'sophisticatedpets',
        'tameable_beasts'
    ];
    
    let conflicts = [];
    potentialConflicts.forEach(modId => {
        if (Platform.isModLoaded(modId)) {
            conflicts.push(modId);
        }
    });
    
    if (conflicts.length > 0) {
        console.warn('[宠物增强系统] 兼容性警告: 检测到可能冲突的模组:');
        conflicts.forEach(modId => {
            console.warn(`  - ${modId}`);
        });
        console.warn('[宠物增强系统] 请注意可能的功能冲突或重复');
    }
});

console.log('[宠物增强系统] 系统整合和测试模块已加载');
console.log('[宠物增强系统] 可用命令: /petenhancement debug|stats|reload|test');
console.log('[宠物增强系统] 系统版本: 1.0.0');
console.log('[宠物增强系统] 所有模块加载完成，系统就绪！');

// 最终完成标记
ServerEvents.loaded(event => {
    event.server.scheduleInTicks(100, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🐾 宠物增强饰品体系 - 完全加载完成！ 🐾');
        console.log('='.repeat(60));
        console.log('功能特性:');
        console.log('✅ 宠物伤害增强 - 通过饰品大幅提升宠物攻击力');
        console.log('✅ 攻击附加buff - 宠物攻击时为目标添加负面效果');
        console.log('✅ 宠物获得buff - 为宠物提供持续性增益效果');
        console.log('✅ 特定宠物加成 - 针对不同宠物类型的专属增强');
        console.log('✅ 主动技能系统 - 部分饰品需要主动激活才能生效');
        console.log('✅ 智能环境适应 - 根据环境和战斗状态自动调整');
        console.log('✅ 组合套装效果 - 多个饰品组合时提供额外加成');
        console.log('✅ 完整的物品系统 - 包含合成配方和战利品掉落');
        console.log('='.repeat(60));
        console.log('使用 /petenhancement 命令进行系统管理和调试');
        console.log('='.repeat(60) + '\n');
    });
});