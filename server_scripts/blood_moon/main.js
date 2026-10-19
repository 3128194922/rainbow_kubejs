// priority: 0
// 满月夜自动触发或由 /bloodmoon 手动触发；MoonJS 统一管理主世界视觉状态。
const BLOOD_MOON_EVENT_ID = 'rainbow:blood_moon';
const BLOOD_MOON_MANUAL_EVENT_ID = 'rainbow:blood_moon_manual';
const BLOOD_MOON_SPAWN_MARKER = '_blood_moon_natural_spawn';

function startBloodMoon(level, eventId, durationTicks) {
    MoonJS.start(level, 'blood_moon', {
        eventId: eventId,
        durationTicks: durationTicks,
        color: '#B51F2F',
        intensity: 0.45
    });
}

global.bloodMoonIsActive = function (level) {
    try {
        if (level == null || level.isClientSide() || String(level.dimension) != 'minecraft:overworld') return false;
        let state = MoonJS.getState(level);
        if (state == null) return false;
        let eventId = String(state.get('eventId'));
        return eventId == BLOOD_MOON_EVENT_ID || eventId == BLOOD_MOON_MANUAL_EVENT_ID;
    } catch (error) {
        console.log('[BloodMoon] 查询事件状态失败: ' + error);
        return false;
    }
};

ServerEvents.commandRegistry(event => {
    // 管理员可从任意维度或控制台触发，目标固定为主世界。
    event.register(event.commands.literal('bloodmoon')
        .requires(source => source.hasPermission(2))
        .executes(ctx => {
            try {
                let level = ctx.source.getServer().overworld();
                if (level == null) throw new Error('主世界尚未加载');
                let dayTime = Number(level.dayTime());
                if (!Number.isFinite(dayTime)) throw new Error('世界时间无效');
                let timeOfDay = ((dayTime % 24000) + 24000) % 24000;
                // MoonJS 按游戏刻计时；正常时间流逝下持续至下一次天亮。
                startBloodMoon(level, BLOOD_MOON_MANUAL_EVENT_ID, 24000 - timeOfDay);
                ctx.source.sendSuccess(Component.literal('§c血月已开启，将在下一次天亮结束。'), true);
                return 1;
            } catch (error) {
                console.log('[BloodMoon] 手动触发失败: ' + error);
                ctx.source.sendFailure(Component.literal('§c触发血月失败，请查看 KubeJS 日志。'));
                return 0;
            }
        }));
});

LevelEvents.tick('minecraft:overworld', event => {
    try {
        let level = event.level;
        if (level == null || level.isClientSide()) return;
        let dayTime = Number(level.dayTime());
        if (!Number.isFinite(dayTime)) return;
        // 原版满月是每八天的第零天；12000 至次日 0 刻为当晚。
        let day = Math.floor(dayTime / 24000);
        let timeOfDay = ((dayTime % 24000) + 24000) % 24000;
        let isFullMoonNight = ((day % 8) + 8) % 8 == 0 && timeOfDay >= 12000;
        let state = MoonJS.getState(level);
        let currentEvent = state == null ? '' : String(state.get('eventId'));
        if (isFullMoonNight) {
            // 保留其他脚本已启动的月亮事件，不反复重启本血月。
            if (currentEvent == '' || currentEvent == 'null') {
                startBloodMoon(level, BLOOD_MOON_EVENT_ID, -1);
            }
        } else if (currentEvent == BLOOD_MOON_EVENT_ID) {
            MoonJS.stop(level);
        }
    } catch (error) {
        console.log('[BloodMoon] 满月调度失败: ' + error);
    }
});

EntityEvents.spawned(event => {
    try {
        let entity = event.entity;
        if (entity == null || entity.persistentData == null) return;
        if (!entity.persistentData.getBoolean(BLOOD_MOON_SPAWN_MARKER)) return;
        // 标记只用一次，存档重新载入时不会重复进行迷你 Boss 转化。
        entity.persistentData.remove(BLOOD_MOON_SPAWN_MARKER);
        if (!global.bloodMoonIsActive(entity.level)) return;
        // spawned 在实体加入世界前触发；延后一刻让 Dyeing 外观命令能查到实体。
        entity.level.server.scheduleInTicks(1, () => {
            try {
                if (entity.isAlive() && global.bloodMoonIsActive(entity.level)) {
                    convertToMiniBoss(entity);
                }
            } catch (error) {
                console.log('[BloodMoon] 延迟转化失败: ' + error);
            }
        });
    } catch (error) {
        console.log('[BloodMoon] 自然生成怪物转化失败: ' + error);
    }
});
