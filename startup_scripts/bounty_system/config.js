// priority: 950
// 复制一个悬赏对象即可新增内容。gateway 写对象时同步注册传送门；写字符串时引用已存在的复杂传送门。
// 内嵌传送门可设置外观、规则、每波怪物/时限/奖励、通关奖励；省略的属性使用 GatewaysJS 默认值。
// 高级写法：mobs 可写 { type, count, nbt, finalizeSpawn } 或 { json: '实体JSON' }。
// rewards 可写 { item, count, nbt } 或 { json: '奖励JSON' }；waves 可加 modifiersJson: ['修饰JSON']。
// failures 可写 { type: 'effect', effect, duration, amplifier }、{ type: 'explosion', strength, fire, blockDamage } 或 { json: '惩罚JSON' }。
global.RAINBOW_BOUNTY_CONFIG = {
    bounties: [
        {
            id: 'rainbow:slime_hunt', name: '史莱姆讨伐',
            gateway: {
                id: 'rainbow:slime_hunt_gate', size: 'small', color: 0x55ff55,
                rules: { spawnRange: 12 },
                waves: [
                    { mobs: [{ type: 'minecraft:slime', count: 3 }], maxTime: 800, setupTime: 100 },
                    { mobs: [{ type: 'minecraft:slime', count: 5 }], maxTime: 1000, setupTime: 100 }
                ],
                rewards: [{ item: 'minecraft:slime_ball', count: 16 }]
            }
        },
        {
            id: 'rainbow:spider_cleanup', name: '蛛网清剿',
            gateway: {
                id: 'rainbow:spider_cleanup_gate', size: 'medium', color: 0x734d93,
                tooltipText: '清理蛛群，赢取战利品',
                bossEvent: { mode: 'boss_bar', fog: false },
                rules: { spawnRange: 16, leashRange: 48, playerDamageOnly: true },
                waves: [
                    {
                        mobs: [{ type: 'minecraft:spider', count: 6 }],
                        maxTime: 1200, setupTime: 100,
                        rewards: [{ item: 'minecraft:string', count: 4 }]
                    }
                ],
                rewards: [{ item: 'minecraft:spider_eye', count: 8 }]
            }
        },
        {
            // 复杂传送门已在其他脚本或数据包中注册时，只填写其 ID。
            id: 'rainbow:night_patrol', name: '黑夜巡查', gateway: 'gateways:overworldian_nights'
        }
    ],

    // 下方为全局规则；通常只需编辑上方 bounties 列表。
    contractItem: 'rainbow:bounty_contract',
    guiOfferCount: 2,
    minDistance: 1000,
    maxDistance: 10000,
    maxAttempts: 12,
    triggerRadius: 16,
    spawnSearchRadius: 4,
    biomeBlacklist: ['#minecraft:is_ocean']
};
