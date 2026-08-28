// priority: 1500
// ==========================================
// 🎨 Dyeing 特效查询 global 全局函数封装
// ==========================================
// 前置 mod:
//   - Dyeing  (E:\Server_mod\Dyeing)
//
// 底层 API (由 startup_scripts/CONST.js 注入):
//   $DyeingMod = Java.loadClass('com.example.dyeing.DyeingMod')
//   $DyeingMod.getPaintData(server)         → PaintSavedData       (getAll(uuid) → Map<String, PaintData>)
//   $DyeingMod.getUVData(server)            → UVSavedData          (getAll(uuid) → Map<String, UVData>)
//   $DyeingMod.getAreaPaintData(server)     → AreaPaintSavedData   (getAll(uuid) → Map<String, AreaPaintData>)
//   $DyeingMod.getAreaUVData(server)        → AreaUVSavedData      (getAll(uuid) → Map<String, AreaUVData>)
//   $DyeingMod.getScreenOverlayData(server) → ScreenOverlaySavedData(getAll(uuid) → Map<String, ScreenOverlayData>)
//   $DyeingMod.getTrailData(server)         → TrailSavedData       (get(uuid) → TrailData 单条配置)
//
// 本文件提供 global 函数封装:
//   global.getActiveDyeingEffects(entity)
//     → 实体当前正在播放的 Dyeing 特效列表，形如 [{type:"uv", id:"freeze_ice"}, ...]
//     → 实体无效 / 无服务端 / 没有任何特效时返回 null
//
// 注意: 特效数据持久化在 server 端 "Current Dyeing 数据" 中，
//       服务端每隔 tick 由 DyeingMod.cleanupFinishedAnimations 自动清理已结束
//       (autoRemove) 的特效；永久特效 (playCount=-1) 会保留，如实返回。

/**
 * 将 Java Map<String, Data> 的 keySet 转为 id 数组并追加到 result
 * 返回捕获到的特效数量
 * @param {Map} effectMap   Java Map 接口 (keySet/int大小写兼容)
 * @param {string} type     特效类别名
 * @param {Array} result    收集结果的数组 (每项 {type, id})
 * @returns {number}
 */
function collectDyeingMap(effectMap, type, result) {
    try {
        if (effectMap == null) return 0;
        var keys = effectMap.keySet().toArray();
        var count = 0;
        for (var i = 0; i < keys.length; i++) {
            result.push({ type: type, id: String(keys[i]) });
            count++;
        }
        return count;
    } catch (err) {
        console.log('[Dyeing查询] 收集 "' + type + '" 特效异常: ' + err);
        return 0;
    }
}

/**
 * 获取实体当前正在播放的 Dyeing 特效
 *
 * @param {Internal.Entity} entity 目标实体 (需在服务端世界，可获得 MinecraftServer)
 * @returns {Array<{type:string, id:string}>|null}
 *          有特效时返回 [{type, id}, ...]；实体无效/无服务端/无特效时返回 null
 */
global.getActiveDyeingEffects = function (entity) {
    try {
        if (entity == null) {
            console.log('[Dyeing查询] 查询失败: entity 为 null');
            return null;
        }
        let server = (entity.level != null) ? entity.level.server : null;
        if (server == null) {
            console.log('[Dyeing查询] 查询失败: 无法获取 server');
            return null;
        }
        let uuid = entity.uuid.toString();
        let result = [];

        // 六类特效应有数据统一查询
        collectDyeingMap($DyeingMod.getPaintData(server).getAll(uuid), "paint", result);
        collectDyeingMap($DyeingMod.getUVData(server).getAll(uuid), "uv", result);
        collectDyeingMap($DyeingMod.getAreaPaintData(server).getAll(uuid), "areaPaint", result);
        collectDyeingMap($DyeingMod.getAreaUVData(server).getAll(uuid), "areaUV", result);
        collectDyeingMap($DyeingMod.getScreenOverlayData(server).getAll(uuid), "screenOverlay", result);

        // 残影(trail) 为单条配置，无 id，存在即视为一条特效
        try {
            let trail = $DyeingMod.getTrailData(server).get(uuid);
            if (trail != null) result.push({ type: "trail", id: "trail" });
        } catch (err) {
            console.log('[Dyeing查询] 收集 "trail" 特效异常: ' + err);
        }

        if (result.length === 0) return null;
        return result;
    } catch (err) {
        console.log('[Dyeing查询] 查询异常: ' + err);
        return null;
    }
}

console.log("[Dyeing查询] global.getActiveDyeingEffects 已注册");