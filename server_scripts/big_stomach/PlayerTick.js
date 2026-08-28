// priority: 1
// ==========================================
// 🍖 贪咀护符（进食任务机制）—— 任务轮询与同步（PlayerTick）
// 📌 任务源数据存于 player.persistentData（键：cc_epoch / cc_food / cc_done / cc_streak）：
//   1. PlayerTick 每 1 秒推进；吃到目标食物后（cc_done=true）立刻发布下一任务并重置轮换时间
//   2. 多个贪咀护符共享同一份任务（玩家级唯一数据，同一时间只想吃同一种食物）
//   3. 佩戴时把任务同步回所有贪咀护符饰品 NBT，供 tooltip 读取
//   4. 连续完成 10 个任务 → 贪咀护符进化为大胃袋（ItemEvents.js 处理）
// ⚠️ 大胃袋已无进食任务机制（三项属性与受伤抵消常驻生效），本机制为贪咀护符专属
// ==========================================

const CRUNCHER_CYCLE = 48000; // 2个游戏日的tick数
const CRUNCHER_EVOLVE_STREAK = 10; // 连续完成该数量任务后进化为大胃袋

// 贪咀护符想吃食物黑名单：随机到这些 id 时自动重选（直到不是黑名单）
const CRUNCHER_BLACKLIST = [
    /*"minecraft:rotten_flesh",
    "minecraft:spider_eye",
    "minecraft:poisonous_potato",
    "minecraft:pufferfish"*/
];

// 随机一个想吃食物（来自 global.foodlist，server端CONST.js初始化）
// 命中黑名单时自动重选，直到选出非黑名单食物（含最大尝试次数保护）
function pickCruncherFood() {
    if (global.foodlist == null || global.foodlist.length == 0) return null;
    let maxTries = global.foodlist.length;
    for (let i = 0; i < maxTries; i++) {
        let food = Item.of(global.foodlist[Math.floor(randomInRange(0, global.foodlist.length - 1))]);
        if (food == null || food.isEmpty()) continue;
        let id = food.getId().toString();
        if (CRUNCHER_BLACKLIST.indexOf(id) !== -1) continue; // 命中黑名单，重选
        return id;
    }
    // 全部命中黑名单的兜底：返回列表第一个非黑名单食物
    for (let i = 0; i < global.foodlist.length; i++) {
        let food = Item.of(global.foodlist[i]);
        if (food == null || food.isEmpty()) continue;
        let id = food.getId().toString();
        if (CRUNCHER_BLACKLIST.indexOf(id) !== -1) continue;
        return id;
    }
    return null;
}

// 通知玩家想吃食物（显示名 + ID）
function notifyCruncherTask(player, foodId) {
    if (foodId == null || foodId == "") return;
    let foodName = Item.of(foodId).getDisplayName().getString();
    player.tell("§e[贪咀护符] 我想吃：§6" + foodName + "§e（§7" + foodId + "§e）");
}

// 把 persistentData 中的任务同步到玩家佩戴的所有贪咀护符饰品 NBT（含距下次换食的剩余时间）
function syncCruncherTaskToStacks(player, data) {
    let curios = getCuriosInventorySafe(player);
    if (curios == null) return;
    try {
        let now = player.level.dayTime();
        let remaining = Math.max(0, CRUNCHER_CYCLE - (now - data.getLong("cc_epoch")));
        for (let handler of curios.getCurios().values()) {
            let stacks = handler.getStacks();
            let size = stacks.getSlots();
            for (let i = 0; i < size; i++) {
                let stack = stacks.getStackInSlot(i);
                if (stack == null || stack.isEmpty()) continue;
                if (stack.getId().toString() != "rainbow:cruncher_charm") continue;
                if (stack.nbt == null) {
                    stack.nbt = {};
                }
                stack.nbt.putLong("cc_epoch", data.getLong("cc_epoch"));
                stack.nbt.putString("cc_food", data.getString("cc_food"));
                stack.nbt.putBoolean("cc_done", data.getBoolean("cc_done"));
                stack.nbt.putInt("cc_streak", data.getInt("cc_streak"));
                stack.nbt.putInt("cc_remaining", remaining);
            }
        }
    } catch (e) {
        console.log("[贪咀护符] 同步饰品NBT出错：" + e);
    }
}

