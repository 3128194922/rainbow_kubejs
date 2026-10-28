// priority: 1000
// 远古之庇护：使用 MineTeam 的原版颜色队伍，同一非白队伍内分担伤害。

const ANCIENT_AEGIS_ID = 'rainbow:ancientaegis';
const ANCIENT_AEGIS_MINE_TEAM_COLORS = ['black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'];
const ANCIENT_AEGIS_MINE_TEAM_INIT_STATE = { initialized: false };

function ancientAegisGetMineTeamName(player) {
    try {
        if (player == null || !player.isPlayer()) return null;

        let team = player.getTeam();
        if (team == null) return null;

        let teamName = String(team.getName());
        if (teamName === 'white' || ANCIENT_AEGIS_MINE_TEAM_COLORS.indexOf(teamName) < 0) return null;
        return teamName;
    } catch (e) {
        console.log('[远古之庇护] 查询 MineTeam 队伍失败: ' + e);
        return null;
    }
}

// MineTeam 仅在创建世界出生点时注册颜色队伍；为旧存档和热重载后的服务端补齐队伍。
function ancientAegisEnsureMineTeamScoreboard(server) {
    try {
        if (ANCIENT_AEGIS_MINE_TEAM_INIT_STATE.initialized) return;
        if (server == null) return;

        let createdCount = 0;
        for (let color of ANCIENT_AEGIS_MINE_TEAM_COLORS) {
            let added = server.runCommandSilent('team add ' + color + ' {"translate":"mine_team.team.' + color + '"}');
            if (added > 0) createdCount++;
            server.runCommandSilent('team modify ' + color + ' color ' + color);
        }
        ANCIENT_AEGIS_MINE_TEAM_INIT_STATE.initialized = true;
        console.log('[远古之庇护] MineTeam 颜色队伍已检查，补建 ' + createdCount + ' 个');
    } catch (e) {
        console.log('[远古之庇护] 检查 MineTeam 颜色队伍失败: ' + e);
    }
}

ServerEvents.loaded(event => {
    ancientAegisEnsureMineTeamScoreboard(event.server);
});

// /reload 不会再次触发 ServerEvents.loaded；改为玩家登录时兜底补齐（替代原每服务端 tick 轮询）。
// 性能优化：颜色队伍仅被本饰品的在线玩家伤害分担使用，登录时机补齐功能等价；
// 队伍数据保存在存档 scoreboard 中，/reload 与重启不会移除已存在的队伍。
PlayerEvents.loggedIn(event => {
    ancientAegisEnsureMineTeamScoreboard(event.player.server);
});

// 白队伍是 MineTeam 给玩家分配的默认队伍；在本饰品规则中按未组队处理。
global.ancientAegisIsInTeam = function (player) {
    return ancientAegisGetMineTeamName(player) != null;
};

// 收集同一非白队伍的其他在线存活队友，无需佩戴；允许跨维度分摊。
global.getAncientAegisDamageTargets = function (player) {
    try {
        let teamName = ancientAegisGetMineTeamName(player);
        if (teamName == null) return [];

        let onlinePlayers = player.server.getPlayerList().getPlayers();
        let targets = [];
        for (let member of onlinePlayers) {
            if (member == null || !member.isAlive()) continue;
            if (ancientAegisGetMineTeamName(member) !== teamName) continue;
            if (String(member.getUuid()) != String(player.getUuid())) targets.push(member);
        }
        return targets;
    } catch (e) {
        console.log('[远古之庇护] 获取 MineTeam 伤害分担成员失败: ' + e);
        return [];
    }
};

// MineTeam 队伍面板位于物品栏的队伍图标中；饰品右键提示玩家前往该入口。
ItemEvents.rightClicked(ANCIENT_AEGIS_ID, event => {
    try {
        if (event.hand != null && String(event.hand) !== 'MAIN_HAND') return;

        event.player.tell('§e打开物品栏，点击 MineTeam 队伍图标选择队伍；白队伍视为未组队。');
    } catch (e) {
        console.log('[远古之庇护] 显示 MineTeam 队伍提示失败: ' + e);
    }
});
