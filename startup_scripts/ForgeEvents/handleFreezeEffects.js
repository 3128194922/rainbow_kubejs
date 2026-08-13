// priority: 5000
/**
 * 冻结效果：当受伤实体的冻结时间超过其碰撞箱体积时，
 * 为其附着蓝冰（blue_ice）UV 贴图层，并冻结生物指定时间（时间与 UV 贴图持续时间相同）
 * 仿照点金手套（handleAttackCurios.js）使用 /dyeing uv add static 命令实现
 */
function handleFreezeEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    try {
        if (!victim || victim.isDeadOrDying()) return;

        // 获取实体当前冻结时间（tick）
        let frozenTicks = victim.getTicksFrozen();
        if (frozenTicks <= 0) return;

        // 计算碰撞箱体积
        let aabb = victim.getBoundingBox();
        let volume = aabb.getXsize() * aabb.getYsize() * aabb.getZsize() * 3;
        // 体积不足1格则按1计算，避免除零
        if (volume < 1.0) volume = 1.0;
        // 阈值：体积 * 20 tick（1体积格 = 1秒 = 60tick）
        let durationTicks = Math.floor(volume * 60);

        //console.log('handleFreezeEffects - 实体: ' + victim.getName().getString() + ' | 体积: ' + volume.toFixed(2) + ' 格 | 已冻结: ' + frozenTicks + ' tick | 阈值: ' + durationTicks + ' tick');

        if (frozenTicks <= durationTicks) return;

        // 触发冻结后立即清零实体的原版冻结效果
        victim.setTicksFrozen(0);

        // 附着蓝冰 UV 贴图层（静态UV）：scale=1.05 additive=false fullbright=false uv_scale_u=8.0 uv_scale_v=8.0
        let server = victim.level.server;
        let uuid = victim.uuid.toString();
        let paintId = "freeze_ice";
        server.runCommandSilent("/dyeing uv add static " + paintId + " " + uuid + " minecraft:textures/block/blue_ice.png 1.0 false false 8.0 8.0");

        // 冻结实体，durationTicks后同时解冻并移除UV贴图层（单位统一为tick）
        if (global.freezeEntity(victim)) {
            server.scheduleInTicks(durationTicks/6, function() {
                try {
                    global.unfreezeEntity(victim);
                    server.runCommandSilent("/dyeing uv remove " + uuid + " " + paintId);
                } catch (err) {
                    console.log("[冻结] 解冻/移除UV错误: " + err);
                }
            });
        }
    } catch(e) {
        console.log('handleFreezeEffects报错:')
        console.log(e)
    }
}