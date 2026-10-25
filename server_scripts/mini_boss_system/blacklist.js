// priority: 0
// ============================================================
// 迷你Boss黑名单配置（实体级 / 词条级）
// ============================================================
// 本文件供 mini_boss_system/main.js 的转化入口读取，负幸运受击与血月
// 自然生成两条转化路径共用，改完 /reload 即可生效（只影响新转化）。
//
// 1. MB_ENTITY_BLACKLIST：实体黑名单——命中 id 模式的实体完全不参与
//    miniboss 机制（不会被转化：无词条、无血量加成、无 Dyeing 外观、无额外掉落）。
// 2. MB_POWER_BLACKLIST：词条黑名单——按实体 id 模式配置其无法抽取的词条 key；
//    键 '*' 为全局禁用（对所有实体生效）；某实体的可用词条被全部禁用时，
//    视同实体黑名单，不参与转化。
//
// id 模式支持精确匹配（'minecraft:creeper'）与命名空间通配（'create:*'）。
// 词条 key 对照 main.js 的 POWER 对象（如 "Explode"=自爆、"Parasite"=寄生）。

// 实体黑名单：数组元素为实体 id 模式
const MB_ENTITY_BLACKLIST = [
    // 示例：
    // 'minecraft:villager',   // 村民不参与
    // 'create:*',             // 机械动力全部实体不参与
];

// 词条黑名单：实体 id 模式 → 该实体无法获取的词条 key 数组
const MB_POWER_BLACKLIST = {
    // 示例：
    // 'minecraft:creeper': ['Explode', 'Evolve'],  // 苦力怕不抽自爆/演化
    // '*': ['Parasite'],                          // 全局禁用寄生词条
};
