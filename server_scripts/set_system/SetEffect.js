// priority: 0
// ==========================================
// 🛡️ 套装定义（引擎已迁移到 SetJS mod）
// ==========================================
// 原 KubeJS 引擎 SetEffect.js 已停用并原样保留为
//   server_scripts/set_system/SetEffect.legacy.js.disabled
// 原客户端 tooltip 已停用并原样保留为
//   client_scripts/set_system/SetTooltip.legacy.js.disabled
//
// 当前职责：只在本文件声明套装；匹配、属性/药水/命令应用、tick 维护、
// 客户端 tooltip 同步全部由 MyMods/SetJS 的 Java 引擎完成。
// 每次 /reload 都会重新执行本文件，因此开头必须 SetJS.clear()。
// 字段说明见 MyMods/SetJS/README.md。
// ==========================================

// 兼容原有 JS 套装写法：旧的 registerSet(id, config) 原样可用，
// 实际转发给 SetJS，由 Java 引擎执行。
function registerSet(id, config) {
    SetJS.registerSet(id, config)
}

function registerAllSets() {
    SetJS.clear()

    // 圣遗物觉醒元素计算参数：与 startup_scripts/wooden_sword_inlay/config.js 保持一致。
    try {
        let inlayCfg = global.WOODEN_SWORD_INLAY_CONFIG
        if (inlayCfg != null && inlayCfg.nbt != null) {
            SetJS.setRelicConfig({
                maxSockets: inlayCfg.maxSockets,
                countKey: inlayCfg.nbt.count,
                prefix: inlayCfg.nbt.prefix,
                elementKey: inlayCfg.nbt.element,
                elements: Object.keys(inlayCfg.elements),
            })
        } else {
            console.error('[套装] 未找到 WOODEN_SWORD_INLAY_CONFIG，圣遗物套装元素匹配可能失效')
        }
    } catch (e) {
        console.error('[套装] 配置圣遗物参数失败: ' + e)
    }

    // ✅ 琥珀金套装：2件+1动能伤害，4件额外+2动能伤害（共+3）
    registerSet('oreganized:electrum', {
        name: '琥珀金套装',
        desc: [
            '§b2件套：§f+1 动能伤害',
            '§b4件套：§f额外 +2 动能伤害（共 +3）',
        ],
        slots: [
            { slot: 'HEAD', item: 'oreganized:electrum_helmet' },
            { slot: 'CHEST', item: 'oreganized:electrum_chestplate' },
            { slot: 'LEGS', item: 'oreganized:electrum_leggings' },
            { slot: 'FEET', item: 'oreganized:electrum_boots' },
        ],
        phases: [
            {
                requiredCount: 2,
                name: '2件套',
                effects: [
                    { type: 'attribute', attribute: 'oreganized:kinetic_damage', amount: 1, operation: 'ADDITION' },
                ],
            },
            {
                requiredCount: 4,
                name: '4件套',
                effects: [
                    { type: 'attribute', attribute: 'oreganized:kinetic_damage', amount: 2, operation: 'ADDITION' },
                ],
            },
        ],
    })

    // ✅ 骑士套装：2件+1宠物伤害，4件额外+2宠物伤害（共+3）
    registerSet('royalvariations:royal_knight', {
        name: '骑士套装',
        desc: [
            '§b2件套：§f+1 宠物伤害',
            '§b4件套：§f额外 +2 宠物伤害（共 +3）',
        ],
        slots: [
            { slot: 'HEAD', item: 'royalvariations:royal_knight_helmet' },
            { slot: 'CHEST', item: 'royalvariations:royal_knight_cuirass' },
            { slot: 'LEGS', item: 'royalvariations:royal_knight_leggings' },
            { slot: 'FEET', item: 'royalvariations:royal_knight_boots' },
        ],
        phases: [
            {
                requiredCount: 2,
                name: '2件套',
                effects: [
                    { type: 'attribute', attribute: 'rainbow:generic.pet_damage', amount: 1, operation: 'ADDITION' },
                ],
            },
            {
                requiredCount: 4,
                name: '4件套',
                effects: [
                    { type: 'attribute', attribute: 'rainbow:generic.pet_damage', amount: 2, operation: 'ADDITION' },
                ],
            },
        ],
    })

    // 八种觉醒元素：4 件与 5 件各加一份相同属性，两个阶段叠加即双倍。
    try {
        let relicCfg = global.WOODEN_SWORD_INLAY_CONFIG
        if (relicCfg == null || relicCfg.elements == null) {
            throw new Error('缺少圣遗物元素配置')
        }
        for (let elementId of Object.keys(relicCfg.elements)) {
            let def = relicCfg.elements[elementId]
            let slots = []
            for (let i = 0; i < 5; i++) {
                slots.push({ curios: true, item: relicCfg.relicId, relicElement: elementId })
            }
            registerSet('relic_' + elementId, {
                name: def.name + '元素圣遗物',
                slots: slots,
                phases: [
                    {
                        requiredCount: 4,
                        name: '4件套',
                        effects: [
                            { type: 'attribute', attribute: def.attribute, amount: def.amount, operation: def.operation },
                        ],
                    },
                    {
                        requiredCount: 5,
                        name: '5件套',
                        effects: [
                            { type: 'attribute', attribute: def.attribute, amount: def.amount, operation: def.operation },
                        ],
                    },
                ],
            })
        }
    } catch (e) {
        console.log('[套装] 注册圣遗物元素套装失败: ' + e)
    }

    console.log('[套装] 已通过 SetJS 注册套装数: ' + SetJS.count())
}

try {
    registerAllSets()
} catch (e) {
    console.error('[套装] SetJS 注册失败，请确认 MyMods/SetJS 已加载: ' + e)
}
