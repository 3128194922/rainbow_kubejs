// ==========================================
// 性能监测模块 - 运行时监控（monitor）
// ==========================================
// 用法：/perf monitor [秒]（默认 60 秒）
// 每 20 tick（1 秒）采样：全服实体数、玩家数；
// 结束后输出实际 TPS（tick 计数差 / 真实时间差）与样本摘要。
// 注意：/reload 会重置本模块状态，监控自然中止，需重新发起。
// JVM 内存指标已移除：java.lang.Runtime 被 KubeJS 类过滤器默认拒绝且无允许的替代类。

// 监控状态：active 标记是否在采样，samples 存每秒样本
const PERF_MONITOR = { active: false, startTick: 0, startNanos: 0, samples: [], maxSeconds: 60, initiator: '' };

// 统计全服所有已加载维度的实体总数（每秒一次，O(n) 遍历可接受）
function perfCountEntities(server) {
    let total = 0;
    for (let level of server.getAllLevels()) {
        for (let e of level.getAllEntities()) total++;
    }
    return total;
}

// 开始监控；返回提示文本
function perfStartMonitor(server, seconds, initiatorName) {
    if (PERF_MONITOR.active) return '§c已有监控在进行中，请等待其结束后再发起';
    PERF_MONITOR.active = true;
    PERF_MONITOR.startTick = server.getTickCount();
    PERF_MONITOR.startNanos = MCUtil.getNanos();
    PERF_MONITOR.samples = [];
    PERF_MONITOR.maxSeconds = seconds;
    PERF_MONITOR.initiator = initiatorName;
    return '§a监控已开始，持续 ' + seconds + ' 秒；期间正常游玩/战斗，结束后自动输出报告';
}

// 采样与收尾：由本文件底部的 ServerEvents.tick 每 20 tick 调用一次
function perfMonitorTick(server) {
    if (!PERF_MONITOR.active) return;
    try {
        let elapsedSec = (MCUtil.getNanos() - PERF_MONITOR.startNanos) / 1000000000;
        if (elapsedSec >= PERF_MONITOR.maxSeconds) {
            perfFinishMonitor(server, elapsedSec);
            return;
        }
        let players = server.getPlayerList().getPlayers();
        PERF_MONITOR.samples.push({
            sec: Math.floor(elapsedSec),
            entities: perfCountEntities(server),
            players: players.size()
        });
    } catch (error) {
        console.log('[perf] 监控采样失败: ' + error);
    }
}

// 结束监控并输出报告：发送给发起玩家（在线时）并写入服务端日志留档
function perfFinishMonitor(server, elapsedSec) {
    PERF_MONITOR.active = false;
    try {
        let ticks = server.getTickCount() - PERF_MONITOR.startTick;
        let tps = ticks / elapsedSec;
        let samples = PERF_MONITOR.samples;
        let peakEntities = 0;
        for (let s of samples) {
            if (s.entities > peakEntities) peakEntities = s.entities;
        }
        let lines = [];
        lines.push('§a===== 性能监控报告（' + elapsedSec.toFixed(1) + ' 秒）=====');
        lines.push('实际 TPS: §e' + tps.toFixed(2) + '§r（' + ticks + ' ticks，满值 20.00）');
        lines.push('实体数: 峰值 §e' + peakEntities + '§r，末值 §e' + (samples.length > 0 ? samples[samples.length - 1].entities : 0) + '§r');
        lines.push('§7每10秒采样（秒|实体|玩家）:');
        for (let i = 0; i < samples.length; i += 10) {
            let s = samples[i];
            lines.push('  ' + s.sec + 's | ' + s.entities + ' | ' + s.players);
        }
        for (let line of lines) {
            console.info('[perf] ' + line);
            let p = server.getPlayer(PERF_MONITOR.initiator);
            if (p != null) p.tell(line);
        }
    } catch (error) {
        console.log('[perf] 监控报告输出失败: ' + error);
    }
}

// 监控驱动：服务端每 20 tick 采样一次；未激活时一次属性判断即返回，开销可忽略
ServerEvents.tick(event => {
    if (!PERF_MONITOR.active) return;
    if (event.server.getTickCount() % 20 !== 0) return;
    perfMonitorTick(event.server);
});
