// ==========================================
// 性能监测模块 - 微基准测试（bench）
// ==========================================
// 测量本项目热路径中常见 KubeJS 操作的单次耗时，用于量化"哪种写法贵"。
// 用法：/perf bench [每项轮数]（默认：轻操作 5000 次 / 查询类 300 次）
// 结果为命令执行瞬间的相对成本，实体查询项与执行位置当前实体数相关。

// 单个基准项：预热 warmup 次后正式计时 iterations 次，返回 { name, avgUs, totalMs }
function perfBenchItem(name, warmup, iterations, fn) {
    for (let i = 0; i < warmup; i++) fn(i);
    let start = MCUtil.getNanos();
    for (let i = 0; i < iterations; i++) fn(i);
    let elapsedNs = MCUtil.getNanos() - start;
    return {
        name: name,
        avgUs: elapsedNs / iterations / 1000,
        totalMs: elapsedNs / 1000000
    };
}

// 运行全部基准项；player 为执行命令的玩家（提供 NBT/实体查询上下文），sendLine 为输出回调
function perfRunBench(player, lightRounds, queryRounds, sendLine) {
    let results = [];
    let level = player.getLevel();
    let px = player.getX();
    let py = player.getY();
    let pz = player.getZ();
    let probeTag = 'PerfBenchProbe';

    try {
        // 基线：纯 JS 数值运算，其余项与它对比
        let base = 0;
        results.push(perfBenchItem('基线-JS加法', 200, lightRounds, i => { base = base + i; }));

        // NBT 读写：persistentData 是各 tick 处理器最常用的早退判据
        results.push(perfBenchItem('persistentData.getLong(不存在键)', 200, lightRounds, () => {
            player.persistentData.getLong(probeTag);
        }));
        results.push(perfBenchItem('persistentData读写字符串', 200, lightRounds, i => {
            player.persistentData.putString(probeTag, 'v' + i);
            player.persistentData.getString(probeTag);
        }));
        player.persistentData.remove(probeTag);

        // UUID 字符串转换：宠物系统目标选择器谓词每次比较两边的成本
        results.push(perfBenchItem('getUuid().toString()', 200, lightRounds, () => {
            player.getUuid().toString();
        }));

        // 距离计算：敌对目标筛选常用
        let other = player;
        results.push(perfBenchItem('distanceToSqr(同实体)', 200, lightRounds, () => {
            player.distanceToSqr(other.getX(), other.getY(), other.getZ());
        }));

        // AABB 创建：范围查询前的盒子分配
        results.push(perfBenchItem('new AABB(半径4盒子)', 200, lightRounds, () => {
            new AABB(px - 4, py - 4, pz - 4, px + 4, py + 4, pz + 4);
        }));

        // 物品栈读取：power_sword 等每 tick 取手部物品的成本
        results.push(perfBenchItem('getItemBySlot(head).id', 200, lightRounds, () => {
            player.getItemBySlot('head').id;
        }));
        results.push(perfBenchItem('Item.of(minecraft:stone)', 200, lightRounds, () => {
            Item.of('minecraft:stone');
        }));

        // 范围实体查询：技能命中/光环扫描的核心成本（与当前实体密度相关）
        results.push(perfBenchItem('getEntitiesWithin(半径4)', 50, queryRounds, () => {
            let hits = 0;
            for (let e of level.getEntitiesWithin(new AABB(px - 4, py - 4, pz - 4, px + 4, py + 4, pz + 4))) hits++;
        }));
        results.push(perfBenchItem('getEntitiesWithin(半径16)', 50, queryRounds, () => {
            let hits = 0;
            for (let e of level.getEntitiesWithin(new AABB(px - 16, py - 16, pz - 16, px + 16, py + 16, pz + 16))) hits++;
        }));

        // 全量实体遍历 + UUID 字符串过滤：MobTameServer 目标选择器的实际写法
        results.push(perfBenchItem('getEntities()全量+UUID过滤', 10, Math.max(20, Math.floor(queryRounds / 5)), () => {
            let found = null;
            for (let e of level.getEntities()) {
                if (e.getUuid().toString() == '00000000-0000-0000-0000-000000000000') found = e;
            }
            return found;
        }));

        // 输出：按平均耗时降序，标注相对基线倍数
        let baseUs = results[0].avgUs;
        results.sort((a, b) => b.avgUs - a.avgUs);
        sendLine('§a===== KubeJS 微基准结果（玩家: ' + player.username + '，维度: ' + level.getDimension() + '）=====');
        for (let r of results) {
            let line = r.name + ': 平均 ' + r.avgUs.toFixed(2) + ' µs/次（相对基线 x' + (r.avgUs / baseUs).toFixed(0) + '，总 ' + r.totalMs.toFixed(1) + ' ms）';
            sendLine(line);
            console.info('[perf] ' + line);
        }
        sendLine('§7说明：实体查询成本随当前区域实体数变化；全量遍历项即宠物系统目标选择谓词的写法成本。');
    } catch (error) {
        console.log('[perf] 微基准执行失败: ' + error);
        sendLine('§c微基准执行失败: ' + error);
    }
}
