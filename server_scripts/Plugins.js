// priority: 1000
// ==========================================
// 插件功能模拟与玩家事件处理
// Plugin Simulation & Player Event Handling
// ==========================================
// 包含功能：
// 1. 死亡记录与 /back 命令（记录存 persistentData，重启不丢，用后清除+冷却）
// 2. /tpa 传送请求命令（请求-确认制：目标点击按钮或输入 /tpaccept /tpdeny）
// 3. 登录/注册系统 (已注释)
// 4. 玩家进入/退出服务器事件处理 (饰品初始化, 数据统计)
// Included Features:
// 1. Death recording & /back command (persistentData storage, one-time use + cooldown)
// 2. /tpa teleport request command (request-confirm: click button or /tpaccept /tpdeny)
// 3. Login/Register system (Commented out)
// 4. Player login/logout handling (Curios init, stats logging)

// ============ 传送系统常量 ============
const TPA_EXPIRE_TICKS = 20 * 60;    // /tpa 请求有效期：60 秒
const TPA_COOLDOWN_TICKS = 20 * 30;  // /tpa 发起冷却：30 秒
const BACK_COOLDOWN_TICKS = 20 * 60; // /back 使用冷却：60 秒
const BACKROOM_DIM_STR = 'backroom:backroom'; // 后室维度字符串（统一判断方式）

// /tpa 待处理请求表：{ 目标玩家名: { requester: 发起者名, expire: 过期 gameTime } }
// 同一目标只保留最新一条请求，服务器重启自动清空
global.tpaRequests = {};

// ============ 后室维度判断辅助 ============
// 统一使用 String(level.dimension) 字符串比较（与 backroom 模块一致）
function isBackroomDimension(entity) {
    return String(entity.level.dimension) === BACKROOM_DIM_STR;
}
/*
PlayerEvents.respawned(event => {
    let playerName = event.oldPlayer.getDisplayName().getString();
    let deathPos = {
        x: event.oldPlayer.x,
        y: event.oldPlayer.y,
        z: event.oldPlayer.z,
        dimension: event.oldPlayer.level.dimension,
        yaw: event.oldPlayer.yaw,
        pitch: event.oldPlayer.pitch
    };
    
    // 按玩家名称存储坐标（支持多次死亡记录）
        global.deathRecords[playerName]= {
            x: event.oldPlayer.x,
            y: event.oldPlayer.y,
            z: event.oldPlayer.z,
            dimension: event.oldPlayer.level.dimension,
            yaw: event.oldPlayer.yaw,
            pitch: event.oldPlayer.pitch
        };
    console.log(event.getEntity().x)
    console.log(event.oldPlayer.y)
    console.log(event.oldPlayer.z)

    // 打印当前记录（调试用）
    console.log(`玩家 ${playerName} 死亡位置记录：`, global.deathRecords[playerName]);
});
*/

// 玩家死亡事件：记录死亡坐标（供 /back 使用）
// 记录写入 persistentData 的 PlayerPersisted 子标签：
// Forge 死亡克隆玩家实体时只有该子标签会复制到新实体，因此必须写入这一层才能跨死亡保留
EntityEvents.death(event => {
    if (!event.getPlayer()) return;
    if (event.level.isClientSide()) return;

    let player = event.getPlayer();
    let playerName = player.name.string;

/*
    // 战斗维度死亡惩罚：Backroom维度死亡清空背包
    if (level.name.getString() === "backroom:backroom") {
        player.inventory.clear();
        return;
    }
*/
    // 后室死亡不记录返回点：后室逃出必须走秘籍流程（防止 /back 绕过后室规则）
    if (isBackroomDimension(player)) {
        player.persistentData.putFloat("damage_num", 0)
        return;
    }

    try {
        let persisted = player.persistentData;
        // 确保 PlayerPersisted 子标签存在（不存在时 getCompound 返回游离的空标签，写入会丢失）
        if (!persisted.contains("PlayerPersisted")) {
            persisted.put("PlayerPersisted", new CompoundTag());
        }
        // 死亡位置记录：维度存字符串，坐标存 Double，视角存 Float
        let record = new CompoundTag();
        record.putString("dim", String(player.level.dimension));
        record.putDouble("x", player.x);
        record.putDouble("y", player.y);
        record.putDouble("z", player.z);
        record.putFloat("yaw", player.yaw);
        record.putFloat("pitch", player.pitch);
        persisted.getCompound("PlayerPersisted").put("back_record", record);
    } catch (e) {
        console.log(`[teleport] 玩家 ${playerName} 死亡位置记录失败: ${e}`);
    }

    player.persistentData.putFloat("damage_num",0)
})

