// priority: 5000
/**
 * 冻结效果：当受伤实体的冻结时间超过其碰撞箱体积时，
 * 为其添加冰蓝不透明油漆层，并冻结生物指定时间（时间与油漆层持续时间相同）
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

        // 添加冰蓝不透明油漆层（ARGB = 0xFFB4E6FF = -4921601，冰蓝色）
        let server = victim.level.server;
        let savedData = $DyeingMod.getPaintData(server);
        let uuid = victim.uuid;
        let paintData = $PaintData.staticPaint(-4921601, 1.0, 0.0, 0.0, 0.0);
        savedData.put(uuid, 'freeze_ice', paintData);
        $DyeingMod.broadcastUpdate(uuid, 'freeze_ice', paintData);

        // 冻结实体，durationTicks后同时解冻并移除油漆层（单位统一为tick）
        if (global.freezeEntity(victim)) {
            server.scheduleInTicks(durationTicks/6, function() {
                global.unfreezeEntity(victim);
                savedData.remove(uuid, 'freeze_ice');
                $DyeingMod.broadcastRemove(uuid, 'freeze_ice');
            });
        }
    } catch(e) {
        console.log('handleFreezeEffects报错:')
        console.log(e)
    }
}