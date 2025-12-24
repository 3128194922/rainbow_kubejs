// priority: 1000
// 饰品宠物增强体系 - 核心配置文件

/**
 * 饰品宠物增强配置
 * 定义各种饰品对宠物的增强效果
 */
global.PetEnhancementConfig = {
    // 宠物伤害增强饰品配置
    damageEnhancement: {
        'rainbow:pet_strength_charm': {
            damageMultiplier: 1.5,  // 伤害倍数
            needsActivation: false,  // 是否需要主动激活
            cooldown: 0,            // 冷却时间(秒)
            description: '增加宠物50%攻击伤害'
        },
        'rainbow:beast_master_amulet': {
            damageMultiplier: 2.0,
            needsActivation: true,   // 需要主动激活
            cooldown: 60,           // 60秒冷却
            duration: 30,           // 持续30秒
            description: '主动激活后，宠物伤害翻倍30秒'
        }
    },

    // 宠物攻击附加buff配置
    attackBuffs: {
        'rainbow:venom_fang': {
            targetEffect: 'minecraft:poison',
            effectLevel: 1,
            effectDuration: 100,     // 5秒 (100 ticks)
            chance: 0.3,            // 30%概率
            needsActivation: false,
            description: '宠物攻击有30%概率使目标中毒5秒'
        },
        'rainbow:frost_collar': {
            targetEffect: 'minecraft:slowness',
            effectLevel: 2,
            effectDuration: 60,      // 3秒
            chance: 0.5,            // 50%概率
            needsActivation: false,
            description: '宠物攻击有50%概率使目标缓慢3秒'
        },
        'rainbow:fire_spirit_charm': {
            targetEffect: 'minecraft:wither',
            effectLevel: 0,
            effectDuration: 80,      // 4秒
            chance: 0.25,           // 25%概率
            needsActivation: true,   // 需要主动激活
            cooldown: 45,
            duration: 20,            // 激活后持续20秒
            description: '主动激活后20秒内，宠物攻击有25%概率使目标凋零4秒'
        }
    },

    // 宠物获得buff配置
    petBuffs: {
        'rainbow:guardian_pendant': {
            petEffect: 'minecraft:resistance',
            effectLevel: 1,
            refreshInterval: 100,    // 每5秒刷新一次
            needsActivation: false,
            description: '为宠物提供持续的抗性提升II效果'
        },
        'rainbow:speed_boots': {
            petEffect: 'minecraft:speed',
            effectLevel: 2,
            refreshInterval: 100,
            needsActivation: false,
            description: '为宠物提供持续的速度提升III效果'
        },
        'rainbow:regeneration_core': {
            petEffect: 'minecraft:regeneration',
            effectLevel: 1,
            refreshInterval: 100,
            needsActivation: true,
            cooldown: 120,          // 2分钟冷却
            duration: 60,           // 持续1分钟
            description: '主动激活后1分钟内为宠物提供生命恢复II效果'
        }
    },

    // 特定宠物加成配置
    specificPetBonuses: {
        'rainbow:canine_collar': {
            targetPets: ['minecraft:wolf'],  // 针对狼/狗
            bonuses: {
                damageMultiplier: 1.8,
                healthBonus: 20,         // 额外生命值
                speedBonus: 0.2          // 额外速度
            },
            needsActivation: false,
            description: '专门为狗类宠物设计，提供80%伤害加成、20点额外生命和20%速度加成'
        },
        'rainbow:marsupial_pouch': {
            targetPets: ['alexsmobs:kangaroo'],  // 针对袋鼠
            bonuses: {
                damageMultiplier: 1.6,
                jumpBonus: 2.0,          // 跳跃能力加成
                carryCapacity: true      // 增加携带能力
            },
            needsActivation: false,
            description: '专门为袋鼠设计，提供60%伤害加成和双倍跳跃能力'
        },
        'rainbow:feline_grace': {
            targetPets: ['minecraft:cat', 'minecraft:ocelot'],  // 针对猫科动物
            bonuses: {
                damageMultiplier: 1.4,
                stealthMode: true,       // 潜行模式
                nightVision: true        // 夜视能力
            },
            needsActivation: true,
            cooldown: 90,
            duration: 45,
            description: '主动激活后45秒内为猫科宠物提供40%伤害加成和潜行能力'
        }
    },

    // 主动技能状态追踪
    activeSkills: {
        // 格式: 'playerId_itemId': { endTime: timestamp, ... }
    },

    // 支持的宠物类型列表
    supportedPets: [
        'minecraft:wolf',
        'minecraft:cat',
        'minecraft:ocelot',
        'minecraft:iron_golem',
        'minecraft:zombie',
        'minecraft:drowned',
        'dungeonsdelight:rotten_zombie',
        'minecraft:husk',
        'windswept:chilled',
        'alexsmobs:kangaroo',
        'domesticationinnovation:*'  // 支持所有驯化创新模组的宠物
    ],

    // 工具函数
    utils: {
        /**
         * 检查实体是否为支持的宠物类型
         * @param {Internal.Entity} entity 实体
         * @returns {boolean}
         */
        isSupportedPet: function(entity) {
            if (!entity) return false;
            let entityId = entity.type;
            return this.supportedPets.some(petType => {
                if (petType.endsWith('*')) {
                    return entityId.startsWith(petType.slice(0, -1));
                }
                return entityId === petType;
            });
        },

        /**
         * 检查实体是否为玩家的宠物
         * @param {Internal.Entity} entity 实体
         * @param {Internal.Player} player 玩家
         * @returns {boolean}
         */
        isPlayerPet: function(entity, player) {
            if (!entity || !player) return false;
            
            // 检查持久化数据中的所有者信息
            if (entity.persistentData && entity.persistentData.OwnerName) {
                return entity.persistentData.OwnerName === player.getUuid().toString();
            }
            
            // 检查原版驯服动物
            if (entity.isOwnedBy && entity.isOwnedBy(player)) {
                return true;
            }
            
            return false;
        },

        /**
         * 获取玩家附近的所有宠物
         * @param {Internal.Player} player 玩家
         * @param {number} range 范围
         * @returns {Internal.Entity[]}
         */
        getNearbyPets: function(player, range) {
            if (!player) return [];
            
            return player.level.getEntitiesWithin(player.getBoundingBox().inflate(range))
                .filter(entity => this.isSupportedPet(entity) && this.isPlayerPet(entity, player));
        },

        /**
         * 检查饰品是否需要主动激活且当前已激活
         * @param {Internal.Player} player 玩家
         * @param {string} itemId 饰品ID
         * @returns {boolean}
         */
        isActiveSkillActive: function(player, itemId) {
            let key = player.getUuid().toString() + '_' + itemId;
            let skillData = global.PetEnhancementConfig.activeSkills[key];
            if (!skillData) return false;
            
            let currentTime = Date.now();
            return currentTime < skillData.endTime;
        },

        /**
         * 激活主动技能
         * @param {Internal.Player} player 玩家
         * @param {string} itemId 饰品ID
         * @param {number} duration 持续时间(秒)
         */
        activateSkill: function(player, itemId, duration) {
            let key = player.getUuid().toString() + '_' + itemId;
            global.PetEnhancementConfig.activeSkills[key] = {
                endTime: Date.now() + (duration * 1000),
                startTime: Date.now()
            };
        },

        /**
         * 清理过期的主动技能
         */
        cleanupExpiredSkills: function() {
            let currentTime = Date.now();
            Object.keys(global.PetEnhancementConfig.activeSkills).forEach(key => {
                if (currentTime >= global.PetEnhancementConfig.activeSkills[key].endTime) {
                    delete global.PetEnhancementConfig.activeSkills[key];
                }
            });
        }
    }
};

// 定期清理过期技能 (每30秒)
ServerEvents.tick(event => {
    if (event.server.tickCount % 600 === 0) {  // 600 ticks = 30秒
        global.PetEnhancementConfig.utils.cleanupExpiredSkills();
    }
});
