// ============================================================
// Field-Guide 玩家收集进度读取工具
// 依赖: Field-Guide mod (fieldguide)
// 用途: 通过 KubeJS 读取任意玩家的 Field-Guide 收集进度数据
// ============================================================

// 懒加载 Field-Guide 相关类
let FGProgressManager = null;
let FGPlayerProgress = null;
let FGServerManager = null;

function ensureClassesLoaded() {
    if (FGProgressManager) return true;
    try {
        FGProgressManager = Java.loadClass('com.evandev.fieldguide.server.progress.FieldGuideProgressManager');
        FGPlayerProgress = Java.loadClass('com.evandev.fieldguide.server.progress.PlayerFieldGuideProgress');
        FGServerManager = Java.loadClass('com.evandev.fieldguide.server.ServerFieldGuideManager');
        return true;
    } catch (e) {
        console.error('[FieldGuideReader] 无法加载 Field-Guide 类，请确保 Field-Guide mod 已安装: ' + e);
        return false;
    }
}

/**
 * 获取 FieldGuideProgressManager 单例
 */
function getProgressManager() {
    if (!ensureClassesLoaded()) return null;
    return FGProgressManager.getInstance();
}

/**
 * 通过 ServerPlayer 或 UUID 获取玩家进度对象
 * @param {Internal.ServerPlayer|string} playerOrUUID - 玩家对象或 UUID 字符串
 * @returns {PlayerFieldGuideProgress|null}
 */
function getPlayerProgress(playerOrUUID) {
    let manager = getProgressManager();
    if (!manager) return null;

    if (typeof playerOrUUID === 'string') {
        // 传入的是 UUID 字符串
        let uuid = java.util.UUID.fromString(playerOrUUID);
        return manager.getProgress(uuid);
    } else {
        // 传入的是玩家对象: 显式取 UUID 再查，规避 Rhino 对重载方法 getProgress(ServerPlayer)/getProgress(UUID) 的参数转换歧义
        // 注意: KubeJS 将 Entity.getUUID() 重映射为 JS 的 getUuid()，getUUID() 在 JS 侧不存在
        return manager.getProgress(playerOrUUID.getUuid());
    }
}

/**
 * 获取玩家的已解锁条目集合
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @returns {string[]} 已解锁的条目 ID 列表
 */
function getUnlockedEntries(playerOrUUID) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return [];
    let entries = progress.getUnlockedEntries();
    // 转换为 JS 数组
    let result = [];
    let it = entries.iterator();
    while (it.hasNext()) result.push(String(it.next()));
    return result;
}

/**
 * 检查玩家是否解锁了某个条目
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId - 条目 ID，如 "minecraft:zombie"
 * @returns {boolean}
 */
function isUnlocked(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return false;
    return progress.isUnlocked(String(entryId));
}

/**
 * 获取玩家某个条目的发现时间（系统时间戳，毫秒）
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {number}
 */
function getDiscoveryTime(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return 0;
    return progress.getDiscoveryTime(String(entryId));
}

/**
 * 获取玩家某个条目的发现时间（游戏内时间）
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {number}
 */
function getDiscoveryGameTime(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return 0;
    return progress.getDiscoveryGameTime(String(entryId));
}

/**
 * 获取玩家某个条目的自定义名称
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {string|null}
 */
function getCustomName(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return null;
    let name = progress.getCustomName(String(entryId));
    return name ? String(name) : null;
}

/**
 * 获取玩家某个条目的自定义描述
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {string|null}
 */
function getCustomDescription(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return null;
    let desc = progress.getCustomDescription(String(entryId));
    return desc ? String(desc) : null;
}

/**
 * 获取玩家某个条目的照片数据
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {string|null}
 */
function getEntryPhotograph(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return null;
    let photo = progress.getEntryPhotograph(String(entryId));
    return photo ? String(photo) : null;
}

/**
 * 获取玩家某个条目的已解锁变体列表
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {string[]}
 */
function getUnlockedVariants(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return [];
    let variants = progress.getUnlockedVariants(String(entryId));
    let result = [];
    for (let i = 0; i < variants.size(); i++) result.push(String(variants.get(i)));
    return result;
}

/**
 * 获取玩家某个条目的选中变体
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} entryId
 * @returns {string|null}
 */
function getSelectedVariant(playerOrUUID, entryId) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return null;
    let variant = progress.getSelectedVariant(String(entryId));
    return variant ? String(variant) : null;
}

/**
 * 获取玩家的收集进度摘要（解锁数量、条目列表等）
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @returns {object} { uuid, totalUnlocked, entries, entryDetails }
 */
