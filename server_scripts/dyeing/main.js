// priority: 1000
/**
 * Dyeing 特效残留清理：服务器加载时清空全部 dyeing 数据
 * 防止 UV/油漆/区域/公告板/屏幕覆盖层等特效在服务器关闭前来不及移除，
 * 导致下次进入游戏出现永久残留特效
 * 注意：持有 PRESERVED_EFFECT_IDS 白名单中特效 id 的实体跳过清理，
 * 保证服务器重启后仍存活的 mini boss 等永久特效得以保留。
 * 判断依据为「特效 id」，不依赖实体加载状态（重启后未加载区块中的实体也能正确保留）
 */

// 可配置：需要永久保留、跳过清理的特效 id 白名单（匹配到任意 id 即跳过该实体全部特效的清理）
const PRESERVED_EFFECT_IDS = [
    "mini_boss_creeper_armor" // mini boss 变身滚动纹理（当前使用）
];

// 判断该 UUID 对应的实体是否为 mini boss（实体存在且标记 isMiniBoss）
function isMiniBossEntity(server, uuidStr) {
    try {
        let entity = server.getEntity(uuidStr);
        return entity != null && entity.persistentData.getBoolean("isMiniBoss");
    } catch (err) {
        console.log('[Dyeing清理] 查询实体异常 uuid=' + uuidStr + ' err=' + err);
        return false;
    }
}

// 判断该 UUID 的数据中是否存在 PRESERVED_EFFECT_IDS 白名单中的特效 id
// 特效数据持久化在磁盘，实体位于未加载区块时也能正确识别
function hasPreservedEffect(savedData, uuid) {
    try {
        let effectMap = savedData.getAll(uuid);
        if (effectMap == null || effectMap.isEmpty()) return false;
        let ids = effectMap.keySet().toArray();
        for (let i = 0; i < ids.length; i++) {
            let id = ids[i].toString();
            if (PRESERVED_EFFECT_IDS.includes(id)) return true;
        }
        return false;
    } catch (err) {
        console.log('[Dyeing清理] 检查特效id异常 uuid=' + uuid + ' err=' + err);
        return false;
    }
}

// 综合判断该 uuid 是否应跳过清理：实体为 mini boss 或持有白名单特效 id
function shouldSkipDyeing(savedData, server, uuid) {
    if (isMiniBossEntity(server, uuid.toString())) return true;
    return hasPreservedEffect(savedData, uuid);
}

// 清空支持 removeAll 的数据类（Paint/UV/AreaPaint/Billboard/ScreenOverlay）
// 白名单特效所属实体的记录会被跳过，不计入清理统计
// 返回: 移除的实体条数
function clearDyeingEntries(savedData, server) {
    let entityCount = 0;
    let effectCount = 0;
    let keys = savedData.getEntries().keySet().toArray();
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (shouldSkipDyeing(savedData, server, key)) {
            console.log('[Dyeing清理] 跳过白名单特效 uuid=' + key);
            continue;
        }
        effectCount += savedData.getAll(key).size();
        if (savedData.removeAll(key)) {
            entityCount++;
        }
    }
    return entityCount + '/' + effectCount;
}

// 清空区域UV（AreaUVSavedData 无 removeAll 方法，需逐条 remove）
// 白名单特效所属实体的记录会被跳过，不计入清理统计
// 返回: 移除的实体条数
function clearAreaUVEntries(server) {
    let savedData = $DyeingMod.getAreaUVData(server);
    let entityCount = 0;
    let effectCount = 0;
    let keys = savedData.getEntries().keySet().toArray();
    for (let i = 0; i < keys.length; i++) {
        let uuid = keys[i];
        if (shouldSkipDyeing(savedData, server, uuid)) {
            console.log('[Dyeing清理] 跳过白名单区域UV特效 uuid=' + uuid);
            continue;
        }
        let ids = savedData.getAll(uuid).keySet().toArray();
        effectCount += ids.length;
        for (let j = 0; j < ids.length; j++) {
            savedData.remove(uuid, ids[j]);
        }
        entityCount++;
    }
    return entityCount + '/' + effectCount;
}

// 服务器加载完成时执行清理
ServerEvents.loaded(event => {
    try {
        let server = event.server;
        // 清空静态/动画油漆层
        let paintResult = clearDyeingEntries($DyeingMod.getPaintData(server));
        // 清空实体UV贴图层
        let uvResult = clearDyeingEntries($DyeingMod.getUVData(server));
        // 清空区域油漆
        let areaPaintResult = clearDyeingEntries($DyeingMod.getAreaPaintData(server));
        // 清空区域UV
        let areaUVResult = clearAreaUVEntries(server);
        // 清空公告板层
        let billboardResult = clearDyeingEntries($DyeingMod.getBillboardData(server));
        // 清空屏幕覆盖层
        let screenResult = clearDyeingEntries($DyeingMod.getScreenOverlayData(server));
        console.log('[Dyeing清理] 完成(实体/特效) | paint=' + paintResult + ' uv=' + uvResult + ' areaPaint=' + areaPaintResult + ' areaUV=' + areaUVResult + ' billboard=' + billboardResult + ' screen=' + screenResult);
    } catch (err) {
        console.log('[Dyeing清理] 错误: ' + err);
    }
});