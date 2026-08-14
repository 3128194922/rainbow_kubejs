// priority: 0
// ==========================================
// 🛡️ 套装装备 Tooltip 自动显示
// 悬停套装部件时显示 [套装]套装名称 + 套装介绍文本
// 新增套装：在 SetDisplayRegistry 中添加对应条目即可
// ==========================================

// --- 套装展示注册表 ---
// 每项: { name: 套装名, items: [物品id...], desc: 介绍文本数组 }
let SetDisplayRegistry = {
    'oreganized:electrum': {
        name: '琥珀金套装',
        items: [
            'oreganized:electrum_helmet',
            'oreganized:electrum_chestplate',
            'oreganized:electrum_leggings',
            'oreganized:electrum_boots',
        ],
        desc: [
            '§b2件套：§f+1 动能伤害',
            '§b4件套：§f额外 +3 动能伤害（共 +4）',
        ]
    },
    'royalvariations:royal_knight': {
        name: '骑士套装',
        items: [
            'royalvariations:royal_knight_helmet',
            'royalvariations:royal_knight_cuirass',
            'royalvariations:royal_knight_leggings',
            'royalvariations:royal_knight_boots',
        ],
        desc: [
            '§b2件套：§f+1 宠物伤害',
            '§b4件套：§f额外 +3 宠物伤害（共 +4）',
        ]
    },
}

// --- 注册 Tooltip ---
ItemEvents.tooltip(event => {
    for (let setId in SetDisplayRegistry) {
        let set = SetDisplayRegistry[setId]
        if (!set || !set.items || set.items.length === 0) continue

        event.addAdvanced(set.items, (item, advanced, text) => {
            // [套装]套装名称 紧贴物品名下方
            text.add(1, Text.gold('[套装]').append(Text.yellow(set.name)))
            // 套装介绍文本依次追加
            let idx = 2
            for (let line of set.desc) {
                text.add(idx++, Text.of(line))
            }
        })
    }
})
