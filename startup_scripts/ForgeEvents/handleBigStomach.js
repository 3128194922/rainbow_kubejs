// 大胃袋（big_stomach）饰品 - 受伤时消耗饱和度抵消伤害（常驻生效，无任务门槛）
// 注册：[startup_scripts/Registry/Registry_curios.js] rainbow:big_stomach
// 进化来源：贪咀护符连续完成 10 个进食任务（server_scripts/big_stomach/）
function handleBigStomach(event, victim) {
    if (victim == null || !victim.isPlayer()) return;
    if (!hasCurios(victim, "rainbow:big_stomach")) return;

    try {
        // 当前有饱和度时，消耗等量饱和度抵消本次伤害
        if (victim.getFoodData().getSaturationLevel() > 0) {
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