function getProgressSummary(playerOrUUID) {
    let progress = getPlayerProgress(playerOrUUID);
    if (!progress) return null;

    let entries = getUnlockedEntries(playerOrUUID);

    // 构建每个条目的详细信息
    let entryDetails = {};
    entries.forEach(function(entryId) {
        entryDetails[entryId] = {
            discoveryTime: getDiscoveryTime(playerOrUUID, entryId),
            discoveryGameTime: getDiscoveryGameTime(playerOrUUID, entryId),
            customName: getCustomName(playerOrUUID, entryId),
            customDescription: getCustomDescription(playerOrUUID, entryId),
            photograph: getEntryPhotograph(playerOrUUID, entryId),
            selectedVariant: getSelectedVariant(playerOrUUID, entryId),
            variants: getUnlockedVariants(playerOrUUID, entryId)
        };
    });

    return {
        totalUnlocked: entries.length,
        entries: entries,
        entryDetails: entryDetails
    };
}

/**
 * 获取所有已安装的条目 ID（来自 Field-Guide 条目注册表）
 * @returns {string[]}
 */
function getAllEntryIds() {
    if (!ensureClassesLoaded()) return [];
    let manager = FGServerManager.getInstance();
    let ids = manager.getAllEntryIds();
    let result = [];
    let it = ids.iterator();
    while (it.hasNext()) result.push(String(it.next()));
    return result;
}

/**
 * 计算玩家的收集完成百分比
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @returns {object} { unlocked, total, percentage }
 */
function getCompletionStats(playerOrUUID) {
    let allIds = getAllEntryIds();
    let unlocked = getUnlockedEntries(playerOrUUID);
    let total = allIds.length;

    // 只统计非变体条目的基础条目数
    let baseUnlocked = unlocked.filter(function(id) { return !id.includes('#'); });

    return {
        unlocked: baseUnlocked.length,
        total: total,
        percentage: total > 0 ? Math.round((baseUnlocked.length / total) * 10000) / 100 : 0
    };
}

/**
 * 获取指定分类（Category）下的所有条目 ID
 * @param {string} categoryId - 分类 ID，如 "fieldguide:plants" / "fieldguide:animals" / "fieldguide:monsters" / "fieldguide:bosses"（也兼容省略命名空间的 "plants"）
 * @returns {string[]} 该分类下的条目 ID 列表
 */
function getCategoryEntryIds(categoryId) {
    if (!ensureClassesLoaded()) return [];
    let manager = FGServerManager.getInstance();
    if (!manager) return [];

    let expectId = String(categoryId);
    // 兼容省略命名空间的写法（如 "plants" → "fieldguide:plants"）
    let expectShort = expectId.includes(':') ? expectId.split(':')[1] : expectId;

    let result = [];
    try {
        let categories = manager.getCategories();
        let it = categories.entrySet().iterator();
        while (it.hasNext()) {
            let pair = it.next();
            let key = String(pair.getKey());
            let keyShort = key.includes(':') ? key.split(':')[1] : key;
            if (key !== expectId && keyShort !== expectShort) continue;

            let category = pair.getValue();
            let ids = category.getEntryIds();
            if (ids != null) {
                for (let i = 0; i < ids.size(); i++) result.push(String(ids.get(i)));
            }
            break;
        }
    } catch (e) {
        console.error('[FieldGuideReader] 获取分类条目失败 (' + categoryId + '): ' + e);
    }
    return result;
}

/**
 * 计算玩家在指定分类中的收集完成百分比
 * @param {Internal.ServerPlayer|string} playerOrUUID
 * @param {string} categoryId - 分类 ID，如 "fieldguide:plants"
 * @returns {object} { unlocked, total, percentage }
 */
function getCategoryCompletionStats(playerOrUUID, categoryId) {
    let allIds = getCategoryEntryIds(categoryId);

    // 只统计非变体条目的基础条目数（与 getCompletionStats 语义一致）
    let baseAll = allIds.filter(function(id) { return !id.includes('#'); });
    let allKeys = {};
    baseAll.forEach(function(id) { allKeys[id] = true; });

    let unlockedIds = getUnlockedEntries(playerOrUUID);
    let baseUnlocked = unlockedIds.filter(function(id) {
        return !id.includes('#') && allKeys[id] === true;
    });

    let total = baseAll.length;
    return {
        unlocked: baseUnlocked.length,
        total: total,
        percentage: total > 0 ? Math.round((baseUnlocked.length / total) * 10000) / 100 : 0
    };
}

