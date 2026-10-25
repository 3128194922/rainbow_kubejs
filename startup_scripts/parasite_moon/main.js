// MoonJS 注册寄生月专属纹理；满月选择和陨石雨由 server_scripts/parasite_moon/main.js 驱动。
MoonJS.registerPhase('parasite_moon', {
    texture: 'rainbow:textures/moon/blood_bugs.png',
    vanillaPhase: 0
});

// KubeJS 6 的 ForgeEvents 仅在 startup_scripts 可用；实时读取月相，满月结束仍由服务端血月脚本收尾。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerSleepInBedEvent', event => {
    try {
        let player = event.getEntity();
        let state = player == null ? null : MoonJS.getState(player.level);
        // 自然寄生月与 /parasitemoon 手动寄生月都禁止睡觉。
        let eventId = state == null ? '' : String(state.get('eventId'));
        if (eventId == 'rainbow:parasite_moon' || eventId == 'rainbow:parasite_moon_manual') {
            event.setResult(BedSleepingProblem.NOT_POSSIBLE_NOW);
            player.tell('寄生月下无法入睡');
        }
    } catch (e) { console.log('[寄生月] 阻止睡眠失败: ' + e); }
});
