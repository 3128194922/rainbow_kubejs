// priority: 0
// ==========================================================
// 登录系统 - 登录状态机（模式锁定 / 进入点记录 / 内存会话 / 业务逻辑）
// 规则：
//   1. 玩家进入世界时记录当前位置（登录成功后回到这里）
//   2. 未登录且模式为生存 → 切换观察者模式
//   3. 创造模式等「静默模式」玩家完全不参与登录系统：不锁定、不提示注册/登录
//   4. 已登录玩家 30 分钟内重连（同一次服务器运行）免登录
//   5. 连续 5 次密码错误 → 账号锁定 5 分钟并踢出
// 落盘数据：SQLite（见 Database.js）；会话与临时状态用 global 内存 + 玩家 persistentData
// ==========================================================

const LOGIN_SESSION_MS = 30 * 60 * 1000;   // 内存会话免登录时长
const LOGIN_LOCK_MODES = ['survival'];     // 进入世界时需要强制登录的游戏模式
const LOGIN_SILENT_MODES = ['creative'];    // 完全不参与登录系统的模式（不锁定、不提示；如需冒险模式也静默，把 'adventure' 加进来）

// JS 端登录会话表：uuid -> { authedAt: 毫秒时间戳 }（仅内存，服务器重启即失效）
global.loginSessions = {};

// 游戏模式名 → GameType 枚举
function loginGameTypeOf(modeName) {
    if (modeName == 'creative') return GameType.CREATIVE;
    if (modeName == 'adventure') return GameType.ADVENTURE;
    if (modeName == 'spectator') return GameType.SPECTATOR;
    return GameType.SURVIVAL;
}

// 读取玩家当前游戏模式名（survival / creative / adventure / spectator）
function loginGetGameMode(player) {
    try {
        let type = player.gameMode.getGameModeForPlayer();
        if (type != null) return String(type.getName());
    } catch (error) {
        console.log('[Login] 读取游戏模式失败: ' + error);
    }
    return 'survival';
}

// 切换游戏模式：优先脚本 API，异常时回退原版 gamemode 指令
function loginSetGameMode(player, modeName) {
    try {
        player.setGameMode(loginGameTypeOf(modeName));
        return true;
    } catch (error) {
        console.log('[Login] setGameMode 失败(' + modeName + ')，改用指令兜底: ' + error);
    }
    try {
        player.server.runCommandSilent('gamemode ' + modeName + ' ' + player.username);
        return true;
    } catch (fallbackError) {
        console.log('[Login] 指令兜底切换游戏模式失败: ' + fallbackError);
        return false;
    }
}

// 给玩家发提示（Component 参数，避免裸字符串转换问题）
function loginTell(player, message) {
    try {
        if (player != null) player.tell(Component.literal(message));
    } catch (error) {
        console.log('[Login] 提示发送失败: ' + error);
    }
}

// 记录进入世界时的位置/朝向（登录成功后回到这里）
function loginRecordEntry(player) {
    try {
        let data = player.persistentData;
        let level = player.level;
        data.putString('login_entry_dim', level == null ? '' : String(level.dimension));
        data.putDouble('login_entry_x', player.x);
        data.putDouble('login_entry_y', player.y);
        data.putDouble('login_entry_z', player.z);
        data.putFloat('login_entry_yaw', player.yaw);
        data.putFloat('login_entry_pitch', player.pitch);
    } catch (error) {
        console.log('[Login] 记录进入点失败: ' + error);
    }
}

// 传送回进入点，成功返回 true
function loginBackToEntry(player) {
    let data = player.persistentData;
    let dim = data.getString('login_entry_dim');
    if (dim == null || dim == '' || dim == 'null') return false;
    try {
        player.teleportTo(
            dim,
            data.getDouble('login_entry_x'),
            data.getDouble('login_entry_y'),
            data.getDouble('login_entry_z'),
            data.getFloat('login_entry_yaw'),
            data.getFloat('login_entry_pitch')
        );
        return true;
    } catch (error) {
        console.log('[Login] 返回进入点失败: ' + error);
        return false;
    }
}

// 当前模式是否需要强制登录
function loginNeedLock(player) {
    let mode = loginGetGameMode(player);
    for (let i = 0; i < LOGIN_LOCK_MODES.length; i++) {
        if (LOGIN_LOCK_MODES[i] == mode) return true;
    }
    return false;
}

// 是否为「静默模式」（创造模式等）：不锁定、不提示注册/登录
function loginIsSilentMode(player) {
    let mode = loginGetGameMode(player);
    for (let i = 0; i < LOGIN_SILENT_MODES.length; i++) {
        if (LOGIN_SILENT_MODES[i] == mode) return true;
    }
    return false;
}

