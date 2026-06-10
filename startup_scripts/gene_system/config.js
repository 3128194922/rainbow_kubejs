// priority: 15000

/**
 * 实体基因池配置
 * 实体ID -> 基因片段列表（字符串，长度不限）
 * 实体生成时从中随机获得一个基因片段，每个实体只有唯一一个基因
 */
global.EntityGenePool = {
    "minecraft:bat": ["bat_flight", "bat_small", "bat_echo"],
};

/**
 * 基因效果映射
 * 基因ID -> 属性修饰器配置
 * 若基因未在此映射中定义，则仅为标签存储，不应用任何属性效果
 */
global.GeneEffectMap = {
    "bat_flight": {
        attribute: "attributeslib:creative_flight",
        UUID: "aba249fe-82bd-45f4-ab00-8452d027e00f",
        NUMBER: 1,
        OPERATION: "addition"
    },
    "bat_small": {
        attribute: "moreattribute:size_scale",
        UUID: "34782055-835a-4deb-8151-d38f06b05b65",
        NUMBER: -0.5,
        OPERATION: "multiply_total"
    }
};
