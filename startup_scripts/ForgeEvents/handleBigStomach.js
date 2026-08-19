// 大胃袋（big_stomach）饰品 - 受伤时消耗饱和度抵消伤害
// 需先完成当期进食任务（bs_done），否则大胃袋失效
// 注册：[startup_scripts/Registry/Registry_curios.js] rainbow:big_stomach
// 任务轮询：[server_scripts/big_stomach/PlayerTick.js]，任务完成检测：[server_scripts/big_stomach/ItemEvents.js]
function handleBigStomach(event, victim) {
    if (victim == null || !victim.isPlayer()) return;
    if (!hasCurios(victim, "rainbow:big_stomach")) return;

    try {
        let stomachStack = getCuriosStackOnPlayer(victim, "rainbow:big_stomach");
        let taskDone = false;
        if (stomachStack != null && stomachStack.nbt != null && stomachStack.nbt.contains("bs_done")) {
            taskDone = stomachStack.nbt.getBoolean("bs_done");
        }
        // 任务已完成且当前有饱和度时，消耗等量饱和度抵消本次伤害
        if (taskDone && victim.getFoodData().getSaturationLevel() > 0) {
            victim.getFoodData().setSaturation(
                Math.max(victim.getFoodData().getSaturationLevel() - event.getAmount(), 0)
            );
            event.setCanceled(true);
        }
    } catch (e) {
        console.log("大胃袋抵消伤害报错:");
        console.log(e);
    }
}