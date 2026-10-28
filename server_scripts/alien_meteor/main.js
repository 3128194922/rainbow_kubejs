// priority: 1000
// 异星陨石沿用mini_moon ID；主动持续AOE，不再推拉实体。
const ALIEN_METEOR_DURATION = 200;
const ALIEN_METEOR_RADIUS = 5;
// Dyeing 白色矩形气场特效 id，随技能开启添加、终止移除。
const ALIEN_METEOR_AURA_ID = 'alien_meteor_aura';

// 技能轮盘支持主手/副手物品触发（skillwheel 的 vanilla_mainhand/offhand 来源），
// 持续期间物品在 Curios 饰品栏或主/副手任一位置都算有效佩戴；
// 仅检查 Curios 会在手持触发的下一 tick 清除状态，导致特效与伤害永不执行。
function alienMeteorKept(player) {
    if (hasCurios(player, 'rainbow:mini_moon')) return true;
    let main = player.getItemInHand('main_hand');
    if (main != null && !main.isEmpty() && main.id == 'rainbow:mini_moon') return true;
    let off = player.getItemInHand('off_hand');
    return off != null && !off.isEmpty() && off.id == 'rainbow:mini_moon';
}

// 白色矩形气场：Dyeing 区域特效绑定施法者 UUID、矩形随实体移动。
// 边界 -5~5 对应 AOE 半径 5；前 20 tick 从中心（scale 0.25）扩张到全尺寸（scale 1.0，play_count=1 + end 保持），
// 其后以 40 tick/圈持续顺时针旋转（rotation_period=40、rotation_mode=-1 无限），直到技能结束由脚本移除。
function addAlienMeteorAura(player) {
    player.server.runCommandSilent('dyeing area add scale ' + ALIEN_METEOR_AURA_ID + ' ' + player.getUuid().toString()
        + ' -5 0 -5 5 3 5 FFFFFFFF 0.25 1.0 0.45 0.35 20 1 end 40 -1');
}

function removeAlienMeteorAura(player) {
    player.server.runCommandSilent('dyeing area remove ' + player.getUuid().toString() + ' ' + ALIEN_METEOR_AURA_ID);
}

global.startAlienMeteor = function (player) {
    try {
        if (player == null || player.level.isClientSide() || player.cooldowns.isOnCooldown('rainbow:mini_moon')) return;
        player.persistentData.putLong('AlienMeteorUntil', player.level.getTime() + ALIEN_METEOR_DURATION);
        player.cooldowns.addCooldown('rainbow:mini_moon', 300);
        global.playPlayerAnim(player, 'rainbow:repel');
        addAlienMeteorAura(player);
    } catch (e) { console.log('[异星陨石] 开启失败: ' + e); }
};

PlayerEvents.tick(event => {
    try {
        let player = event.player;
        // 性能优化：入口 20 tick 节流，未激活时不再每 tick 读 NBT；脉冲与到期清除粒度均为 20 tick
        if (!everyTicks(player, 20)) return;
        // 性能埋点：包裹在节流早退判断之内，早退 tick 不计入统计（system/perf/probe.js 提供）
        global.perfTime('alien_meteor-playerTick', () => {
        let data = player.persistentData;
        let until = data.getLong('AlienMeteorUntil');
        if (until <= 0) return;
        // 到期判定用 >：最后一 tick（time == until）仍执行当次脉冲，凑满 200/20=10 次。
        if (!player.isAlive() || !alienMeteorKept(player) || player.level.getTime() > until) {
            data.remove('AlienMeteorUntil');
            removeAlienMeteorAura(player);
            return;
        }
        if (typeof global.rebalanceAoe == 'function') {
            global.rebalanceAoe(player, player.getX(), player.getY(), player.getZ(), ALIEN_METEOR_RADIUS, 6, 'alien_meteor', 'root', null);
        }
        }); // global.perfTime 包裹结束
    } catch (e) { console.log('[异星陨石] 持续AOE失败: ' + e); }
});

// 下线即关闭，避免绝对世界时间留到下一次登录后重新启动。
PlayerEvents.loggedOut(event => {
    try {
        event.player.persistentData.remove('AlienMeteorUntil');
        removeAlienMeteorAura(event.player);
    }
    catch (e) { console.log('[异星陨石] 下线清理失败: ' + e); }
});
