// priority: 1500
// ==========================================
// 🌙 迷你月球 (rainbow:mini_moon) - 释放期间玩家免疫一切伤害
// ==========================================
//
// 迷你月球的 mini_moon_aura 特效由 Skillwheel.js 通过
//   /dyeing area add scale mini_moon_aura <playerUuid> ...
// 作为「区域特效」绑定在施法者 UUID 上。
// 因此直接通过 global.getActiveDyeingEffects(受伤实体) 查询，
// 若该实体当前正在播放 mini_moon_aura，则视为处于迷你月球护盾中，免疫全部伤害。
//
// 依赖:
//   global.getActiveDyeingEffects (server_scripts/dyeing/getDyeingEffects.js)
//   迷你月球技能 (server_scripts/curios_skill_system/Skillwheel.js)
//
// 说明: mini_moon_aura 为临时特效(endAction=remove)，动画结束会被
//       Dyeing 服务端自动清理，从而自动失效，无需额外计时。

EntityEvents.hurt(event => {
    try {
        var entity = event.entity;
        if (entity == null) return;
        // 仅为玩家提供免疫（mini_moon_aura 只会绑定在施法者玩家身上）
        if (!(typeof entity.isPlayer === "function") || !entity.isPlayer()) return;

        var active = global.getActiveDyeingEffects(entity);
        if (active == null) return;

        for (var i = 0; i < active.length; i++) {
            if (active[i] != null && String(active[i].id) === "mini_moon_aura") {
                event.cancel();
                return;
            }
        }
    } catch (err) {
        console.log('[mini_moon] 免疫判断异常: ' + err);
    }
});

console.log("[mini_moon] 迷你月球免疫伤害逻辑已注册");