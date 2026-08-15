// priority: 1400
// ==========================================
// 🎬 PlayerAnim 演示命令
// ==========================================
// 依赖: server_scripts/player_animator/main.js (priority 1500, 先于本文件加载)
//
// 命令:
//   /playanim <animationId> [fadeTicks] [ease]   为自己播放动画
//   /stopanim [fadeTicks] [ease]                  停止自己的动画
//   /playanimwave                                 快捷挥手动画 (= /playanim kubejs_playeranim:wave 10 EASEINOUTQUAD)
//
// 命令需要权限等级 2 (OP)
// 动画资源路径: assets/<namespace>/player_animation/<path>.json
//
// 注意: animationId 必须使用 ResourceLocation 格式 (namespace:path 或裸 path)
//   - /playanim rainbow:superearch       完整 ID
//   - /playanim kubejs_playeranim:wave   完整 ID
//   - /playanim wave                     简写 (会被 ResourceLocationArgument 解析为 minecraft:wave, main.js 中特判为 kubejs_playeranim:wave)

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event

    // /playanim <animationId> [fadeTicks] [ease]
    // animationId 使用 RESOURCE_LOCATION (支持冒号), 不能用 STRING (STRING 不允许冒号字符)
    event.register(
        Commands.literal("playanim")
            .requires(src => src.hasPermission(2))
            .then(Commands.argument("animationId", Arguments.RESOURCE_LOCATION.create(event))
                .executes(ctx => {
                    let player = ctx.getSource().getPlayerOrException()
                    let animRl = Arguments.RESOURCE_LOCATION.getResult(ctx, "animationId")
                    let animId = animRl.toString()
                    let ok = global.playPlayerAnim(player, animId)
                    if (ok) {
                        ctx.getSource().sendSuccess(`§a播放动画: §e${animId}`, false)
                    } else {
                        ctx.getSource().sendFailure(`§c播放动画失败: §e${animId}§c (检查 mod 是否安装 / 动画文件是否存在)`)
                    }
                    return ok ? 1 : 0
                })
                .then(Commands.argument("fadeTicks", Arguments.INTEGER.create(event))
                    .executes(ctx => {
                        let player = ctx.getSource().getPlayerOrException()
                        let animRl = Arguments.RESOURCE_LOCATION.getResult(ctx, "animationId")
                        let animId = animRl.toString()
                        let fadeTicks = Arguments.INTEGER.getResult(ctx, "fadeTicks")
                        let ok = global.playPlayerAnim(player, animId, fadeTicks)
                        if (ok) {
                            ctx.getSource().sendSuccess(`§a播放动画: §e${animId}§7(fade=${fadeTicks})`, false)
                        } else {
                            ctx.getSource().sendFailure(`§c播放动画失败: §e${animId}`)
                        }
                        return ok ? 1 : 0
                    })
                    .then(Commands.argument("ease", Arguments.STRING.create(event))
                        .executes(ctx => {
                            let player = ctx.getSource().getPlayerOrException()
                            let animRl = Arguments.RESOURCE_LOCATION.getResult(ctx, "animationId")
                            let animId = animRl.toString()
                            let fadeTicks = Arguments.INTEGER.getResult(ctx, "fadeTicks")
                            let ease = Arguments.STRING.getResult(ctx, "ease")
                            let ok = global.playPlayerAnim(player, animId, fadeTicks, ease)
                            if (ok) {
                                ctx.getSource().sendSuccess(`§a播放动画: §e${animId}§7(fade=${fadeTicks}, ease=${ease})`, false)
                            } else {
                                ctx.getSource().sendFailure(`§c播放动画失败: §e${animId}`)
                            }
                            return ok ? 1 : 0
                        })
                    )
                )
            )
    )

    // /stopanim [fadeTicks] [ease]
    event.register(
        Commands.literal("stopanim")
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.getSource().getPlayerOrException()
                let ok = global.stopPlayerAnim(player)
                if (ok) {
                    ctx.getSource().sendSuccess(`§a已停止当前动画`, false)
                } else {
                    ctx.getSource().sendFailure(`§c停止动画失败`)
                }
                return ok ? 1 : 0
            })
            .then(Commands.argument("fadeTicks", Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let player = ctx.getSource().getPlayerOrException()
                    let fadeTicks = Arguments.INTEGER.getResult(ctx, "fadeTicks")
                    let ok = global.stopPlayerAnim(player, fadeTicks)
                    if (ok) {
                        ctx.getSource().sendSuccess(`§a已停止动画 §7(fade=${fadeTicks})`, false)
                    } else {
                        ctx.getSource().sendFailure(`§c停止动画失败`)
                    }
                    return ok ? 1 : 0
                })
                .then(Commands.argument("ease", Arguments.STRING.create(event))
                    .executes(ctx => {
                        let player = ctx.getSource().getPlayerOrException()
                        let fadeTicks = Arguments.INTEGER.getResult(ctx, "fadeTicks")
                        let ease = Arguments.STRING.getResult(ctx, "ease")
                        let ok = global.stopPlayerAnim(player, fadeTicks, ease)
                        if (ok) {
                            ctx.getSource().sendSuccess(`§a已停止动画 §7(fade=${fadeTicks}, ease=${ease})`, false)
                        } else {
                            ctx.getSource().sendFailure(`§c停止动画失败`)
                        }
                        return ok ? 1 : 0
                    })
                )
            )
    )

    // /playanimwave - 快捷挥手 (调用 kubejs_playeranim:wave 动画)
    event.register(
        Commands.literal("playanimwave")
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.getSource().getPlayerOrException()
                let ok = global.playPlayerAnim(player, "kubejs_playeranim:wave", 10, "EASEINOUTQUAD")
                if (ok) {
                    ctx.getSource().sendSuccess(`§a挥手动画`, false)
                } else {
                    ctx.getSource().sendFailure(`§c挥手动画播放失败`)
                }
                return ok ? 1 : 0
            })
    )
})
