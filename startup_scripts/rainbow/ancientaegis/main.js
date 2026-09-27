// priority: 1000
// 远古之庇护：Curios 装备条件。TeamJS 只在服务器脚本可用，客户端使用其同步的原版队伍作判定。

function ancientAegisCanEquip(slotContext, stack) {
    try {
        let entity = slotContext.entity();
        if (entity == null || !entity.isPlayer()) return false;

        if (typeof global.ancientAegisIsInTeam === 'function') {
            return global.ancientAegisIsInTeam(entity);
        }

        // TeamJS 默认开启 vanillaSync；客户端可通过原版 Scoreboard 收到队伍成员状态。
        return entity.getTeam() != null;
    } catch (e) {
        console.log('[远古之庇护] 判断装备资格失败: ' + e);
        return false;
    }
}
