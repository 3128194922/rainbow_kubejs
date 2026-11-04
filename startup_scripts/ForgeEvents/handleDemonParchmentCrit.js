// priority: 5000
// 恶魔羊皮纸：实际触发暴击后施加 3 秒暴击率增幅效果。
function handleDemonParchmentCriticalHit(player) {
    try {
        if (player == null || !player.isPlayer()) return;
        if (player.level == null || player.level.isClientSide()) return;
        if (!hasCurios(player, 'rainbow:demon_parchment')) return;

        // 同类药水效果会刷新持续时间，不叠加多份 +30% 暴击率。
        player.potionEffects.add('rainbow:demon_parchment_crit', 60, 0);
    } catch (e) {
        console.log('[恶魔羊皮纸] 暴击触发增幅效果失败: ' + e);
    }
}