// /tpaccept 与 /tpdeny 共用处理：accept=true 同意，requesterName 为 null 表示不指定发起者
function tpaRespond(ctx, accept, requesterName) {
    let player = ctx.source.player;
    if (player == null) return 0; // 控制台无法响应请求
    try {
        let playerName = player.name.string;
        let req = global.tpaRequests[playerName];

        // 没有待处理请求，或带参时与指定发起者不匹配
        if (req == null || (requesterName != null && req.requester !== requesterName)) {
            player.tell(`§c没有待处理的传送请求`);
            return 0;
        }
        // 先移除请求，无论后续结果如何都只处理一次
        delete global.tpaRequests[playerName];

        let now = player.level.getTime();
        if (now > req.expire) {
            player.tell(`§c传送请求已过期`);
            return 0;
        }

        let requester = ctx.source.server.getPlayer(req.requester);
        if (requester == null) {
            player.tell(`§c请求发起者 ${req.requester} 已离线`);
            return 0;
        }

        // 拒绝：仅互相通知，不传送
        if (!accept) {
            requester.tell(`§c${playerName} 拒绝了你的传送请求`);
            player.tell(`§e已拒绝 ${req.requester} 的传送请求`);
            return 1;
        }

        // 同意：执行前再次校验后室（发起者可能在等待期间进入后室）
        if (isBackroomDimension(requester) || isBackroomDimension(player)) {
            requester.tell(`§c神秘力量阻止了你的传送`);
            player.tell(`§c神秘力量阻止了这次传送`);
            return 0;
        }

        requester.teleportTo(
            player.level.dimension,
            player.x,
            player.y,
            player.z,
            player.yaw,
            player.pitch
        );
        requester.tell(`§a${playerName} 同意了你的传送请求`);
        player.tell(`§a${req.requester} 已传送到你身边`);
        return 1;
    } catch (e) {
        console.log(`[teleport] /${accept ? "tpaccept" : "tpdeny"} 执行出错: ${e}`);
        return 0;
    }
}

