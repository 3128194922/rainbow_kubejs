// priority: 1000
// 远古之庇护：TeamJS 队伍入口、队伍查询桥接与退队清理。

const ANCIENT_AEGIS_ID = 'rainbow:ancientaegis';

function ancientAegisGetTeam(player) {
    try {
        if (player == null || !player.isPlayer()) return null;
        return TeamJS.of(player);
    } catch (e) {
        console.log('[远古之庇护] 查询 TeamJS 队伍失败: ' + e);
        return null;
    }
}

function ancientAegisRemoveFromCurios(player) {
    try {
        if (player == null || !player.isPlayer()) return;

        let curios = getCuriosInventorySafe(player);
        if (curios == null) return;

        for (let entry of curios.getCurios().entrySet()) {
            let slotName = String(entry.getKey());
            let stacks = entry.getValue().getStacks();
            let size = stacks.getSlots();

            for (let index = 0; index < size; index++) {
                let stack = stacks.getStackInSlot(index);
                if (stack == null || stack.isEmpty() || String(stack.getId()) !== ANCIENT_AEGIS_ID) continue;

                let removed = stack.copy();
                stacks.setStackInSlot(index, ItemStack.EMPTY);
                if (!player.addItem(removed)) player.drop(removed, false);
                player.tell('§e你已退出小队，远古之庇护已卸下。');
            }
        }
    } catch (e) {
        console.log('[远古之庇护] 退队卸下饰品失败: ' + e);
    }
}

// startup_scripts 的 Curios 判定和 Forge 伤害事件只能通过 global 使用服务器侧 TeamJS。
global.ancientAegisIsInTeam = function (player) {
    return ancientAegisGetTeam(player) != null;
};

// A 方案：只收集当前受伤者所在 TeamJS 队伍内，在线且佩戴远古之庇护的玩家。
global.getAncientAegisDamageTargets = function (player) {
    try {
        let team = ancientAegisGetTeam(player);
        if (team == null) return [];

        let members = team.getOnlineMembers();
        let targets = [];
        for (let member of members) {
            if (member == null || !member.isAlive()) continue;
            if (hasCurios(member, ANCIENT_AEGIS_ID)) targets.push(member);
        }
        return targets;
    } catch (e) {
        console.log('[远古之庇护] 获取伤害分担成员失败: ' + e);
        return [];
    }
};

// 手持远古之庇护右键打开 TeamJS 队伍 GUI；不再绑定单个玩家 UUID。
ItemEvents.rightClicked(ANCIENT_AEGIS_ID, event => {
    try {
        if (event.hand != null && String(event.hand) !== 'MAIN_HAND') return;

        let player = event.player;
        let result = TeamJS.openGui(player);
        if (!result.success) player.tell('§c无法打开队伍界面：' + result.message);
    } catch (e) {
        console.log('[远古之庇护] 打开 TeamJS 队伍界面失败: ' + e);
    }
});

// 退队后立即卸下；处理在线主动退出、被踢出以及队伍解散。
TeamJSEvents.memberLeft(event => {
    try {
        ancientAegisRemoveFromCurios(event.player);
    } catch (e) {
        console.log('[远古之庇护] memberLeft 清理失败: ' + e);
    }
});

TeamJSEvents.disbanded(event => {
    try {
        let team = event.team;
        if (team == null) return;
        for (let member of team.getOnlineMembers()) {
            ancientAegisRemoveFromCurios(member);
        }
    } catch (e) {
        console.log('[远古之庇护] disbanded 清理失败: ' + e);
    }
});

// 防止玩家离线期间被移出队伍后，重新登录仍保留已装备饰品。
PlayerEvents.loggedIn(event => {
    try {
        let player = event.player;
        if (player == null || player.level.isClientSide()) return;
        if (!global.ancientAegisIsInTeam(player)) ancientAegisRemoveFromCurios(player);
    } catch (e) {
        console.log('[远古之庇护] 登录时检查队伍失败: ' + e);
    }
});