// ============================================================
// 注册 KubeJS 命令，方便在游戏中直接查询
// 模式参照项目中其他可用的 ServerEvents.commandRegistry
// (get_hostile_mobs.js / get_attributes.js / Plugins.js):
//   1. source.sendSuccess/sendFailure 必须传 Component(Component.string)，
//      传裸字符串会因无法转换 String -> Component 导致"执行命令时出现意外错误"
//   2. 根命令带 executes 显示用法，避免裸敲 /fgreader 报"未知或不完整命令"
//   3. try/catch 包裹执行体，出错时输出明确提示
// ============================================================
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('fgreader')
            .requires(src => src.hasPermission(0))
            .executes(ctx => {
                // 无参数时显示用法
                ctx.source.sendSuccess(
                    Component.string('§e用法: §f/fgreader <玩家> §7查看指定玩家收集进度 | §f/fgreader check <条目> §7查询解锁状态 | §f/fgreader stats §7查看自己的收集统计'),
                    false
                );
                return 1;
            })
            .then(
                Commands.argument('player', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        try {
                            let target = Arguments.PLAYER.getResult(ctx, 'player');
                            let summary = getProgressSummary(target);
                            if (!summary) {
                                ctx.source.sendFailure(Component.string('§c无法读取该玩家的 Field-Guide 进度数据'));
                                return 0;
                            }
                            ctx.source.sendSuccess(
                                Component.string(`§a玩家 §e${target.name.string} §a的 Field-Guide 收集进度: §e${summary.totalUnlocked} §a个条目已解锁`),
                                false
                            );
                            return 1;
                        } catch (ex) {
                            ctx.source.sendFailure(Component.string(`§c执行出错: ${ex}`));
                            console.error('[FieldGuideReader] ' + ex);
                            return 0;
                        }
                    })
            )
            .then(
                Commands.literal('check')
                    .then(
                        Commands.argument('entry', Arguments.STRING.create(event))
                            .suggests((ctx, builder) => {
                                // 提示已安装的条目 ID，类似 Field-Guide 自带指令的 suggestResource 行为
                                try {
                                    if (ensureClassesLoaded()) {
                                        let ids = FGServerManager.getInstance().getAllEntryIds();
                                        let it = ids.iterator();
                                        while (it.hasNext()) builder.suggest(String(it.next()));
                                    }
                                } catch (e) {
                                    console.error('[FieldGuideReader] 条目建议加载失败: ' + e);
                                }
                                return builder.buildFuture();
                            })
                            .executes(ctx => {
                                try {
                                    let player = ctx.source.playerOrException;
                                    let entryId = Arguments.STRING.getResult(ctx, 'entry');
                                    let unlocked = isUnlocked(player, entryId);
                                    ctx.source.sendSuccess(
                                        Component.string(`§e条目 ${entryId}: ${unlocked ? '§a已解锁' : '§c未解锁'}`),
                                        false
                                    );
                                    return 1;
                                } catch (ex) {
                                    ctx.source.sendFailure(Component.string(`§c执行出错: ${ex}`));
                                    console.error('[FieldGuideReader] ' + ex);
                                    return 0;
                                }
                            })
                    )
            )
            .then(
                Commands.literal('stats')
                    .executes(ctx => {
                        try {
                            let player = ctx.source.playerOrException;
                            let stats = getCompletionStats(player);
                            ctx.source.sendSuccess(
                                Component.string(`§a收集进度: §e${stats.unlocked}/${stats.total} §a(${stats.percentage}%)`),
                                false
                            );
                            return 1;
                        } catch (ex) {
                            ctx.source.sendFailure(Component.string(`§c执行出错: ${ex}`));
                            console.error('[FieldGuideReader] ' + ex);
                            return 0;
                        }
                    })
            )
    );
    console.info('[FieldGuideReader] 指令已注册: /fgreader <player> | /fgreader check <entry> | /fgreader stats');
});

// 导出函数供其他脚本使用
global.FieldGuideReader = {
    getPlayerProgress: getPlayerProgress,
    getUnlockedEntries: getUnlockedEntries,
    isUnlocked: isUnlocked,
    getDiscoveryTime: getDiscoveryTime,
    getDiscoveryGameTime: getDiscoveryGameTime,
    getCustomName: getCustomName,
    getCustomDescription: getCustomDescription,
    getEntryPhotograph: getEntryPhotograph,
    getUnlockedVariants: getUnlockedVariants,
    getSelectedVariant: getSelectedVariant,
    getProgressSummary: getProgressSummary,
    getAllEntryIds: getAllEntryIds,
    getCompletionStats: getCompletionStats,
    getCategoryEntryIds: getCategoryEntryIds,
    getCategoryCompletionStats: getCategoryCompletionStats
};

console.info('[FieldGuideReader] Field-Guide 进度读取工具已加载');