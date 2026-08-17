// priority: 0
// ============================================================
// 传送门：僵尸大军（36名僵尸）
// 基于 GatewaysJS（gatewaysjs-1.6，Gateway.customBuilder API）实现
// 注意：Gateway 全局绑定由 GatewaysJS 插件提供；注册放在 ServerEvents.recipes 服务端事件中（wiki 推荐方式）
// 显示名 = .name() 直接文本（GatePearlItemNameMixin 会同步为珍珠显示名，不再走翻译键）
// 实体 desc = 翻译键（rainbow.zombie_horde.assault / .wicked，定义于 assets/rainbow/lang/zh_cn.json）
// ============================================================
const ZOMBIE_HORDE_ID = 'rainbow:zombie_horde'

ServerEvents.recipes(event => {
    try {
        Gateway.customBuilder(ZOMBIE_HORDE_ID)
            // 直接显示名称（不走翻译键，mixin 会同步到珍珠显示名）
            .name('最后的大队-极恶中队')

            // 珍珠悬停提示文本
            .tooltipText('18名亡灵突击队（PVP大佬版）')

            // 传送门大小：small / medium / large
            .size('large')

            // 传送门颜色（0xRRGGBB）
            .color(0x55ff55)

            // Boss 条显示：boss_bar（血条）模式 + 开启雾气（黑暗笼罩效果）
            .bossEvent('boss_bar', true)

            // 规则（10 参数顺序：spawnRange, leashRange, allowDiscarding, allowDimChange,
            //          playerDamageOnly, removeMobsOnFailure, failOnOutOfBounds,
            //          spacing, followRangeBoost, defaultDropChance）
            .rules(36, 64, true, true, false, true, true, 36, 64, 0.0)

            // 第一波（共36名）：亡灵突击队（僵尸宝宝）+ wicked
            .addWave(wave => {
                // 亡灵突击队（baby形态）：necromium 斧 + 猪灵盾牌 + necromium 全身甲
                wave.addEntity('minecraft:zombie', 18).modify(entity => {
                    entity.setDescription('rainbow.zombie_horde.assault')
                    // baby + 装备通过 NBT 设置（HandItems 2槽：主手/副手；ArmorItems 4槽：脚、腿、胸、头）
                    entity.addNbt('{IsBaby:1b,HandItems:[{id:"caverns_and_chasms:necromium_axe",Count:1b},{id:"piglinproliferation:buckler",Count:1b}],ArmorItems:[{id:"caverns_and_chasms:necromium_boots",Count:1b},{id:"caverns_and_chasms:necromium_leggings",Count:1b},{id:"caverns_and_chasms:necromium_chestplate",Count:1b},{id:"caverns_and_chasms:necromium_helmet",Count:1b}]}')
                    entity.finalizeSpawn(false)  // 关闭 finalizeSpawn 随机装备/宝宝逻辑，保持固定配置
                })
                wave.addEntityLootReward('minecraft:zombie', 10)  // 波次奖励：僵尸战利品表抽取 10 次
                // 波次奖励：200 经验。注意 orbSize 必须显式传 >0 的值！
                // gatewaysjs 单参 addExperienceReward(xp) 默认 orbSize=0，
                // XpReward.generateLoot 是 while(remaining > 0) { remaining -= orbSize; ... }
                // orbSize=0 时死循环无限生成经验球，直接卡死服务器
                wave.addExperienceReward(200, 25)                 // 8 个 25xp 大球，避免小球数量过多
                wave.maxTime(1200)                                // 波次时限（tick）
                wave.setupTime(120)                               // 波次间隔（tick）
            })

            // 完成传送门后的奖励
            .addReward('minecraft:diamond', 5)

            // 失败惩罚：失明 20 秒（400 tick）
            .addMobEffectFailure('minecraft:blindness', 400)

            // 注册传送门（同 ID 已注册时自动替换旧注册）
            .register()

    } catch (err) {
        console.error('[Gateways] 传送门 ' + ZOMBIE_HORDE_ID + ' 注册失败: ' + err)
    }
})