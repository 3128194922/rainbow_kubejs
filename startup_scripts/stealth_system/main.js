// priority: 0
// ==========================================
// 潜行系统 - 启动端：isStealth 隐匿状态读写 + 即时索敌监听
// Stealth System (Startup) - stealth state & instant tracking
// ==========================================
// 本文件用纯 KubeJS 维护玩家隐匿状态（不依赖 StealthAPI 等外部 mod）：
//   - 状态存储在玩家 persistentData 的布尔键 `isStealth`（默认 true，自动持久化）；
//   - 被任意怪物索敌锁定目标时（LivingChangeTargetEvent 监听）立即置 false；
//     （该事件同时覆盖传统 Goal 的 MOB_TARGET 与 Brain/Behavior 的 BEHAVIOR_TARGET）
//   - 恢复 true 采用"定时恢复"而非轮询扫描：每次被索敌后排队一个
//     5 秒（100 tick）的恢复回调；5 秒内再次被索敌则通过令牌机制作废旧
//     回调并重新排队（等价于重置 5 秒），5 秒内未再被索敌才自动恢复 true。
//     全程零轮询扫描开销，无需 server_scripts 兜底扫描。
//
// 即时事件必须放这里：ForgeEvents.onEvent 在 KubeJS 1.20.1 是 startup 专用 API。
// 对外暴露 global.getStealthState / global.setStealthState：
//   - startup_scripts 定义，服务端与客户端双侧加载，供饰属性计算（server/client）
//     与 server_scripts/stealth_system 的网络同步共用。
//   - global.getStealthState 语义与请求声明一致：非 Player / 字段缺失 / 异常均视为 true。
// ==========================================

// 隐匿状态 NBT 键名（布尔）。与旧 StealthAPI 数据键一致，卸载 mod 后旧存档仍兼容
const STEALTH_KEY = 'isStealth';

// 被索敌识破后保持隐匿 false 的时长（tick）。5 秒 = 100 tick：
// 期间即使怪物消失也不会提前恢复，保证"被识破后持续暴露"的手感。
const STEALTH_BREAK_TICKS = 100;

// 每个玩家当前生效的恢复回调令牌（uuid -> token）。
// 每次被索敌令牌 +1 并重新排队 5s 恢复；旧回调执行时若令牌不匹配
// （期间再次被索敌）则直接作废，实现"再次索敌重置 5s"。
let stealthRecoverToken = {};

/**
 * 读取实体的隐匿状态（纯 KubeJS 实现，替代原 StealthData 反射）。
 * 规则：持久化键缺失 / 非 Player / 读异常时一律返回 true。
 * 注意：客户端 persistentData 不同步，返回的 true 仅为默认兜底，
 * 客户端真实状态由 server_scripts/stealth_system 网络推送获得。
 */
global.getStealthState = (entity) => {
    try {
        // 空实体防御
        if (entity === null) return true;
        if (entity === undefined) return true;

        let tag = entity.persistentData;
        if (tag === null) return true;
        if (tag === undefined) return true;

        // 键缺失时视为 true
        if (!tag.contains(STEALTH_KEY)) return true;
        return tag.getBoolean(STEALTH_KEY);
    } catch (err) {
        console.log(`[stealth_system] getStealthState 读取失败: ${err}`);
        return true;
    }
};

/**
 * 写入玩家隐匿状态（服务端兜底扫描 / 即时索敌监听使用）。
 */
global.setStealthState = (player, value) => {
    try {
        if (player === null) return;
        if (player === undefined) return;

        let tag = player.persistentData;
        if (tag === null) return;
        if (tag === undefined) return;

        tag.putBoolean(STEALTH_KEY, value);
    } catch (err) {
        console.log(`[stealth_system] setStealthState 写入失败: ${err}`);
    }
};

// ==========================================
// 即时置 false + 定时恢复：监听怪物索敌变更事件（Forge 原生事件）
// 覆盖传统 Goal（LivingTargetType.MOB_TARGET）与
// Brain/Behavior（LivingTargetType.BEHAVIOR_TARGET）两套索敌路径。
// 当新目标为玩家时立即写 false，并为该玩家排队一个 5 秒（100 tick）
// 的恢复回调；期间再次被索敌则令牌加一重新排队（重置 5s）。
// 恢复 true 无需任何轮询扫描，由回调在 5s 内未再被索敌时自动完成。
// ==========================================

// 排队 5 秒定时恢复：令牌机制保证"再次索敌重置计时"
function scheduleStealthRecovery(entity) {
    try {
        // 注意：KubeJS Rhino 会把 Java 方法名转 camelCase，原生 getUUID() 在脚本中
        // 找不到（报 Cannot find function getUUID），必须用 KubeJS 命名 getUuid()
        let uuid = String(entity.getUuid());
        if (uuid === null) return;
        if (uuid === undefined) return;

        // 令牌 +1：作废此前所有未执行完的旧恢复回调（相当于重置 5s 计时）
        let prevToken = stealthRecoverToken[uuid];
        if (prevToken === null) prevToken = 0;
        if (prevToken === undefined) prevToken = 0;
        let token = prevToken + 1;
        stealthRecoverToken[uuid] = token;

        // 通过实体所在世界的原生 Server 调度延迟任务（KubeJS mixin 接口）
        let lvl = entity.getLevel();
        if (lvl === null || lvl === undefined) return;
        let server = lvl.getServer();
        if (server === null || server === undefined) return;

        server.scheduleInTicks(STEALTH_BREAK_TICKS, () => {
            try {
                // 执行时令牌已被刷新（期间再次被索敌）说明 5s 被重置，本次作废
                let curToken = stealthRecoverToken[uuid];
                if (curToken !== token) return;
                delete stealthRecoverToken[uuid];

                // 已在隐匿状态则无需重复恢复（防重复写 NBT）
                if (global.getStealthState(entity) === true) return;

                global.setStealthState(entity, true);
                //console.log(`[stealth_system] ${String(entity.getName())} 5s 未再被索敌，isStealth -> true`);
            } catch (err) {
                console.log(`[stealth_system] 隐匿定时恢复失败: ${err}`);
            }
        });
    } catch (err) {
        console.log(`[stealth_system] 隐匿恢复排队失败: ${err}`);
    }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingChangeTargetEvent', event => {
    try {
        let target = event.getNewTarget();
        if (target === null) return;
        if (target === undefined) return;
        if (typeof target.isPlayer !== 'function') return;
        if (!target.isPlayer()) return;

        // 仅服务端处理（防止客户端套接加载重复写 NBT）
        let lvl = target.getLevel();
        if (lvl !== null && lvl !== undefined && lvl.isClientSide()) return;

        // 只要被索敌（无论当前是否已暴露）都写 false 并重置 5s 计时
        global.setStealthState(target, false);
        //console.log(`[stealth_system] ${String(target.getName())} 被怪物索敌，isStealth -> false（5s 后自动恢复）`);
        scheduleStealthRecovery(target);
    } catch (err) {
        console.log(`[stealth_system] 处理索敌事件失败: ${err}`);
    }
});