PlayerEvents.tick(event => {
    let player = event.player;
    if (player == null) return;
    if (player.level == null || player.level.isClientSide()) return;

    try {
        // 每隔 20 tick（1秒）轮询一次
        if (player.age % 20 != 0) return;

        let data = player.persistentData;
        let now = player.level.dayTime();

        // ---- 从未初始化但已佩戴贪咀护符 → 发布初始任务 ----
        if (!data.contains("cc_epoch")) {
            if (getCuriosItem(player, "rainbow:cruncher_charm") == null) return;
            let foodId = pickCruncherFood();
            if (foodId == null) return; // 食物列表尚未就绪，下个检查周期重试
            data.putLong("cc_epoch", now);
            data.putString("cc_food", foodId);
            data.putBoolean("cc_done", false);
            if (!data.contains("cc_streak")) {
                data.putInt("cc_streak", 0);
            }
            notifyCruncherTask(player, foodId);
            syncCruncherTaskToStacks(player, data);
            console.log(`[贪咀护符] ${player.getDisplayName().getString()} 首次佩戴，发布初始任务：${foodId}`);
            return;
        }

        // ---- 任务完成信号（cc_done=true）→ 立刻发布下一个任务，重置轮换时间 ----
        // 完成信号由 ItemEvents.js foodEaten 置位；佩戴中每秒轮询到此信号后即时刷新
        // （刷新逻辑放在 tick 上下文执行，避开 foodEaten 事件上下文中的不稳定调用）
        if (data.getBoolean("cc_done")) {
            if (getCuriosItem(player, "rainbow:cruncher_charm") != null) {
                var doneStreak = data.getInt("cc_streak");
                var nextFoodId = pickCruncherFood();
                data.putLong("cc_epoch", now);
                data.putString("cc_food", nextFoodId != null ? nextFoodId : "");
                data.putBoolean("cc_done", false);
                notifyCruncherTask(player, nextFoodId);
                syncCruncherTaskToStacks(player, data);
                console.log(`[贪咀护符] ${player.getDisplayName().getString()} 任务完成，即时发布下一任务，连击：${doneStreak}，新食物：${nextFoodId}`);
            }
        }

        // ---- 周期推进：与是否佩戴无关，卸下饰品也照常轮换 ----
        let epoch = data.getLong("cc_epoch");
        if (now - epoch >= CRUNCHER_CYCLE) {
            // 处理所有过期周期：任一周期未完成 → 连击清零
            let failed = false;
            while (now - epoch >= CRUNCHER_CYCLE) {
                let done = data.getBoolean("cc_done");
                if (!done) {
                    failed = true;
                }
                data.putBoolean("cc_done", false);
                epoch += CRUNCHER_CYCLE;
            }

            let streak = data.getInt("cc_streak");
            if (failed) {
                streak = 0;
                data.putInt("cc_streak", 0);
            }
            data.putLong("cc_epoch", epoch);
            let foodId = pickCruncherFood();
            data.putString("cc_food", foodId != null ? foodId : "");

            // 仅佩戴时提示结果与新任务（卸下时不打扰）
            let wearing = getCuriosItem(player, "rainbow:cruncher_charm") != null;
            if (wearing) {
                if (failed) {
                    player.tell("§c[贪咀护符] 你没有吃下想吃的东西，连击已清零！");
                } else if (streak > 0) {
                    player.tell("§a[贪咀护符] 上一轮进食任务完成！连击保持 §6x" + streak + "§a（§7" + streak + "/" + CRUNCHER_EVOLVE_STREAK + "§a）");
                }
                notifyCruncherTask(player, foodId);
            }
            console.log(`[贪咀护符] ${player.getDisplayName().getString()} 新周期任务，食物：${foodId}，连击：${streak}`);
        }

        // 佩戴时把任务同步到所有贪咀护符饰品 NBT
        if (getCuriosItem(player, "rainbow:cruncher_charm") != null) {
            syncCruncherTaskToStacks(player, data);
        }
    } catch (e) {
        console.log("[贪咀护符] 任务轮询出错：" + e);
    }
})
