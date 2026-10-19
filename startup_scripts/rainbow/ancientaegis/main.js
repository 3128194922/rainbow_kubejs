// priority: 1000
// 远古之庇护：只允许 MineTeam 非白色队伍的玩家装备；白队伍是 MineTeam 默认队伍，按未组队处理。

const ANCIENT_AEGIS_MINE_TEAM_COLORS = ['black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'];

function ancientAegisCanEquip(slotContext, stack) {
    try {
        let entity = slotContext.entity();
        if (entity == null || !entity.isPlayer()) return false;

        if (typeof global.ancientAegisIsInTeam === 'function') return global.ancientAegisIsInTeam(entity);

        // MineTeam 将所选颜色同步为原版 Scoreboard 队伍；白队伍是默认队伍，不算有效小队。
        let team = entity.getTeam();
        if (team == null) return false;
        let teamName = String(team.getName());
        return teamName !== 'white' && ANCIENT_AEGIS_MINE_TEAM_COLORS.indexOf(teamName) >= 0;
    } catch (e) {
        console.log('[远古之庇护] 判断装备资格失败: ' + e);
        return false;
    }
}
