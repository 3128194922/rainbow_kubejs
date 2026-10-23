// priority: 950
// 复制一个悬赏对象即可新增内容。gateway 写对象时同步注册传送门；写字符串时引用已存在的复杂传送门。
// 内嵌传送门可设置外观、规则、每波怪物/时限/奖励、通关奖励；省略的属性使用 GatewaysJS 默认值。
// 高级写法：mobs 可写 { type, count, nbt, finalizeSpawn } 或 { json: '实体JSON' }。
// rewards 可写 { item, count, nbt } 或 { json: '奖励JSON' }；waves 可加 modifiersJson: ['修饰JSON']。
// failures 可写 { type: 'effect', effect, duration, amplifier }、{ type: 'explosion', strength, fire, blockDamage } 或 { json: '惩罚JSON' }。
// Monster Expansion v0.7.6 的五种大型 Boss 各占一项委托，每次只召唤本体 1 只；不生成断尾或部位实体。
// 每项限时 36000 tick（30 分钟），准备 100 tick（5 秒）；扩大活动范围，保留 Boss 自身掉落，不附加通关奖励。
global.RAINBOW_BOUNTY_CONFIG = {
    bounties: [
        {
            id: 'rainbow:skrythe_hunt', name: 'Skrythe 讨伐',
            gateway: {
                id: 'rainbow:skrythe_hunt_gate', size: 'large', color: 0x734d93,
                tooltipText: '讨伐 1 只 Skrythe，限时 30 分钟',
                rules: { spawnRange: 24, leashRange: 128 },
                waves: [
                    { mobs: [{ type: 'monsterexpansion:skrythe', count: 1 }], maxTime: 36000, setupTime: 100 }
                ],
                rewards: []
            }
        },
        {
            id: 'rainbow:ignathos_hunt', name: 'Ignathos 讨伐',
            gateway: {
                id: 'rainbow:ignathos_hunt_gate', size: 'large', color: 0xff6622,
                tooltipText: '讨伐 1 只 Ignathos，限时 30 分钟',
                rules: { spawnRange: 24, leashRange: 128 },
                waves: [
                    { mobs: [{ type: 'monsterexpansion:ignathos', count: 1 }], maxTime: 36000, setupTime: 100 }
                ],
                rewards: []
            }
        },
        {
            id: 'rainbow:rhyza_hunt', name: 'Rhyza 讨伐',
            gateway: {
                id: 'rainbow:rhyza_hunt_gate', size: 'large', color: 0xffdd55,
                tooltipText: '讨伐 1 只 Rhyza，限时 30 分钟',
                rules: { spawnRange: 24, leashRange: 128 },
                waves: [
                    { mobs: [{ type: 'monsterexpansion:rhyza', count: 1 }], maxTime: 36000, setupTime: 100 }
                ],
                rewards: []
            }
        },
        {
            id: 'rainbow:leivekilth_hunt', name: 'Leivekilth 讨伐',
            gateway: {
                id: 'rainbow:leivekilth_hunt_gate', size: 'large', color: 0x66ccff,
                tooltipText: '讨伐 1 只 Leivekilth，限时 30 分钟',
                rules: { spawnRange: 24, leashRange: 128 },
                waves: [
                    { mobs: [{ type: 'monsterexpansion:leivekilth', count: 1 }], maxTime: 36000, setupTime: 100 }
                ],
                rewards: []
            }
        },
        {
            id: 'rainbow:rakoth_hunt', name: 'Rakoth 讨伐',
            gateway: {
                id: 'rainbow:rakoth_hunt_gate', size: 'large', color: 0x997755,
                tooltipText: '讨伐 1 只 Rakoth，限时 30 分钟',
                rules: { spawnRange: 24, leashRange: 128 },
                waves: [
                    { mobs: [{ type: 'monsterexpansion:rakoth', count: 1 }], maxTime: 36000, setupTime: 100 }
                ],
                rewards: []
            }
        }
    ],

    // 下方为全局规则；通常只需编辑上方 bounties 列表。
    contractItem: 'rainbow:bounty_contract',
    // GUI 最多同时展示 5 项；不足 5 项时全部展示，超过时无重复随机抽取。
    guiOfferCount: 5,
    minDistance: 1000,
    maxDistance: 10000,
    maxAttempts: 12,
    triggerRadius: 16,
    spawnSearchRadius: 4,
    biomeBlacklist: ['#minecraft:is_ocean']
};
