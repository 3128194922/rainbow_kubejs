// priority: 15000
// ==========================================
// 💎 圣遗物镶嵌系统配置 (wooden_sword_inlay)
// ==========================================
// 机制：仅 rainbow:relic 可在铁砧中使用 rainbow:miracle 镶嵌，最多 5 次；第五次由五条词条确定觉醒元素。
// 每次镶嵌从下方 attributes 中随机抽 1 个属性，并在该属性的 [min, max] 区间内按 step 随机取值。
// 取值口径参考模组源码：
//   attributeslib:crit_chance      PercentBasedAttribute，0.05 = 5%（默认 0.05）
//   attributeslib:crit_damage      PercentBasedAttribute，1.5 = 150%（默认 1.5，下限 1.0）
//   attributeslib:healing_received PercentBasedAttribute，1.0 = 100%（默认 1.0）
//   caverns_and_chasms:experience_boost  经验掉落倍率加成，0.75 = +75%
//   armor / attack_damage / max_health / armor_pierce / attack_knockback 为平坦数值
// 所有数值都在本对象变量里定义，改完 /reload 或重启即可生效（客户端与服务端共用同一份配置）。
global.WOODEN_SWORD_INLAY_CONFIG = {
    // 圣遗物与镶嵌材料；词条属性由 Curios 饰品回调读取圣遗物自身 NBT
    relicId: "rainbow:relic",
    materialId: "rainbow:miracle",

    // 最大镶嵌次数
    maxSockets: 5,

    // 铁砧经验等级消耗：第 (index + 1) 次镶嵌消耗 base + perSocket * index，最高不超过 maxCost
    cost: {
        base: 5,
        perSocket: 5,
        maxCost: 30
    },

    // 镶嵌数据在物品 NBT 中的键名：数量 / 随机种子 / 每个槽位的前缀 / 觉醒元素
    // 槽位 i 的键为 prefix + i + 'Attr'（属性ID）与 prefix + i + 'Val'（加成数值）
    nbt: {
        count: "RainbowInlayCount",
        seed: "RainbowInlaySeed",
        prefix: "RainbowInlay",
        element: "RainbowRelicElement"
    },

    // 每档套装加成：4 件获得一档，5 件再叠加相同的一档。
    // 天使用原版飞行速度属性；玩家需额外挂载该属性，实际飞行手感仍须游戏内确认。
    elements: {
        water: { name: "水", attributeName: "闪避率", attribute: "attributeslib:dodge_chance", amount: 0.05, operation: "ADDITION", percent: true },
        mountain: { name: "岳", attributeName: "击退抗性", attribute: "minecraft:generic.knockback_resistance", amount: 0.10, operation: "ADDITION", percent: true },
        wind: { name: "风", attributeName: "移动速度", attribute: "minecraft:generic.movement_speed", amount: 0.10, operation: "MULTIPLY_BASE", percent: true },
        thunder: { name: "雷", attributeName: "暴击率", attribute: "attributeslib:crit_chance", amount: 0.05, operation: "ADDITION", percent: true },
        marsh: { name: "泽", attributeName: "暴击伤害", attribute: "attributeslib:crit_damage", amount: 0.15, operation: "ADDITION", percent: true },
        fire: { name: "火", attributeName: "攻击伤害", attribute: "minecraft:generic.attack_damage", amount: 2, operation: "ADDITION", percent: false },
        earth: { name: "地", attributeName: "最大生命", attribute: "minecraft:generic.max_health", amount: 4, operation: "ADDITION", percent: false },
        heaven: { name: "天", attributeName: "飞行速度属性", attribute: "minecraft:generic.flying_speed", amount: 0.10, operation: "MULTIPLY_BASE", percent: true }
    },

    // 可镶嵌属性表：id -> { name 展示名, min/max 单次加成范围, step 取值步长, percent 是否按百分比展示 }
    // 强力档（标准档 ×1.5），可自由调整；删除某项即从随机池中移除该属性
    attributes: {
        "attributeslib:crit_chance": {
            name: "暴击率", min: 0.015, max: 0.075, step: 0.005, percent: true
        },
        "attributeslib:crit_damage": {
            name: "暴击伤害", min: 0.075, max: 0.300, step: 0.025, percent: true
        },
        "minecraft:generic.armor": {
            name: "护甲值", min: 0.75, max: 3.0, step: 0.25, percent: false
        },
        "minecraft:generic.attack_damage": {
            name: "攻击伤害", min: 0.75, max: 3.0, step: 0.25, percent: false
        },
        "minecraft:generic.max_health": {
            name: "最大生命值", min: 1.5, max: 6.0, step: 0.5, percent: false
        },
        "attributeslib:armor_pierce": {
            name: "盔甲穿透", min: 0.75, max: 3.0, step: 0.25, percent: false
        },
        "attributeslib:healing_received": {
            name: "受到治疗", min: 0.03, max: 0.15, step: 0.01, percent: true
        },
        "caverns_and_chasms:experience_boost": {
            name: "经验增益", min: 0.075, max: 0.30, step: 0.025, percent: true
        },
        "minecraft:generic.attack_knockback": {
            name: "攻击击退", min: 0.15, max: 0.75, step: 0.05, percent: false
        }
    }
};
