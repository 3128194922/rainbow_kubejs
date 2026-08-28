// priority: 1
// ==========================================
// 🍖 贪咀护符（进食任务机制）—— 进食完成检测与进化
// 任务源数据在 player.persistentData（PlayerTick.js 维护），多个贪咀护符共享同一任务
// 玩家吃到当期想吃的食物时：连击数 +1，置 cc_done=true 完成信号
// PlayerTick 检测到 cc_done 后 1 秒内立刻发布下一个任务（重置轮换时间）
// 连续完成 10 个任务 → 佩戴的贪咀护符原地进化为 rainbow:big_stomach（玩家任务数据清零）
// ⚠️ 大胃袋已无进食任务机制，本机制为贪咀护符专属
// ==========================================

ItemEvents.foodEaten(event => {
    var player = event.player;
    var item = event.item;
    if (player == null || item == null) return;

    // 只有佩戴贪咀护符的玩家才会完成任务
    if (getCuriosItem(player, "rainbow:cruncher_charm") == null) return;

    var data = player.persistentData;
    if (data == null || !data.contains("cc_epoch")) return;

    // 想吃的食物必须精确匹配（玩家级任务，所有贪咀护符同一目标）
    if (item.id != data.getString("cc_food")) return;

    // 本周期已完成过则不再重复计数（等待 PlayerTick 即时刷新）
    if (data.getBoolean("cc_done")) return;

    try {
        // 完成任务：连击 +1，置完成信号（PlayerTick 收到信号后 1 秒内发布下一任务）
        var streak = data.getInt("cc_streak") + 1;
        data.putInt("cc_streak", streak);
        data.putBoolean("cc_done", true);

        // 达到进化门槛 → 贪咀护符原地进化为大胃袋
        if (streak >= CRUNCHER_EVOLVE_STREAK) {
            evolveCruncherToBigStomach(player, data, item);
            return;
        }

        var foodName = item.getDisplayName().getString();
        player.tell("§a[贪咀护符] 满足！吃到 §6" + foodName + "§a，任务进度 §6" + streak + "/" + CRUNCHER_EVOLVE_STREAK + "§a");
        console.log(`[贪咀护符] ${player.getDisplayName().getString()} 完成进食任务，连击：${streak}`);
    } catch (e) {
        console.log("[贪咀护符] 进食完成检测出错：" + e);
    }
})

// 贪咀护符进化：把饰品栏里的贪咀护符替换为大胃袋，并重置玩家任务数据
function evolveCruncherToBigStomach(player, data, foodItem) {
    var curios = getCuriosInventorySafe(player);
    if (curios == null) {
        // 找不到饰品栏（异常情况）：保留满连击进度，等待下次进食重试
        data.putInt("cc_streak", CRUNCHER_EVOLVE_STREAK);
        return;
    }

    var evolved = false;
    try {
        for (var handler of curios.getCurios().values()) {
            var stacks = handler.getStacks();
            var size = stacks.getSlots();
            for (var i = 0; i < size; i++) {
                var stack = stacks.getStackInSlot(i);
                if (stack == null || stack.isEmpty()) continue;
                if (stack.getId().toString() != "rainbow:cruncher_charm") continue;
                stacks.setStackInSlot(i, Item.of('rainbow:big_stomach'));
                evolved = true;
            }
        }
    } catch (e) {
        console.log("[贪咀护符] 进化替换饰品出错：" + e);
    }

    if (!evolved) {
        // 未找到贪咀护符（异常情况）：保留满连击进度，等待下次进食重试
        data.putInt("cc_streak", CRUNCHER_EVOLVE_STREAK);
        return;
    }

    // 进化成功 → 重置玩家任务数据
    // 第一步：直接赋值清零连击与完成状态（可靠模式，防止新的贪咀护符不做任务直接进化）
    data.putInt("cc_streak", 0);
    data.putBoolean("cc_done", false);
    // 第二步：尝试清掉任务键，使下次佩戴护符时初始化全新任务
    try {
        data.remove("cc_epoch");
        data.remove("cc_food");
    } catch (e) {
        // 即使清键失败，连击已清零，任务机器照常轮换，不影响
        console.log("[贪咀护符] 进化后清理任务键出错（可忽略）：" + e);
    }

    var foodName = foodItem != null ? foodItem.getDisplayName().getString() : "";
    player.tell("§d[贪咀护符] 吃下 §6" + foodName + "§d，连续完成 §6" + CRUNCHER_EVOLVE_STREAK + "§d 个进食任务，§l进化为大胃袋§r§d！");
    try {
        player.runCommandSilent("playsound minecraft:entity.player.levelup master @s");
    } catch (e2) {
        console.log("[贪咀护符] 进化音效播放出错：" + e2);
    }
    console.log(`[贪咀护符] ${player.getDisplayName().getString()} 连续完成${CRUNCHER_EVOLVE_STREAK}个进食任务，进化为大胃袋`);
}
