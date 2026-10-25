// priority: 0
// MineTeam 0.0.3原Clone未恢复失效cap；死亡时补全完整数据、服务端队伍和UI同步。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerEvent$Clone', event => {
    let original = null;
    let revived = false;
    try {
        let player = event.getEntity();
        if (!event.isWasDeath() || player.level.isClientSide() || MineTeamCapability == null) return;
        original = event.getOriginal();
        original.reviveCaps();
        revived = true;
        let from = MineTeamCapability.get(original).orElse(null);
        let to = MineTeamCapability.get(player).orElse(null);
        if (from == null || to == null) throw new Error('MineTeam capability缺失');
        to.data.copy(from.data);
        let scoreboard = player.server.getScoreboard();
        let team = scoreboard.getPlayerTeam(String(to.data.getColor()));
        if (team != null) scoreboard.addPlayerToTeam(player.getScoreboardName(), team);
        // MineTeam自己的init发送TeamDataSyncS2CPayload，客户端面板不会残留默认白色。
        to.init(player);
    } catch (e) {
        console.log('[死亡保留队伍] Clone复制失败: ' + e);
    } finally {
        if (revived && original != null) {
            try { original.invalidateCaps(); }
            catch (e) { console.log('[死亡保留队伍] 清理原cap失败: ' + e); }
        }
    }
});
