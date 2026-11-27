// priority: 1000
// ==========================================
// ☢ 纳垢赐福异常状态 + 纳垢之剑
// ==========================================
// 辐射层数使用 TheBuff 的 amplifier + 1 表示；单次附着 1 秒（20 tick）。
// 周期伤害交给 TheBuff 原生结算：每 200 tick 造成“每级 1 点 × 当前层数”的伤害。
// 超额层数需要在 server_scripts/radiation 中即时结算，这里通过 onApply 消费待结算值，
// 以复用 thebuff:buff 伤害类型与附着者归属。

StartupEvents.registry('thebuff:buff', event => {
    // 显式写命名空间：KubeJS 注册表的默认命名空间是 kubejs，必须写全 ID。
    event.create('rainbow:radiation')
        .name('纳垢赐福')
        // 用字符串形式，避免 Rhino 把数字参数选到 color(String) 重载。
        .color('#9FD63C')
        .category('harmful')
        .maxLevel(64)
        .damage(1.0, 200)
        .damageType('thebuff:buff')
        .ignoreInvulnerability(true)
        .applyImmediately(false)
        .showInHud(true)
        .onApply(ctx => {
            try {
                // 只有 server_scripts/radiation/main.js 会写入待结算伤害。
                // 先判断函数是否存在，避免客户端或半加载状态报错。
                if (typeof global.consumeRadiationExcess === 'function') {
                    global.consumeRadiationExcess(ctx)
                }
            }
            catch (err) {
                console.log('[radiation] onApply 结算失败: ' + err)
            }
        })
})

StartupEvents.registry('item', event => {
    // 纳垢之剑：铁级耐久模板，攻击面板 6 点；命中时由 server_scripts 附着纳垢赐福。
    event.create('rainbow:uranium_sword', 'sword')
        .tier(Tiers.IRON)
        .unstackable()
        .maxDamage(750)
        .attackDamageBaseline(6.0)
        .speedBaseline(-2.4)
        .texture('rainbow:item/uranium_sword')
        .parentModel('item/handheld')
        .glow(true)
})
