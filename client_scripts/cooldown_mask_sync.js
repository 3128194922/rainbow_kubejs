// ==========================================
// 物品冷却蒙版同步（客户端）
// 服务端减少物品冷却时不走 addCooldown（替换语义会把剩余值当作新的总时长，
// 导致蒙版以剩余值为满格重置重扫），而是直接前移冷却窗口，并经本通道通知
// 客户端对本地冷却做同样前移：蒙版进度 = 1 - 剩余/原有总时长，
// 进度瞬间前跳、总时长基准不漂移。
// 配套：startup_scripts/Utils.js 的 _cdShiftInstance / global.shiftCooldownWindowById
// ==========================================
NetworkEvents.dataReceived('kubejs_cd_shift', event => {
    try {
        let id = String(event.data.id || '');
        let delta = Number(event.data.d || 0);
        if (id && delta > 0 && global.shiftCooldownWindowById) {
            global.shiftCooldownWindowById(event.player, id, delta);
        }
    } catch (e) {
        console.error('[冷却蒙版同步] 处理失败: ' + e);
    }
});