// 命令注册
ServerEvents.commandRegistry(event => {
    let { commands: Commands, arguments: Arguments } = event;

    // /tpa <target> - 向目标玩家发送传送请求，目标确认后才传送
    event.register(
        Commands.literal("tpa")
            .requires(src => src.hasPermission(0))
            .then(
                Commands.argument("target", Arguments.STRING.create(event))
                    .suggests((ctx, builder) => {
                        let playerNames = ctx.source.server.getPlayerNames();
                        playerNames.forEach(name => builder.suggest(name));
                        return builder.buildFuture();
                    })
                    .executes(ctx => {
                        try {
                            let requester = ctx.source.player;
                            if (requester == null) return 0; // 控制台不可用
                            let requesterName = requester.name.string;
                            let targetName = Arguments.STRING.getResult(ctx, "target");
                            let targetPlayer = ctx.source.server.getPlayer(targetName);

                            if (targetPlayer == null) {
                                requester.tell(`§c玩家 ${targetName} 不存在或不在线`);
                                return 0;
                            }

                            // 不能对自己发起传送
                            if (requesterName === targetPlayer.name.string) {
                                requester.tell(`§c不能对自己使用 /tpa`);
                                return 0;
                            }

                            // 后室封锁：发起者或目标任一在后室都禁止（防止用 /tpa 绕过秘籍逃出流程）
                            if (isBackroomDimension(requester) || isBackroomDimension(targetPlayer)) {
                                requester.tell(`§c神秘力量阻止了你的传送`);
                                return 0;
                            }

                            // 发起冷却检查
                            let now = requester.level.getTime();
                            let cooldownUntil = requester.persistentData.contains("tpa_cooldown") ? requester.persistentData.getLong("tpa_cooldown") : 0;
                            if (now < cooldownUntil) {
                                requester.tell(`§c传送请求冷却中，还需等待 ${Math.ceil((cooldownUntil - now) / 20)} 秒`);
                                return 0;
                            }

                            // 记录请求（同一目标只保留最新一条），并写入发起冷却
                            global.tpaRequests[targetPlayer.name.string] = {
                                requester: requesterName,
                                expire: now + TPA_EXPIRE_TICKS
                            };
                            requester.persistentData.putLong("tpa_cooldown", now + TPA_COOLDOWN_TICKS);

                            // 给目标发送可点击按钮消息：点击按钮直接执行对应指令，也可手动输入指令
                            targetPlayer.tell(Text.of({
                                text: `玩家 ${requesterName} 请求传送到你身边 `,
                                color: "yellow",
                                extra: [
                                    Text.of({
                                        text: "[接受]",
                                        color: "green",
                                        bold: true,
                                        click: { action: "run_command", value: `/tpaccept ${requesterName}` },
                                        hover: { text: "点击同意传送" }
                                    }),
                                    Text.of({ text: " " }),
                                    Text.of({
                                        text: "[拒绝]",
                                        color: "red",
                                        bold: true,
                                        click: { action: "run_command", value: `/tpdeny ${requesterName}` },
                                        hover: { text: "点击拒绝传送" }
                                    })
                                ]
                            }));
                            targetPlayer.tell(`§7或输入 §a/tpaccept ${requesterName} §7同意，§c/tpdeny ${requesterName} §7拒绝，${TPA_EXPIRE_TICKS / 20} 秒后自动过期`);
                            requester.tell(`§a已向 ${targetName} 发送传送请求`);
                            return 1;
                        } catch (e) {
                            console.log(`[teleport] /tpa 执行出错: ${e}`);
                            return 0;
                        }
                    })
            )
    );

    // /tpaccept [发起者名] - 同意传送请求（点击按钮或手动输入均可）
    event.register(
        Commands.literal("tpaccept")
            .requires(src => src.hasPermission(0))
            .executes(ctx => tpaRespond(ctx, true, null))
            .then(
                Commands.argument("requester", Arguments.STRING.create(event))
                    .suggests((ctx, builder) => {
                        let playerNames = ctx.source.server.getPlayerNames();
                        playerNames.forEach(name => builder.suggest(name));
                        return builder.buildFuture();
                    })
                    .executes(ctx => tpaRespond(ctx, true, Arguments.STRING.getResult(ctx, "requester")))
            )
    );

    // /tpdeny [发起者名] - 拒绝传送请求（点击按钮或手动输入均可）
    event.register(
        Commands.literal("tpdeny")
            .requires(src => src.hasPermission(0))
            .executes(ctx => tpaRespond(ctx, false, null))
            .then(
                Commands.argument("requester", Arguments.STRING.create(event))
                    .suggests((ctx, builder) => {
                        let playerNames = ctx.source.server.getPlayerNames();
                        playerNames.forEach(name => builder.suggest(name));
                        return builder.buildFuture();
                    })
                    .executes(ctx => tpaRespond(ctx, false, Arguments.STRING.getResult(ctx, "requester")))
            )
    );

    // /back - 返回上次死亡地点（一次性使用，带冷却，记录持久化在玩家 NBT 中）
    event.register(
        Commands.literal("back")
            .requires(src => src.hasPermission(0))
            .executes(ctx => {
                try {
                    let player = ctx.source.player;
                    if (player == null) return 0; // 控制台不可用

                    // 发起者在后室时禁止：后室逃出必须走秘籍流程
                    if (isBackroomDimension(player)) {
                        player.tell(`§c神秘力量阻止了你的传送`);
                        return 0;
                    }

                    let record = player.persistentData.getCompound("PlayerPersisted").getCompound("back_record");
                    if (!record.contains("dim")) {
                        player.tell(`§c你没有可返回的死亡位置`);
                        return 0;
                    }

                    // 使用冷却检查
                    let now = player.level.getTime();
                    let cooldownUntil = player.persistentData.contains("back_cooldown") ? player.persistentData.getLong("back_cooldown") : 0;
                    if (now < cooldownUntil) {
                        player.tell(`§c/back 冷却中，还需等待 ${Math.ceil((cooldownUntil - now) / 20)} 秒`);
                        return 0;
                    }

                    let backDim = record.getString("dim");
                    let backX = record.getDouble("x");
                    let backY = record.getDouble("y");
                    let backZ = record.getDouble("z");

                    // 双保险：死亡地点在后室时不允许返回（旧版本遗留数据等异常情况）
                    if (backDim === BACKROOM_DIM_STR) {
                        player.tell(`§c神秘力量阻止了你的传送`);
                        return 0;
                    }

                    player.teleportTo(backDim, backX, backY, backZ, record.getFloat("yaw"), record.getFloat("pitch"));

                    // 用后清除记录（一次性使用），并写入冷却
                    player.persistentData.getCompound("PlayerPersisted").remove("back_record");
                    player.persistentData.putLong("back_cooldown", now + BACK_COOLDOWN_TICKS);
                    player.tell(`§a已返回你上次死亡的位置 (${Math.floor(backX)}, ${Math.floor(backY)}, ${Math.floor(backZ)})`);
                    return 1;
                } catch (e) {
                    console.log(`[teleport] /back 执行出错: ${e}`);
                    return 0;
                }
            })
    );
/*
    // /register <password>
    event.register(
        Commands.literal("register")
            .requires(src => src.hasPermission(0))
            .then(
                Commands.argument("password", Arguments.STRING.create(event))
                    .executes(ctx => {
                        const player = ctx.source.player;
                        const data = player.persistentData;
                        const password = Arguments.STRING.getResult(ctx, "password");

                        if (data.contains("password")) {
                            player.tell("§c你已经注册过了！");
                            return 0;
                        }

                        data.putString("password", password);
                        player.tell("§a注册成功！");
                        return 1;
                    })
            )
    );

    // /login <password>
    event.register(
        Commands.literal("login")
            .requires(src => src.hasPermission(0))
            .then(
                Commands.argument("password", Arguments.STRING.create(event))
                    .executes(ctx => {
                        const player = ctx.source.player;
                        const data = player.persistentData;
                        const inputPassword = Arguments.STRING.getResult(ctx, "password");

                        if (!data.contains("password")) {
                            player.tell("§e你还没有注册，请使用 /register <密码> 注册！");
                            return 0;
                        }

                        if (data.getString("password") === inputPassword) {
                            player.setGameMode("survival");
                            player.tell("§a登录成功，已切换到生存模式！");
                            return 1;
                        } else {
                            player.tell("§c密码错误！");
                            return 0;
                        }
                    })
            )
    );
    //重置密码
    event.register(
        Commands.literal("resetpassword")
            .requires(src => src.hasPermission(4)) // 需要权限等级 4
            .then(
                Commands.argument("target", Arguments.STRING.create(event))
                    .suggests((ctx, builder) => {
                        // 在线玩家名补全
                        let playerNames = ctx.source.server.getPlayerNames();
                        playerNames.forEach(name => builder.suggest(name));
                        return builder.buildFuture();
                    })
                    .executes(ctx => {
                        let sender = ctx.source.player;
                        let targetName = Arguments.STRING.getResult(ctx, "target");
                        let targetPlayer = ctx.source.server.getPlayer(targetName);

                        if (!targetPlayer) {
                            sender.tell(`§c玩家 ${targetName} 不存在或不在线`);
                            return 0;
                        }

                        let targetData = targetPlayer.persistentData;

                        if (targetData.contains("password")) {
                            targetData.remove("password");
                            sender.tell(`§a已成功清除玩家 ${targetName} 的密码`);
                            targetPlayer.tell("§e你的密码已被管理员重置，请重新使用 /register 设置密码");
                            return 1;
                        } else {
                            sender.tell(`§e玩家 ${targetName} 尚未注册，无需重置`);
                            return 0;
                        }
                    })
            )
    );
*/

});

