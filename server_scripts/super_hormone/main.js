// priority: 1000
// 超级激素持续残影：技能持续期间用 Dyeing trail 维持一圈金色运动残影。
// 由 Skillwheel.js 在技能生效后调用；结束时间写入 persistentData，
// 供 startup_scripts/dodge_afterimage 避免用翻滚短残影覆盖。

// 金黄色，与 StealthAPI 的超级激素视角边框一致
const SUPER_HORMONE_AFTERIMAGE_COLOR = 'FFE000'
// 单个快照存活 tick
const SUPER_HORMONE_AFTERIMAGE_LIFETIME_TICKS = 12
// 最多同时回放的快照数
const SUPER_HORMONE_AFTERIMAGE_RENDER_SNAPSHOTS = 12
// 回放延迟快照数，让残影落在玩家身后
const SUPER_HORMONE_AFTERIMAGE_RENDER_DELAY = 1
// 持续 10 秒时的残影主体透明度，避免叠得过亮
const SUPER_HORMONE_AFTERIMAGE_MAX_ALPHA = 0.35
// 残影模型缩放
const SUPER_HORMONE_AFTERIMAGE_MIRAGE_SCALE = 1.0
// 客户端追踪范围（格）
const SUPER_HORMONE_AFTERIMAGE_TRACK_RANGE = 64
// 技能结束后额外保留的 tick，让最后一帧残影自然消散
const SUPER_HORMONE_AFTERIMAGE_LINGER_TICKS = 10
// 技能持续 tick 的回退值（当前 Skillwheel 固定 200）
const SUPER_HORMONE_AFTERIMAGE_DEFAULT_TICKS = 200
// 结束时间键，必须与 startup_scripts/dodge_afterimage/main.js 保持一致
const SUPER_HORMONE_AFTERIMAGE_UNTIL_KEY = 'rainbow:super_hormone_afterimage_until'

/**
 * 在超级激素持续期间给玩家维持金色残影。
 * @param {Internal.ServerPlayer} player
 * @param {number} [durationTicks] 技能持续时间
 * @returns {boolean} 是否成功写入 Dyeing
 */
global.applySuperHormoneAfterimage = function (player, durationTicks) {
    try {
        if (player == null) return false
        let level = player.level
        if (level == null || level.isClientSide()) return false
        if (typeof Dyeing === 'undefined' || Dyeing == null) return false

        let duration = SUPER_HORMONE_AFTERIMAGE_DEFAULT_TICKS
        if (durationTicks != null && durationTicks > 0) duration = durationTicks

        let now = level.getTime()
        Dyeing.trail(level, player.getUuid().toString(), {
            mode: 'trail',
            color: SUPER_HORMONE_AFTERIMAGE_COLOR,
            lifetime: SUPER_HORMONE_AFTERIMAGE_LIFETIME_TICKS,
            render_snapshots: SUPER_HORMONE_AFTERIMAGE_RENDER_SNAPSHOTS,
            render_delay: SUPER_HORMONE_AFTERIMAGE_RENDER_DELAY,
            max_alpha: SUPER_HORMONE_AFTERIMAGE_MAX_ALPHA,
            mirage_scale: SUPER_HORMONE_AFTERIMAGE_MIRAGE_SCALE,
            track_range: SUPER_HORMONE_AFTERIMAGE_TRACK_RANGE,
            duration_ticks: duration + SUPER_HORMONE_AFTERIMAGE_LINGER_TICKS
        })
        // 只在 trail 写入成功后标记结束时间，避免 Dyeing 失败时误屏蔽翻滚残影
        player.persistentData.putLong(SUPER_HORMONE_AFTERIMAGE_UNTIL_KEY, now + duration)
        return true
    } catch (e) {
        console.log('[超级激素残影] 应用失败: ' + e)
        return false
    }
}
