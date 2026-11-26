// priority: 1000
// 主动闪避残影：CombatRoll（战术翻滚）开始瞬间，用 Dyeing 的 trail 模式回放玩家翻滚姿态。
// 覆盖范围：玩家按翻滚键触发的真实翻滚，包括依赖 CombatRoll 的枪械翻滚；不含 MechanicianCombat 的纯滑铲。
// 注意：Dyeing 的 trail 是每个实体单条配置，本效果会覆盖该玩家已有的 trail，计时结束后一并移除。

// 残影颜色（RGB 十六进制；Dyeing 会补全 FF 透明度，最终透明度由 max_alpha 控制）
const DODGE_AFTERIMAGE_COLOR = '8FE9FF'
// 单个快照存活 tick，越小残影消散越快
const DODGE_AFTERIMAGE_LIFETIME_TICKS = 10
// 最多同时回放的快照数
const DODGE_AFTERIMAGE_RENDER_SNAPSHOTS = 10
// 回放延迟快照数，让残影落在玩家身后
const DODGE_AFTERIMAGE_RENDER_DELAY = 1
// 残影主体最大透明度
const DODGE_AFTERIMAGE_MAX_ALPHA = 0.42
// 残影模型缩放
const DODGE_AFTERIMAGE_MIRAGE_SCALE = 0.98
// 客户端追踪范围（格）
const DODGE_AFTERIMAGE_TRACK_RANGE = 64
// 事件未提供有效翻滚时长时的回退值（当前服务端 roll_duration = 8）
const DODGE_AFTERIMAGE_DEFAULT_ROLL_TICKS = 8
// 翻滚结束后额外保留的 tick，避免残影瞬间消失
const DODGE_AFTERIMAGE_LINGER_TICKS = 2
// 同一玩家的重复事件窗口（tick），用于吃掉同一次翻滚的重复回调
const DODGE_AFTERIMAGE_DUPLICATE_TICKS = 2

// uuid -> 上次应用残影的 gameTime
const dodgeAfterimageLastTick = {}

/**
 * 给玩家挂一次主动闪避残影。
 * @param {Internal.ServerPlayer} player
 * @param {number} [rollDurationTicks] CombatRoll 事件回传的翻滚时长
 * @returns {boolean} 是否成功写入 Dyeing
 */
global.playDodgeAfterimage = function (player, rollDurationTicks) {
    try {
        if (player == null) return false
        let level = player.level
        if (level == null || level.isClientSide()) return false
        if (typeof Dyeing === 'undefined' || Dyeing == null) return false

        let now = level.getTime()
        let uuid = player.getUuid().toString()
        let last = dodgeAfterimageLastTick[uuid]
        if (last != null && now >= last && now - last <= DODGE_AFTERIMAGE_DUPLICATE_TICKS) return false
        dodgeAfterimageLastTick[uuid] = now

        let duration = DODGE_AFTERIMAGE_DEFAULT_ROLL_TICKS
        if (rollDurationTicks != null && rollDurationTicks > 0) duration = rollDurationTicks
        duration = duration + DODGE_AFTERIMAGE_LINGER_TICKS

        Dyeing.trail(level, uuid, {
            mode: 'trail',
            color: DODGE_AFTERIMAGE_COLOR,
            lifetime: DODGE_AFTERIMAGE_LIFETIME_TICKS,
            render_snapshots: DODGE_AFTERIMAGE_RENDER_SNAPSHOTS,
            render_delay: DODGE_AFTERIMAGE_RENDER_DELAY,
            max_alpha: DODGE_AFTERIMAGE_MAX_ALPHA,
            mirage_scale: DODGE_AFTERIMAGE_MIRAGE_SCALE,
            track_range: DODGE_AFTERIMAGE_TRACK_RANGE,
            duration_ticks: duration
        })
        return true
    } catch (e) {
        console.log('[主动闪避残影] 应用失败: ' + e)
        return false
    }
}

// CombatRoll 真实翻滚开始事件（服务端 Forge 总线）
ForgeEvents.onEvent('net.combatroll.forge.event.CombatRollEvent', event => {
    try {
        let player = event.getPlayer()
        if (player == null) return
        global.playDodgeAfterimage(player, event.getRollDuration())
    } catch (e) {
        console.log('[主动闪避残影] CombatRollEvent 处理失败: ' + e)
    }
})
