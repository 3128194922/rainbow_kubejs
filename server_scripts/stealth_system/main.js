// priority: 0
// ==========================================
// 潜行系统 - 服务端：isStealth 状态同步到客户端
// Stealth System (Server) - stealth state client sync
// ==========================================
// 隐匿状态（persistentData 布尔 `isStealth`，默认 true）由纯 KubeJS 维护：
//   - 被任意怪物索敌锁定目标时：startup_scripts/stealth_system/main.js 里
//     监听的 Forge 事件（LivingChangeTargetEvent，覆盖 MOB_TARGET 与
//     BEHAVIOR_TARGET 两套索敌系统）即时置为 false，并排队 5 秒（100 tick）
//     定时恢复；5 秒内再次被索敌则重置计时（令牌机制），到期自动恢复 true。
//     （无任何轮询扫描，被索敌瞬间由事件即时感知。）
//
// 本文件职责：通过 KubeJS 自定义网络将 isStealth 变化推送给客户端，
// 客户端 client_scripts/stealth_system/main.js 据此渲染潜行黑边视角。
// 统一读写函数 global.getStealthState / global.setStealthState 定义在
// startup_scripts/stealth_system/main.js（服务端与客户端双侧均可访问）。
// ==========================================

// KubeJS 网络通道名，与客户端 stealth_system/main.js 必须一致
const STEALTH_SYNC_CHANNEL = "stealth_sync";

// 状态变化检测周期（tick）。每 5 tick ≈ 0.25s 检查一次，变化时才推送。
// 被索敌的 false 写入是事件即时发生的；恢复 true 由 startup 侧定时回调
// 完成写入，推送最多滞后一个检测周期（0.25s），两个方向感知延迟 ≤0.25s。
const STEALTH_CHECK_INTERVAL = 5;

// 记录每个玩家最近一次已发送的状态，避免频繁发送相同值占用网络
let lastSentState = {};

// 向当前玩家客户端发送一条隐匿状态
function sendStealthState(player) {
    try {
        let isStealth = global.getStealthState(player);
        player.sendData(STEALTH_SYNC_CHANNEL, { isStealth: isStealth });
    } catch (err) {
        console.log(`[stealth_system] 发送隐匿状态失败: ${err}`);
    }
}

// 玩家登录：强制初始化为隐匿状态（true）并推送一次
// 防止两种情况遗留 isStealth=false，导致玩家"永远"处于暴露状态：
//   1) 在 5s 暴露窗口内退出游戏：定时恢复回调在实体下线/GC 后执行，
//      无法可靠落盘，重新登录时读到的仍是旧的 false；
//   2) 服务端重启：scheduleInTicks 排队任务全部丢失，已落盘的 false 无人恢复。
//   登录点统一重置 true，保证每次进入世界都从隐匿状态开始。
PlayerEvents.loggedIn(event => {
    let player = event.player;
    if (player === null || player === undefined) return;
    let uuid = String(player.uuid);
    global.setStealthState(player, true);
    lastSentState[uuid] = true;
    sendStealthState(player);
    console.log(`[stealth_system] 玩家登录，初始化 isStealth=true`);
});

// 玩家登出：清理缓存
PlayerEvents.loggedOut(event => {
    let player = event.player;
    if (player === null || player === undefined) return;
    let uuid = String(player.uuid);
    delete lastSentState[uuid];
});

// 周期性检测：isStealth 变化时推送到客户端
// （状态写入由 startup_scripts 事件即时完成，此处仅负责感知与同步）
PlayerEvents.tick(event => {
    let player = event.player;
    if (player === null || player === undefined) return;

    // 状态变化检测（变化时才推送，避免每 tick 都发相同值）
    if (player.age % STEALTH_CHECK_INTERVAL !== 0) return;

    let uuid = String(player.uuid);
    let current = global.getStealthState(player);

    if (lastSentState[uuid] !== current) {
        lastSentState[uuid] = current;
        sendStealthState(player);
        console.log(`[stealth_system] 玩家状态变化 -> isStealth=${current}`);
    }
});