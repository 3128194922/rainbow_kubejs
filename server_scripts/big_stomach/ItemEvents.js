// priority: 1
// ==========================================
// 🍖 大胃袋（想吃就吃机制）—— 进食完成检测
// 任务源数据在 player.persistentData（PlayerTick.js 维护），多个大胃袋共享同一任务
// 玩家吃到当期想吃的食物时：完成任务、连击数 +1，并同步回佩戴的大胃袋饰品 NBT
// ==========================================

ItemEvents.foodEaten(event => {
    let { player, item } = event;
    if (player == null || item == null) return;

    // 只有佩戴大胃袋的玩家才会完成任务
    if (getCuriosItem(player, "rainbow:big_stomach") == null) return;

    let data = player.persistentData;
    if (data == null || !data.contains("bs_epoch")) return;

    // 想吃的食物必须精确匹配（玩家级任务，所有大胃袋同一目标）
    if (item.id != data.getString("bs_food")) return;

    // 本周期已完成过则不再重复计数
    if (data.getBoolean("bs_done")) return;

    try {
        // 完成任务：标记完成，连击 +1
        data.putBoolean("bs_done", true);
        let streak = data.getInt("bs_streak") + 1;
        data.putInt("bs_streak", streak);

        // 同步回所有佩戴的大胃袋饰品 NBT（tooltip 显示最新状态）
        syncBigStomachTaskToStacks(player, data);

        let kbr = Math.min(0.1 * streak, 1.0) * 100;
        let foodName = item.getDisplayName().getString();
        player.tell("§a[大胃袋] 满足！吃到 §6" + foodName + "§a，连击 §6x" + streak + "§a，击退抗性 +" + Math.round(kbr) + "%");
        console.log(`[大胃袋] ${player.getDisplayName().getString()} 完成进食任务，连击：${streak}`);
    } catch (e) {
        console.log("[大胃袋] 进食完成检测出错：" + e);
    }
})