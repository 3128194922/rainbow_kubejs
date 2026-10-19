// priority: 0
// ==========================================================
// 登录系统 - SQLite 数据层（sqlitejs）
// 全局对象 SQLite 由 2sqlitejs-1.0.0.jar 注册（startup/client/server 三种脚本类型都有）
// 数据库文件：<gameDir>/kubejs/sqlite/login.db（config/sqlitejs-common.toml 中 dbFolder = "sqlite"）
// 账户名 = 玩家 ID；密码只存「盐 + SHA-256 摘要」，数据库里不落明文
// ==========================================================

const LOGIN_DB_NAME = 'login';                  // SQLite.open('login') → kubejs/sqlite/login.db
const LOGIN_TABLE = 'accounts';
const LOGIN_MAX_FAIL = 5;                       // 连续密码错误次数上限
const LOGIN_LOCK_MS = 5 * 60 * 1000;            // 超过上限后锁定 5 分钟（毫秒）
const LOGIN_PASSWORD_MIN = 4;                   // 密码最短长度
const LOGIN_PASSWORD_MAX = 32;                  // 密码最长长度

// 建表语句：列类型固定，避免 SQLite 动态类型导致读取歧义；username 不区分大小写
const LOGIN_CREATE_SQL = 'CREATE TABLE IF NOT EXISTS ' + LOGIN_TABLE + ' ('
    + 'username TEXT PRIMARY KEY COLLATE NOCASE, '
    + 'password_hash TEXT NOT NULL, '
    + 'salt TEXT NOT NULL, '
    + 'created_at INTEGER NOT NULL DEFAULT 0, '
    + 'last_login_at INTEGER NOT NULL DEFAULT 0, '
    + 'fail_count INTEGER NOT NULL DEFAULT 0, '
    + 'lock_until INTEGER NOT NULL DEFAULT 0)';

// 取得（必要时创建）数据库连接并确保表存在。
// 连接实例挂在 global 上：/kubejs reload 后不需要重新 open。
function loginGetDb() {
    try {
        // sqlitejs 未安装时给出明确提示，避免每名玩家进入都抛 ReferenceError
        if (typeof SQLite == 'undefined' || SQLite == null) {
            console.log('[Login] 未找到全局绑定 SQLite，请确认已安装 2sqlitejs-1.0.0.jar');
            return null;
        }
        let db = global.loginDb;
        if (db == null || !db.isOpen()) {
            db = SQLite.open(LOGIN_DB_NAME);
            db.execute(LOGIN_CREATE_SQL);
            global.loginDb = db;
            console.log('[Login] SQLite 数据库已就绪: ' + db.getPath());
        }
        return db;
    } catch (error) {
        console.log('[Login] 打开 SQLite 数据库失败: ' + error);
        return null;
    }
}

// 加盐 SHA-256：salt:password → 十六进制摘要
// 兜底：KubeJS 类过滤器若拦截 java.security，则退回本项目已验证的 UUID/MD5 摘要写法
function loginHashPassword(password, salt) {
    let raw = String(salt) + ':' + String(password);
    try {
        if (MessageDigest == null) {
            console.log('[Login] 未能加载 java.security.MessageDigest，回退到 UUID/MD5 摘要');
            return String(UUID.nameUUIDFromBytes(JavaString.valueOf(raw).getBytes())).replace(/-/g, '');
        }
        let digest = MessageDigest.getInstance('SHA-256');
        digest.reset();
        // JavaString.valueOf 是本项目已验证的「JS 字符串 → Java String」写法
        digest.update(JavaString.valueOf(raw).getBytes('UTF-8'));
        let bytes = digest.digest();
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            let value = bytes[i] & 0xff;
            hex += (value < 16 ? '0' : '') + value.toString(16);
        }
        return hex;
    } catch (error) {
        console.log('[Login] 密码哈希计算失败: ' + error);
        return null;
    }
}

// 生成随机盐（UUID 去掉横线，32 位十六进制字符）
function loginRandomSalt() {
    return String(UUID.randomUUID()).replace(/-/g, '');
}

// 按账户名读取账户行；未注册返回 null
function loginGetAccount(username) {
    let db = loginGetDb();
    if (db == null || username == null) return null;
    try {
        let row = db.queryRow(
            'SELECT username, password_hash, salt, fail_count, lock_until FROM ' + LOGIN_TABLE + ' WHERE username = ? LIMIT 1',
            String(username)
        );
        return row == null ? null : row;
    } catch (error) {
        console.log('[Login] 查询账户失败(' + username + '): ' + error);
        return null;
    }
}

// Map 取数字字段（sqlite 驱动可能返回 Long/Integer/Double）
function loginRowNumber(row, key, fallback) {
    if (row == null) return fallback;
    let value = row.get(key);
    if (value == null) return fallback;
    let num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

// Map 取字符串字段
function loginRowString(row, key) {
    if (row == null) return '';
    let value = row.get(key);
    return value == null ? '' : String(value);
}

// 创建账户（内部完成加盐与哈希）
function loginCreateAccount(username, password) {
    let db = loginGetDb();
    if (db == null) return false;
    try {
        let salt = loginRandomSalt();
        let hash = loginHashPassword(password, salt);
        if (hash == null) return false;
        let now = Date.now();
        db.execute(
            'INSERT INTO ' + LOGIN_TABLE + ' (username, password_hash, salt, created_at, last_login_at, fail_count, lock_until) VALUES (?, ?, ?, ?, ?, 0, 0)',
            String(username), hash, salt, now, now
        );
        return true;
    } catch (error) {
        console.log('[Login] 创建账户失败(' + username + '): ' + error);
        return false;
    }
}

// 重设密码（玩家改密 / 管理员重置共用），同时清空失败计数与锁定
function loginSetPassword(username, password) {
    let db = loginGetDb();
    if (db == null) return false;
    try {
        let salt = loginRandomSalt();
        let hash = loginHashPassword(password, salt);
        if (hash == null) return false;
        db.execute(
            'UPDATE ' + LOGIN_TABLE + ' SET password_hash = ?, salt = ?, fail_count = 0, lock_until = 0 WHERE username = ?',
            hash, salt, String(username)
        );
        return true;
    } catch (error) {
        console.log('[Login] 更新密码失败(' + username + '): ' + error);
        return false;
    }
}

// 登录成功：刷新最后登录时间并清空失败计数/锁定
function loginMarkSuccess(username) {
    let db = loginGetDb();
    if (db == null) return;
    try {
        db.execute(
            'UPDATE ' + LOGIN_TABLE + ' SET last_login_at = ?, fail_count = 0, lock_until = 0 WHERE username = ?',
            Date.now(), String(username)
        );
    } catch (error) {
        console.log('[Login] 更新登录时间失败(' + username + '): ' + error);
    }
}

// 登录失败：写入失败次数与锁定截止时间
function loginMarkFail(username, failCount, lockUntil) {
    let db = loginGetDb();
    if (db == null) return;
    try {
        db.execute(
            'UPDATE ' + LOGIN_TABLE + ' SET fail_count = ?, lock_until = ? WHERE username = ?',
            failCount, lockUntil, String(username)
        );
    } catch (error) {
        console.log('[Login] 更新失败计数失败(' + username + '): ' + error);
    }
}