// 锁定：创造模式直接跳过；其他模式记录待恢复模式、标记 login_locked 并切观察者
function loginLock(player) {
    if (loginIsSilentMode(player)) return;
    try {
        let data = player.persistentData;
        let current = loginGetGameMode(player);
        // 已在观察者模式时不覆盖原模式记录，避免把观察者当成"原模式"
        if (current != 'spectator') data.putString('login_prev_mode', current);
        let prev = data.getString('login_prev_mode');
        if (prev == '' || prev == 'null' || prev == 'spectator') data.putString('login_prev_mode', 'survival');
        data.putBoolean('login_locked', true);
        loginSetGameMode(player, 'spectator');
    } catch (error) {
        console.log('[Login] 锁定玩家失败: ' + error);
    }
}

// 玩家进入世界：创造模式完全跳过登录状态管理；其他模式记录进入点并判断登录状态
function loginHandleJoin(player) {
    if (loginIsSilentMode(player)) return;
    loginRecordEntry(player);

    // 数据库不可用时「放行」而不是锁定：避免玩家被永久困在观察者模式
    if (loginGetDb() == null) {
        console.log('[Login] 数据库不可用，本次跳过登录检查');
        return;
    }

    let data = player.persistentData;
    let username = String(player.username);
    let uuid = String(player.uuid);
    let now = Date.now();

    // 未注册账户
    let account = loginGetAccount(username);
    if (account == null) {
        if (data.getBoolean('login_locked') || loginNeedLock(player)) {
            loginLock(player);
            loginTell(player, '§e欢迎来到 Rainbow Power！请先使用 §a/register <密码> §e注册，注册成功后会自动登录并回到进入点。');
        } else {
            loginTell(player, '§e你还没有账户，可使用 §a/register <密码> §e注册。');
        }
        return;
    }

    // 内存会话有效：免登录
    let session = global.loginSessions[uuid];
    if (session != null && (now - Number(session.authedAt)) <= LOGIN_SESSION_MS) {
        data.putBoolean('login_locked', false);
        loginTell(player, '§a欢迎回来，§e' + username + '§a（30 分钟内免登录）。');
        return;
    }

    // 需要登录：上次未登录就退出，或本次进入模式为生存
    if (data.getBoolean('login_locked') || loginNeedLock(player)) {
        loginLock(player);
        let lockUntil = loginRowNumber(account, 'lock_until', 0);
        if (lockUntil > now) {
            loginTell(player, '§c该账户已被临时锁定，请在 §e' + Math.ceil((lockUntil - now) / 1000) + ' §c秒后使用 §a/login <密码> §c登录。');
        } else {
            loginTell(player, '§e请使用 §a/login <密码> §e登录，登录成功后回到进入世界时的位置。');
        }
    }
}

// 登录成功的公共收尾：创造模式不参与状态变更；其他模式解锁、恢复模式并写会话
// 只有「被锁定为观察者」的玩家才需要恢复模式并传送回进入点，
// 创造/冒险模式玩家（未锁定）登录时保持原位，避免被拽回进入点。
function loginComplete(player) {
    if (loginIsSilentMode(player)) {
        return { ok: true, back: false, msg: '§a已验证；创造模式不记录登录状态。' };
    }

    let data = player.persistentData;
    let wasLocked = data.getBoolean('login_locked');
    let prevMode = data.getString('login_prev_mode');
    data.putBoolean('login_locked', false);

    if (wasLocked) {
        if (prevMode == '' || prevMode == 'null' || prevMode == 'spectator') prevMode = 'survival';
        loginSetGameMode(player, prevMode);
    }

    let back = false;
    if (wasLocked) back = loginBackToEntry(player);
    global.loginSessions[String(player.uuid)] = { authedAt: Date.now() };
    return { ok: true, back: back, msg: '§a登录成功！' + (back ? '已返回进入世界时的位置。' : '') };
}

// 密码格式校验：合法返回 null，否则返回错误提示
function loginValidatePassword(password) {
    if (password == null) return '§c密码不能为空。';
    let value = String(password);
    if (value.length < LOGIN_PASSWORD_MIN) return '§c密码至少需要 §e' + LOGIN_PASSWORD_MIN + ' §c个字符。';
    if (value.length > LOGIN_PASSWORD_MAX) return '§c密码最多 §e' + LOGIN_PASSWORD_MAX + ' §c个字符。';
    if (value.indexOf(' ') >= 0) return '§c密码不能包含空格。';
    return null;
}

