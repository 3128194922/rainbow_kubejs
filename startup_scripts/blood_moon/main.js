// priority: 0
// MoonJS 月相必须在启动脚本注册；贴图放在 assets/rainbow/textures/moon/blood.png。
MoonJS.registerPhase('blood_moon', {
    texture: 'rainbow:textures/moon/blood.png',
    vanillaPhase: 0
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerSleepInBedEvent', event => {
    try {
        let player = event.getEntity();
        if (player == null || typeof global.bloodMoonIsActive != 'function') return;
        if (global.bloodMoonIsActive(player.level)) {
            // Forge 在玩家真正进入睡眠前读取此结果。
            event.setResult(BedSleepingProblem.NOT_POSSIBLE_NOW);
            player.tell('血月之下无法入睡');
        }
    } catch (error) {
        console.log('[BloodMoon] 阻止睡眠失败: ' + error);
    }
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn', event => {
    try {
        if (event.getSpawnType() != MobSpawnType.NATURAL) return;
        let entity = event.getEntity();
        if (entity == null || typeof global.bloodMoonIsActive != 'function') return;
        let id = entity.getEncodeId();
        if (id == null) return;
        let type = ForgeRegistries.ENTITY_TYPES.getValue(new ResourceLocation(String(id)));
        if (type == null || type.getCategory() != MobCategory.MONSTER) return;
        if (!global.bloodMoonIsActive(entity.level)) return;
        // 在自然生成阶段标记；server_scripts 的加入世界事件再复用完整迷你 Boss 转化流程。
        entity.persistentData.putBoolean('_blood_moon_natural_spawn', true);
    } catch (error) {
        console.log('[BloodMoon] 标记自然生成怪物失败: ' + error);
    }
});
