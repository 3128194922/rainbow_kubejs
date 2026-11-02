// priority: 1000
// 远古之庇护：只允许 MineTeam 非白色队伍的玩家装备；白队伍是 MineTeam 默认队伍，按未组队处理。

// MineTeam 颜色集合：装备校验按键查询，保持允许颜色清单不变。
const ANCIENT_AEGIS_MINE_TEAM_COLORS = {'black': true, 'dark_blue': true, 'dark_green': true, 'dark_aqua': true, 'dark_red': true, 'dark_purple': true, 'gold': true, 'gray': true, 'dark_gray': true, 'blue': true, 'green': true, 'aqua': true, 'red': true, 'light_purple': true, 'yellow': true, 'white': true};

function ancientAegisCanEquip(slotContext, stack) {
    try {
        let entity = slotContext.entity();
        if (entity == null || !entity.isPlayer()) return false;

        if (typeof global.ancientAegisIsInTeam === 'function') return global.ancientAegisIsInTeam(entity);

        // MineTeam 将所选颜色同步为原版 Scoreboard 队伍；白队伍是默认队伍，不算有效小队。
        let team = entity.getTeam();
        if (team == null) return false;
        let teamName = String(team.getName());
        return teamName !== 'white' && ANCIENT_AEGIS_MINE_TEAM_COLORS[teamName] === true;
    } catch (e) {
        console.log('[远古之庇护] 判断装备资格失败: ' + e);
        return false;
    }
}