// /register <密码>：注册成功后直接登录
function loginDoRegister(player, password) {
    if (player == null) return { ok: false, msg: '§c该指令只能由玩家执行。' };
    let username = String(player.username);
    let invalid = loginValidatePassword(password);
    if (invalid != null) return { ok: false, msg: invalid };
    if (loginGetAccount(username) != null) {
        return { ok: false, msg: '§c账户 §e' + username + ' §c已存在，请直接使用 §a/login <密码>§c。' };
    }
    if (!loginCreateAccount(username, password)) {
        return { ok: false, msg: '§c注册失败，请查看服务端日志。' };
    }
    console.log('[Login] 新账户注册: ' + username);
    let result = loginComplete(player);
    result.msg = loginIsSilentMode(player)
        ? '§a注册成功；创造模式不记录登录状态。'
        : '§a注册成功并已登录！' + (result.back ? '已返回进入世界时的位置。' : '');
    return result;
}

// /login <密码>：校验哈希，失败累计 5 次则锁定 5 分钟并踢出
function loginDoLogin(player, password) {
    if (player == null) return { ok: false, msg: '§c该指令只能由玩家执行。' };
    let username = String(player.username);
    let account = loginGetAccount(username);
    if (account == null) return { ok: false, msg: '§c你还没有注册，请使用 §a/register <密码>§c。' };

    let now = Date.now();
    let lockUntil = loginRowNumber(account, 'lock_until', 0);
    if (lockUntil > now) {
        return { ok: false, msg: '§c连续输错次数过多，账户已锁定，请在 §e' + Math.ceil((lockUntil - now) / 1000) + ' §c秒后重试。' };
    }

    let salt = loginRowString(account, 'salt');
    let expect = loginRowString(account, 'password_hash');
    let actual = loginHashPassword(password, salt);
    if (actual == null) return { ok: false, msg: '§c登录校验失败，请查看服务端日志。' };

    if (actual != expect) {
        let failCount = loginRowNumber(account, 'fail_count', 0) + 1;
        if (failCount >= LOGIN_MAX_FAIL) {
            loginMarkFail(username, 0, now + LOGIN_LOCK_MS);
            console.log('[Login] 账户 ' + username + ' 连续 ' + LOGIN_MAX_FAIL + ' 次密码错误，锁定 5 分钟');
            return { ok: false, kick: true, msg: '§c密码连续错误 §e' + LOGIN_MAX_FAIL + ' §c次，账户已锁定 5 分钟。' };
        }
        loginMarkFail(username, failCount, 0);
        return { ok: false, msg: '§c密码错误（§e' + failCount + '§c/§e' + LOGIN_MAX_FAIL + '§c）。' };
    }

    loginMarkSuccess(username);
    return loginComplete(player);
}

// /changepassword <旧密码> <新密码>
function loginDoChangePassword(player, oldPassword, newPassword) {
    if (player == null) return { ok: false, msg: '§c该指令只能由玩家执行。' };
    let username = String(player.username);
    let account = loginGetAccount(username);
    if (account == null) return { ok: false, msg: '§c你还没有注册，请使用 §a/register <密码>§c。' };

    let actual = loginHashPassword(oldPassword, loginRowString(account, 'salt'));
    if (actual == null || actual != loginRowString(account, 'password_hash')) {
        return { ok: false, msg: '§c旧密码错误。' };
    }
    let invalid = loginValidatePassword(newPassword);
    if (invalid != null) return { ok: false, msg: invalid };
    if (!loginSetPassword(username, newPassword)) {
        return { ok: false, msg: '§c修改密码失败，请查看服务端日志。' };
    }
    return { ok: true, msg: '§a密码已修改，下次登录请使用新密码。' };
}

// /logout：创造模式不参与状态变更；其他模式清掉会话并重新锁定为观察者
// 登出点会被记为新的进入点，避免重新登录时被传送回很久以前的位置
function loginDoLogout(player) {
    if (player == null) return { ok: false, msg: '§c该指令只能由玩家执行。' };
    if (loginIsSilentMode(player)) return { ok: false, msg: '§e创造模式不参与登录状态管理。' };
    global.loginSessions[String(player.uuid)] = null;
    loginRecordEntry(player);
    loginLock(player);
    return { ok: true, msg: '§a已退出登录，请使用 §e/login <密码> §a重新登录。' };
}

// /loginadmin reset <玩家> <新密码>：管理员重置密码并解除锁定（支持离线玩家）
function loginDoAdminReset(targetName, newPassword) {
    if (targetName == null || String(targetName) == '') return { ok: false, msg: '§c请填写玩家ID。' };
    let account = loginGetAccount(targetName);
    if (account == null) return { ok: false, msg: '§c账户 §e' + targetName + ' §c不存在。' };
    let invalid = loginValidatePassword(newPassword);
    if (invalid != null) return { ok: false, msg: invalid };
    if (!loginSetPassword(loginRowString(account, 'username'), newPassword)) {
        return { ok: false, msg: '§c重置失败，请查看服务端日志。' };
    }
    console.log('[Login] 管理员重置了账户密码: ' + targetName);
    return { ok: true, msg: '§a已重置 §e' + targetName + ' §a的密码并解除锁定。' };
}
