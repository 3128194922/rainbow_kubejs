// priority: 0
// ==========================================================
// 登录系统 - 主入口（事件注册 + 指令注册）
// 依赖：Database.js（SQLite 数据层）、Login.js（状态机）
// 指令：/register <密码> | /login <密码> | /changepassword <旧密码> <新密码>
//       /logout | /loginadmin reset <玩家> <新密码>
// ==========================================================

// 玩家进入世界：记录进入点 → 未登录切观察者模式
// 创造模式玩家（LOGIN_SILENT_MODES，见 Login.js）不锁定、也不提示注册/登录
PlayerEvents.loggedIn(event => {
    try {
        if (event.level != null && event.level.isClientSide()) return;
        let player = event.player;
        if (player == null) return;
        loginHandleJoin(player);
    } catch (error) {
        console.log('[Login] 玩家进入世界处理失败: ' + error);
    }
});

// 统一回复：成功走 sendSuccess，失败（含踢出）走 sendFailure
function loginReplyCommand(ctx, result) {
    if (result == null || result.ok != true) {
        ctx.source.sendFailure(Component.literal(result == null ? '§c操作失败。' : result.msg));
        return 0;
    }
    ctx.source.sendSuccess(Component.literal(result.msg), false);
    return 1;
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    // /register <密码>：注册成功后自动登录并回到进入点
    event.register(
        Commands.literal('register')
            .requires(src => src.hasPermission(0))
            .then(
                Commands.argument('password', Arguments.STRING.create(event))
                    .executes(ctx => {
                        try {
                            return loginReplyCommand(ctx, loginDoRegister(ctx.source.player, Arguments.STRING.getResult(ctx, 'password')));
                        } catch (error) {
                            console.log('[Login] /register 执行出错: ' + error);
                            ctx.source.sendFailure(Component.literal('§c注册出错，请查看服务端日志。'));
                            return 0;
                        }
                    })
            )
    );

    // /login <密码>
    event.register(
        Commands.literal('login')
            .requires(src => src.hasPermission(0))
            .then(
                Commands.argument('password', Arguments.STRING.create(event))
                    .executes(ctx => {
                        try {
                            let player = ctx.source.player;
                            let result = loginDoLogin(player, Arguments.STRING.getResult(ctx, 'password'));
                            // 连续错误达上限：直接踢出，断开界面显示锁定原因
                            if (result != null && result.kick == true) {
                                try {
                                    if (player != null) player.kick(Component.literal(result.msg));
                                } catch (kickError) {
                                    console.log('[Login] 踢出玩家失败: ' + kickError);
                                }
                                return 0;
                            }
                            return loginReplyCommand(ctx, result);
                        } catch (error) {
                            console.log('[Login] /login 执行出错: ' + error);
                            ctx.source.sendFailure(Component.literal('§c登录出错，请查看服务端日志。'));
                            return 0;
                        }
                    })
            )
    );

    // /changepassword <旧密码> <新密码>
    event.register(
        Commands.literal('changepassword')
            .requires(src => src.hasPermission(0))
            .then(
                Commands.argument('oldPassword', Arguments.STRING.create(event))
                    .then(
                        Commands.argument('newPassword', Arguments.STRING.create(event))
                            .executes(ctx => {
                                try {
                                    return loginReplyCommand(ctx, loginDoChangePassword(
                                        ctx.source.player,
                                        Arguments.STRING.getResult(ctx, 'oldPassword'),
                                        Arguments.STRING.getResult(ctx, 'newPassword')
                                    ));
                                } catch (error) {
                                    console.log('[Login] /changepassword 执行出错: ' + error);
                                    ctx.source.sendFailure(Component.literal('§c修改密码出错，请查看服务端日志。'));
                                    return 0;
                                }
                            })
                    )
            )
    );

    // /logout：退出登录并重新锁定为观察者
    event.register(
        Commands.literal('logout')
            .requires(src => src.hasPermission(0))
            .executes(ctx => {
                try {
                    return loginReplyCommand(ctx, loginDoLogout(ctx.source.player));
                } catch (error) {
                    console.log('[Login] /logout 执行出错: ' + error);
                    ctx.source.sendFailure(Component.literal('§c退出登录出错，请查看服务端日志。'));
                    return 0;
                }
            })
    );

    // /loginadmin reset <玩家> <新密码>：管理员重置（权限等级 2），支持离线玩家
    event.register(
        Commands.literal('loginadmin')
            .requires(src => src.hasPermission(2))
            .then(
                Commands.literal('reset')
                    .then(
                        Commands.argument('target', Arguments.STRING.create(event))
                            .suggests((ctx, builder) => {
                                try {
                                    // 用原版玩家列表遍历，避免不同 KubeJS 版本的集合包装差异
                                    let list = ctx.source.server.getPlayerList().getPlayers();
                                    for (let i = 0; i < list.size(); i++) {
                                        let target = list.get(i);
                                        if (target != null) builder.suggest(String(target.username));
                                    }
                                } catch (error) {
                                    console.log('[Login] 玩家名补全失败: ' + error);
                                }
                                return builder.buildFuture();
                            })
                            .then(
                                Commands.argument('newPassword', Arguments.STRING.create(event))
                                    .executes(ctx => {
                                        try {
                                            return loginReplyCommand(ctx, loginDoAdminReset(
                                                Arguments.STRING.getResult(ctx, 'target'),
                                                Arguments.STRING.getResult(ctx, 'newPassword')
                                            ));
                                        } catch (error) {
                                            console.log('[Login] /loginadmin reset 执行出错: ' + error);
                                            ctx.source.sendFailure(Component.literal('§c重置密码出错，请查看服务端日志。'));
                                            return 0;
                                        }
                                    })
                            )
                    )
            )
    );
});
