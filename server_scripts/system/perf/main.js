// ==========================================
// 性能监测模块 - 主入口（system/perf）
// ==========================================
// 汇总 probe（埋点）、bench（微基准）、monitor（运行时监控）三个实现，
// 统一注册 /perf 命令（需要 OP 权限）：
//   /perf bench [轮数]   微基准：常见 KubeJS 操作的单次耗时（默认轻操作 5000 轮）
//   /perf monitor [秒]   运行时监控：TPS/实体数/内存采样（默认 60 秒）
//   /perf stats          查看埋点统计（global.perfTime 等接入后生效）
//   /perf reset          清零埋点统计
// 输出同时发送到聊天与服务端日志（logs/kubejs/server.log）留档。

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('perf')
            .requires(s => s.hasPermission(2))
            // 微基准：轮数为轻操作轮数，查询类自动按 1/10 折算
            .then(Commands.literal('bench')
                .then(Commands.argument('rounds', IntegerArgumentType.integer(100, 100000))
                    .executes(ctx => {
                        let player = ctx.source.getPlayer();
                        if (player == null) {
                            ctx.source.sendFailure(Component.string('§c基准测试需要由玩家执行'));
                            return 0;
                        }
                        let rounds = ctx.getArgument('rounds', Integer);
                        perfRunBench(player, rounds, Math.max(50, Math.floor(rounds / 10)), line => {
                            ctx.source.sendSuccess(Component.string(line), false);
                        });
                        return 1;
                    }))
                .executes(ctx => {
                    let player = ctx.source.getPlayer();
                    if (player == null) {
                        ctx.source.sendFailure(Component.string('§c基准测试需要由玩家执行'));
                        return 0;
                    }
                    perfRunBench(player, 5000, 300, line => {
                        ctx.source.sendSuccess(Component.string(line), false);
                    });
                    return 1;
                }))
            // 运行时监控：采样 N 秒后自动输出报告
            .then(Commands.literal('monitor')
                .then(Commands.argument('seconds', IntegerArgumentType.integer(10, 600))
                    .executes(ctx => {
                        let seconds = ctx.getArgument('seconds', Integer);
                        let msg = perfStartMonitor(ctx.source.getServer(), seconds, ctx.source.getPlayer() == null ? '' : ctx.source.getPlayer().username);
                        ctx.source.sendSuccess(Component.string(msg), false);
                        return 1;
                    }))
                .executes(ctx => {
                    let initiator = ctx.source.getPlayer() == null ? '' : ctx.source.getPlayer().username;
                    let msg = perfStartMonitor(ctx.source.getServer(), 60, initiator);
                    ctx.source.sendSuccess(Component.string(msg), false);
                    return 1;
                }))
            // 埋点统计：按总耗时降序输出
            .then(Commands.literal('stats')
                .executes(ctx => {
                    for (let line of perfProbeReport()) {
                        ctx.source.sendSuccess(Component.string(line), false);
                        console.info('[perf] ' + line);
                    }
                    return 1;
                }))
            // 埋点清零
            .then(Commands.literal('reset')
                .executes(ctx => {
                    perfResetProbes();
                    ctx.source.sendSuccess(Component.string('§a埋点统计已清零'), false);
                    return 1;
                }))
    );
});
