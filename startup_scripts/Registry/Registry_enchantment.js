// priority: 1000
// ==========================================
// ✨ 注册附魔
// ==========================================
StartupEvents.registry("enchantment", (event) => {
    // 屹立不倒：稀有度为 rare，适用于护甲，最高等级 2
    event.create("rainbow:last_stand")
        .rarity("rare")
        .armor()
        .maxLevel(2)

    // 生灵火 - 火焰附加：稀有度为 rare，最高等级 2，适用于武器
    event.create("rainbow:living_fire_aspect")
        .rarity("rare")
        .maxLevel(2)
        .weapon()

    // 末影火 - 火焰附加：稀有度为 rare，最高等级 2，适用于武器
    event.create("rainbow:ender_fire_aspect")
        .rarity("rare")
        .maxLevel(2)
        .weapon()
});
