// 寄生月只替换自然满月血月；选择结果按游戏日持久化，禁睡 Forge 监听在同名 startup_scripts 目录注册。
// /parasitemoon 手动触发使用独立 eventId，避免被血月满月调度器在非满月夜立即关闭。
const PARASITE_MOON_EVENT_KEY = 'rainbow:parasite_moon';
const PARASITE_MOON_MANUAL_EVENT_KEY = 'rainbow:parasite_moon_manual';
const PARASITE_MOON_ROLL_DAY = 'parasiteMoonRollDay';
const PARASITE_MOON_ROLL_VALUE = 'parasiteMoonRollValue';
const PARASITE_MOON_REPLACE_CHANCE = 0.25;

global.pickAutomaticMoon = function (level, day) {
    try {
        if (level == null || level.persistentData == null) return 'blood_moon';
        let data = level.persistentData;
        if (data.contains(PARASITE_MOON_ROLL_DAY) && data.getLong(PARASITE_MOON_ROLL_DAY) == day) {
            return data.getString(PARASITE_MOON_ROLL_VALUE);
        }
        let picked = Math.random() < PARASITE_MOON_REPLACE_CHANCE ? 'parasite_moon' : 'blood_moon';
        data.putLong(PARASITE_MOON_ROLL_DAY, day);
        data.putString(PARASITE_MOON_ROLL_VALUE, picked);
        return picked;
    } catch (e) {
        console.log('[寄生月] 抽取月相失败: ' + e);
        return 'blood_moon';
    }
};

// 不能走 /clanginghowl meteor_shower start 指令：指令只设置 forceMeteor 标志，
// mod 的 CHWorldData.tick() 里 setStartMeteorShower(true) 还要求
// dayTime % (MeteorShowerDays*24000) < 24000（本包配置为 15，仅每个周期第 0 天满足），
// 其余日子标志永远不落地且 forceMeteor 会卡死。这里直接调用 clanginghowl 通过
// ServerLevelMixin 挂在 ServerLevel 上的 getCHWorldData()，手动置齐启动标志。
function startParasiteMeteorShower(level) {
    try {
        let worldData = level.getCHWorldData();
        if (worldData == null) throw new Error('CHWorldData 未加载');
        worldData.setForceStop(false);
        // forceMeteor=true 让 tick 在 MeteorShower 配置关闭时仍处理陨石逻辑（canStart 恒真）。
        worldData.setForceMeteor(true);
        // 直接置启动标志绕过周期门；夜晚（dayTime%24000>=12000 且 isNight）来临时由 mod 端
        // 真正开始陨石雨，天亮或 180 秒时长到达后由 mod 的 stop() 统一清理全部标志。
        worldData.setStartMeteorShower(true);
    } catch (e) {
        console.log('[寄生月] 启动陨石雨失败: ' + e);
    }
}

// eventId 不传时默认为自然寄生月，供满月调度调用；手动指令传入手动 eventId。
global.startParasiteMoon = function (level, durationTicks, eventId) {
    try {
        if (level == null || level.isClientSide()) return false;
        if (eventId == null) eventId = PARASITE_MOON_EVENT_KEY;
        MoonJS.start(level, 'parasite_moon', {
            eventId: eventId,
            durationTicks: durationTicks,
            color: '#722A54',
            intensity: 0.55
        });
        // 陨石雨失败不影响月相本身，异常在内部单独记录。
        startParasiteMeteorShower(level);
        return true;
    } catch (e) {
        console.log('[寄生月] 启动月相失败: ' + e);
        return false;
    }
};

ServerEvents.commandRegistry(event => {
    // 管理员可从任意维度或控制台触发，目标固定为主世界；持续至下一次天亮。
    event.register(event.commands.literal('parasitemoon')
        .requires(source => source.hasPermission(2))
        .executes(ctx => {
            try {
                let level = ctx.source.getServer().overworld();
                if (level == null) throw new Error('主世界尚未加载');
                let dayTime = Number(level.dayTime());
                if (!Number.isFinite(dayTime)) throw new Error('世界时间无效');
                let timeOfDay = ((dayTime % 24000) + 24000) % 24000;
                // MoonJS 按游戏刻计时；正常时间流逝下持续至下一次天亮。
                if (!global.startParasiteMoon(level, 24000 - timeOfDay, PARASITE_MOON_MANUAL_EVENT_KEY)) {
                    throw new Error('寄生月启动失败');
                }
                ctx.source.sendSuccess(Component.literal('§5寄生月（虫血月）已开启，将在下一次天亮结束。'), true);
                return 1;
            } catch (error) {
                console.log('[寄生月] 手动触发失败: ' + error);
                ctx.source.sendFailure(Component.literal('§c触发寄生月失败，请查看 KubeJS 日志。'));
                return 0;
            }
        }));
});