// 玩家退出：清理其作为目标的待处理传送请求（防止残留过期请求）
PlayerEvents.loggedOut(event => {
    try {
        if (global.tpaRequests) {
            delete global.tpaRequests[event.player.name.string];
        }
    } catch (e) {
        console.log(`[teleport] 登出清理传送请求失败: ${e}`);
    }
});

// 玩家统计数据上传 (Logged Out Event)
/*PlayerEvents.loggedOut(event => {
    if (true) return; // 当前已禁用

    let player = event.getPlayer();
    let playerUUID = player.getUuid().toString();

    let playerData = {
        name: player.getDisplayName().getString(),
        playTime: player.stats.getPlayTime(),
        lastLogout: new Date().toISOString()
    };

    // 定义路径
    let playerDataFile = 'kubejs/PlayerDate.json';
    let logFilePath = 'logs/PlayerDate.txt';

    // 创建目录（如果不存在）
    if (!FilesJS.exists('kubejs')) FilesJS.createDirectory('kubejs');
    if (!FilesJS.exists('logs')) FilesJS.createDirectory('logs');

    // 初始化存储对象
    let allData = {};

    // 读取原有 JSON 数据（若存在）
    if (FilesJS.exists(playerDataFile)) {
        try {
            let content = FilesJS.readFile(playerDataFile);
            if (content.trim() !== '') {
                allData = JSON.parse(content);
            } else {
                console.warn("PlayerDate.json 是空文件，初始化为 {}");
            }
        } catch (e) {
            console.error(`读取 PlayerDate.json 时出错: ${e}`);
            allData = {};
        }
    }

    // 更新或添加该玩家数据
    allData[playerUUID] = playerData;

    // 写入文件（格式化 JSON）
    FilesJS.writeFile(playerDataFile, JSON.stringify(allData, null, 2));

    // 构造并追加日志
    let logEntry = `[${playerData.lastLogout}] 玩家 ${playerData.name} (UUID: ${playerUUID}) 退出，游玩时间: ${playerData.playTime} tick`;
    FilesJS.appendLine(logFilePath, logEntry);
});*/