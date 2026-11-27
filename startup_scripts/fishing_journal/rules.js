// priority: 110
// ==========================================
// 百鱼手册奖励规则（纯函数，便于 Node 测试）
// ==========================================
// 里程碑按图鉴解锁百分比计算；特殊鱼类按 Tide 稀有度分档。
// 修改奖励时只需要改这里，main.js 会按表发放。

global.FISH_JOURNAL_MILESTONES = [
    {
        percent: 10,
        name: "初识百鱼",
        rewards: [
            ["tide:bait", 8],
            ["tide:fish_slice", 4]
        ]
    },
    {
        percent: 25,
        name: "渐入佳境",
        rewards: [
            ["tide:fish_finder", 1],
            ["tide:lucky_bait", 4],
            ["minecraft:emerald", 4]
        ]
    },
    {
        percent: 50,
        name: "半部鱼经",
        rewards: [
            ["tide:lunar_calendar", 1],
            ["tide:weather_radio", 1],
            ["tide:wooden_crate", 1]
        ]
    },
    {
        percent: 75,
        name: "鱼类专家",
        rewards: [
            ["tide:diamond_fishing_rod", 1],
            ["tide:abyss_bait", 4],
            ["tide:purpur_crate", 1]
        ]
    },
    {
        percent: 100,
        name: "百鱼全书",
        rewards: [
            ["rainbow:lucky_charm", 1],
            ["tide:midas_fishing_rod", 1],
            ["tide:obsidian_crate", 2]
        ]
    }
]

global.FISH_JOURNAL_SPECIAL_REWARDS = {
    rare: {
        name: "稀有",
        rewards: [
            ["tide:bait", 2],
            ["minecraft:emerald", 1]
        ]
    },
    very_rare: {
        name: "极稀有",
        rewards: [
            ["tide:lucky_bait", 2],
            ["minecraft:nautilus_shell", 1]
        ]
    },
    legendary: {
        name: "传说",
        rewards: [
            ["tide:magnetic_bait", 2],
            ["minecraft:heart_of_the_sea", 1],
            ["tide:wooden_crate", 1]
        ]
    }
}

// 返回当前解锁数已达成的里程碑数量（0 ~ 里程碑总数）。
// 用整数比较避免浮点误差：unlocked/total >= percent/100  <=>  unlocked*100 >= percent*total
global.getFishJournalMilestoneCount = function (unlocked, total) {
    if (total == null || total <= 0 || unlocked == null || unlocked <= 0) return 0
    let count = 0
    for (let i = 0; i < global.FISH_JOURNAL_MILESTONES.length; i++) {
        let milestone = global.FISH_JOURNAL_MILESTONES[i]
        if (unlocked * 100 >= milestone.percent * total) count++
    }
    return count
}

// Tide 稀有度 key -> 特殊奖励档位；common/uncommon 不触发。
global.getFishJournalSpecialTier = function (rarityKey) {
    if (rarityKey == null) return null
    let key = String(rarityKey).toLowerCase()
    if (key === "legendary") return "legendary"
    if (key === "very_rare") return "very_rare"
    if (key === "rare") return "rare"
    return null
}
