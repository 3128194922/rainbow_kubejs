// ==========================================
// 性能监测模块 - 埋点工具（probe）
// ==========================================
// 供其他模块手动接入的计时统计工具：
//   global.perfTime('名称', () => { ... })   包裹函数计时
//   global.perfBegin('名称') / global.perfEnd('名称')   手动区间计时
//   /perf stats 查看聚合结果，/perf reset 清零
// 埋点存储为模块内常量，/reload 后自动清零。

// 埋点统计存储：name -> { count: 调用次数, totalNs: 总耗时纳秒, maxNs: 单次最大耗时 }
const PERF_PROBES = {};

// 记录一次耗时（纳秒）；内部函数，供 perfTime/perfEnd 共用
function perfRecord(name, elapsedNs) {
    let probe = PERF_PROBES[name];
    if (probe == null) {
        probe = { count: 0, totalNs: 0, maxNs: 0 };
        PERF_PROBES[name] = probe;
    }
    probe.count++;
    probe.totalNs += elapsedNs;
    if (elapsedNs > probe.maxNs) probe.maxNs = elapsedNs;
}

// 包裹函数计时：返回被包裹函数的返回值；业务异常原样抛出，不影响原逻辑
global.perfTime = function (name, fn) {
    let start = MCUtil.getNanos();
    try {
        return fn();
    } finally {
        perfRecord(name, MCUtil.getNanos() - start);
    }
};

// 手动区间计时开始：与 perfEnd 配对使用
global.perfBegin = function (name) {
    PERF_PROBES['@begin:' + name] = MCUtil.getNanos();
};

// 手动区间计时结束：缺少配对的 perfBegin 时忽略本次
global.perfEnd = function (name) {
    let beginKey = '@begin:' + name;
    let start = PERF_PROBES[beginKey];
    if (start == null) return;
    delete PERF_PROBES[beginKey];
    perfRecord(name, MCUtil.getNanos() - start);
};

// 清零全部埋点统计（/perf reset 调用）
function perfResetProbes() {
    for (let key of Object.keys(PERF_PROBES)) delete PERF_PROBES[key];
}

// 输出埋点统计表：按总耗时降序，返回文本行数组供命令/日志输出
function perfProbeReport() {
    let names = Object.keys(PERF_PROBES).filter(k => PERF_PROBES[k].count != null);
    names.sort((a, b) => PERF_PROBES[b].totalNs - PERF_PROBES[a].totalNs);
    let lines = [];
    if (names.length === 0) {
        lines.push('§7当前没有埋点数据（需在代码中接入 global.perfTime / perfBegin / perfEnd）');
        return lines;
    }
    lines.push('§e埋点名称§r | §e调用次数§r | §e平均µs§r | §e最大ms§r | §e总耗时ms§r');
    for (let name of names) {
        let p = PERF_PROBES[name];
        let avgUs = (p.totalNs / p.count / 1000).toFixed(2);
        let maxMs = (p.maxNs / 1000000).toFixed(3);
        let totalMs = (p.totalNs / 1000000).toFixed(3);
        lines.push(`${name} | ${p.count} | ${avgUs} | ${maxMs} | ${totalMs}`);
    }
    return lines;
}
