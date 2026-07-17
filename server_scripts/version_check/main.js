// priority: 0
// ==========================================
// 版本检测 - 玩家登录警告
// ==========================================

PlayerEvents.loggedIn(event => {
    let warnings = global._VERSION_WARNINGS
    if (warnings && warnings.length > 0) {
        event.player.tell(Text.red('§l[版本检测] 发现以下兼容性问题:'))
        warnings.forEach(function (msg) {
            event.player.tell(Text.red('  §7- §r' + msg))
        })
    }
})
