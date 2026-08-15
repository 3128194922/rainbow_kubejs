// priority: 1500
// ==========================================
// 🎬 PlayerAnim (KubeJS Player Animator) global 全局函数封装
// ==========================================
// 前置 mod:
//   - kubejs_playeranim  (E:\Server_mod\Kubejs_for_PlayerAnimator)
//   - playeranimator
//
// 底层 API (由 KubeJSPlayerAnimPlugin 通过 registerBindings 注入):
//   PlayerAnim.play(player, animationId [, fadeTicks [, ease]])
//   PlayerAnim.stop(player [, fadeTicks [, ease]])
//   PlayerAnimEvents.play(event => { ... })  // 事件, 可修改/取消
//
// 本文件提供 global 函数封装, 供 server_scripts 各目录统一调用:
//   global.playPlayerAnim(player, animationId [, fadeTicks [, ease]])
//   global.stopPlayerAnim(player [, fadeTicks [, ease]])
//
// 封装特性:
//   1. 命名空间补全: "wave" → "kubejs_playeranim:wave" (与底层 ClientAnimHandler 一致)
//   2. 参数校验: player 为空/非 ServerPlayer 时安全跳过
//   3. 默认值: fadeTicks=20, ease="LINEAR"
//   4. try/catch 包裹, 防止 mod 未安装时报错
//   5. console.log 输出关键信息, 便于排查

// 默认命名空间 (与 ClientAnimHandler.DEFAULT_NAMESPACE 保持一致)
const PLAYER_ANIM_DEFAULT_NAMESPACE = "kubejs_playeranim"
// 默认淡入/淡出帧数
const PLAYER_ANIM_DEFAULT_FADE_TICKS = 20
// 默认缓动函数
const PLAYER_ANIM_DEFAULT_EASE = "LINEAR"

/**
 * 将动画ID规范化为 "namespace:path" 格式
 * "wave"            → "kubejs_playeranim:wave"
 * "kubejs_playeranim:wave" → 原样返回
 * "mymod:wave"      → 原样返回
 * "minecraft:wave"  → "kubejs_playeranim:wave"  (特判: ResourceLocationArgument 会把无命名空间的 "wave" 解析为 "minecraft:wave", 视作用户简写)
 *
 * 注意: KubeJS Rhino 中 Java String 对象的 typeof 是 "object" 而非 "string",
 *       因此使用 String() 强制转换为 JS 原生字符串, 避免 typeof 检查失败
 *
 * @param {string|java.lang.String} animationId
 * @returns {string|null} 规范化后的动画ID, 输入非法时返回 null
 */
function normalizeAnimId(animationId) {
    // 强制转为 JS 原生字符串 (处理 Java String 对象)
    let str = animationId == null ? "" : String(animationId)
    let trimmed = str.trim()
    if (trimmed.length === 0) return null
    if (trimmed.indexOf(":") < 0) return PLAYER_ANIM_DEFAULT_NAMESPACE + ":" + trimmed
    // 特判: ResourceLocationArgument 会把 "wave" 解析成 "minecraft:wave", 视作简写, 用默认命名空间替代
    if (trimmed.startsWith("minecraft:")) {
        return PLAYER_ANIM_DEFAULT_NAMESPACE + ":" + trimmed.substring("minecraft:".length)
    }
    return trimmed
}

/**
 * 检查 PlayerAnim 绑定对象是否可用 (kubejs_playeranim mod 是否安装)
 * @returns {boolean}
 */
function isPlayerAnimAvailable() {
    return (typeof PlayerAnim !== "undefined") && (PlayerAnim != null)
}

/**
 * 为指定玩家播放动画 (服务端调用, 多人同步)
 *
 * @param {Internal.Player} player      目标玩家 (必须是 ServerPlayer)
 * @param {string}          animationId 动画ID, "wave" 或 "kubejs_playeranim:wave" 或 "mymod:wave"
 * @param {number}          [fadeTicks] 淡入帧数, 默认 20
 * @param {string}          [ease]      缓动函数名, 默认 "LINEAR" (LINEAR/EASEINOUTQUAD/EASEINELASTIC 等, 大小写不敏感)
 * @returns {boolean} 是否成功调用 (true=已下发数据包, false=因校验失败或 mod 缺失而跳过)
 */
global.playPlayerAnim = function (player, animationId, fadeTicks, ease) {
    try {
        if (!isPlayerAnimAvailable()) {
            console.warn("[PlayerAnim] kubejs_playeranim mod 未安装, 跳过 play 调用")
            return false
        }
        // 参数校验
        if (player == null) {
            console.warn("[PlayerAnim] play 失败: player 为 null")
            return false
        }
        let normalizedId = normalizeAnimId(animationId)
        if (normalizedId == null) {
            console.warn(`[PlayerAnim] play 失败: animationId 非法 (player=${player.username || "?"}, input=${animationId})`)
            return false
        }
        // 默认值处理 (使用 Number/String 强制转换, 处理 Java Integer/String 对象)
        let ticksNum = fadeTicks == null ? NaN : Number(fadeTicks)
        let ticks = (!isNaN(ticksNum) && ticksNum >= 0) ? ticksNum : PLAYER_ANIM_DEFAULT_FADE_TICKS
        let easeStr = ease == null ? "" : String(ease)
        let easeName = easeStr.length > 0 ? easeStr.toUpperCase().trim() : PLAYER_ANIM_DEFAULT_EASE

        PlayerAnim.play(player, normalizedId, ticks, easeName)
        console.log(`[PlayerAnim] play: player=${player.username || "?"} anim=${normalizedId} fade=${ticks} ease=${easeName}`)
        return true
    } catch (e) {
        console.error(`[PlayerAnim] play 异常: ${e}`)
        return false
    }
}

/**
 * 为指定玩家停止当前动画 (带淡出)
 *
 * @param {Internal.Player} player      目标玩家
 * @param {number}          [fadeTicks] 淡出帧数, 默认 20
 * @param {string}          [ease]      缓动函数名, 默认 "LINEAR"
 * @returns {boolean} 是否成功调用
 */
global.stopPlayerAnim = function (player, fadeTicks, ease) {
    try {
        if (!isPlayerAnimAvailable()) {
            console.warn("[PlayerAnim] kubejs_playeranim mod 未安装, 跳过 stop 调用")
            return false
        }
        if (player == null) {
            console.warn("[PlayerAnim] stop 失败: player 为 null")
            return false
        }
        // 默认值处理 (使用 Number/String 强制转换, 处理 Java Integer/String 对象)
        let ticksNum = fadeTicks == null ? NaN : Number(fadeTicks)
        let ticks = (!isNaN(ticksNum) && ticksNum >= 0) ? ticksNum : PLAYER_ANIM_DEFAULT_FADE_TICKS
        let easeStr = ease == null ? "" : String(ease)
        let easeName = easeStr.length > 0 ? easeStr.toUpperCase().trim() : PLAYER_ANIM_DEFAULT_EASE

        PlayerAnim.stop(player, ticks, easeName)
        console.log(`[PlayerAnim] stop: player=${player.username || "?"} fade=${ticks} ease=${easeName}`)
        return true
    } catch (e) {
        console.error(`[PlayerAnim] stop 异常: ${e}`)
        return false
    }
}

console.log("[PlayerAnim] global.playPlayerAnim / global.stopPlayerAnim 已注册")
