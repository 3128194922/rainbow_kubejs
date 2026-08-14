// priority: 1
// ==========================================
// 🍖 大胃袋（想吃就吃机制）—— 任务轮询与同步（PlayerTick）
// 📌 任务源数据存于 player.persistentData（键：bs_epoch / bs_food / bs_done / bs_streak）：
//   1. PlayerTick 每 1 秒推进，与是否佩戴饰品无关 → 卸下/离线天数照常轮换
//   2. 多个大胃袋共享同一份任务（玩家级唯一数据，同一时间只想吃同一种食物）
//   3. 佩戴时把任务同步回所有大胃袋饰品 NBT，供 tooltip / 属性 / 受伤抵消读取
// ==========================================

const BIG_STOMACH_CYCLE = 48000; // 2个游戏日的tick数

// 大胃袋想吃食物黑名单：随机到这些 id 时自动重选（直到不是黑名单）
const BIG_STOMACH_BLACKLIST = [
    /*"minecraft:rotten_flesh",
    "minecraft:spider_eye",
    "minecraft:poisonous_potato",
    "minecraft:pufferfish"*/
];

// 随机一个想吃食物（来自 global.foodlist，server端CONST.js初始化）
// 命中黑名单时自动重选，直到选出非黑名单食物（含最大尝试次数保护）
function pickBigStomachFood() {
    if (global.foodlist == null || global.foodlist.length == 0) return null;
    let maxTries = global.foodlist.length;
    for (let i = 0; i < maxTries; i++) {
        let food = Item.of(global.foodlist[Math.floor(randomInRange(0, global.foodlist.length - 1))]);
        if (food == null || food.isEmpty()) continue;
        let id = food.getId().toString();
        if (BIG_STOMACH_BLACKLIST.indexOf(id) !== -1) continue; // 命中黑名单，重选
        return id;
    }
    // 全部命中黑名单的兜底：返回列表第一个非黑名单食物
    for (let i = 0; i < global.foodlist.length; i++) {
        let food = Item.of(global.foodlist[i]);
        if (food == null || food.isEmpty()) continue;
        let id = food.getId().toString();
        if (BIG_STOMACH_BLACKLIST.indexOf(id) !== -1) continue;
        return id;
    }
    return null;
}

// 通知玩家想吃食物（显示名 + ID）
function notifyBigStomachTask(player, foodId) {
    if (foodId == null || foodId == "") return;
    let foodName = Item.of(foodId).getDisplayName().getString();
    player.tell("§e[大胃袋] 我想吃：§6" + foodName + "§e（§7" + foodId + "§e）");
}

// 把 persistentData 中的任务同步到玩家佩戴的所有大胃袋饰品 NBT（含距下次换食的剩余时间）
function syncBigStomachTaskToStacks(player, data, now) {
    let curios = getCuriosInventorySafe(player);
    if (curios == null) return;
    try {
        let remaining = Math.max(0, BIG_STOMACH_CYCLE - (now - data.getLong("bs_epoch")));
        for (let handler of curios.getCurios().values()) {
            let stacks = handler.getStacks();
            let size = stacks.getSlots();
            for (let i = 0; i < size; i++) {
                let stack = stacks.getStackInSlot(i);
                if (stack == null || stack.isEmpty()) continue;
                if (stack.getId().toString() != "rainbow:big_stomach") continue;
                if (stack.nbt == null) {
                    stack.nbt = {};
                }
                stack.nbt.putLong("bs_epoch", data.getLong("bs_epoch"));
                stack.nbt.putString("bs_food", data.getString("bs_food"));
                stack.nbt.putBoolean("bs_done", data.getBoolean("bs_done"));
                stack.nbt.putInt("bs_streak", data.getInt("bs_streak"));
                stack.nbt.putInt("bs_remaining", remaining);
            }
        }
    } catch (e) {
        console.log("[大胃袋] 同步饰品NBT出错：" + e);
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

        // ---- 从未初始化但已佩戴大胃袋 → 发布初始任务 ----
        if (!data.contains("bs_epoch")) {
            if (getCuriosItem(player, "rainbow:big_stomach") == null) return;
            let foodId = pickBigStomachFood();
            if (foodId == null) return; // 食物列表尚未就绪，下个检查周期重试
            data.putLong("bs_epoch", now);
            data.putString("bs_food", foodId);
            data.putBoolean("bs_done", false);
            if (!data.contains("bs_streak")) {
                data.putInt("bs_streak", 0);
            }
            notifyBigStomachTask(player, foodId);
            syncBigStomachTaskToStacks(player, data, now);
            console.log(`[大胃袋] ${player.getDisplayName().getString()} 首次佩戴，发布初始任务：${foodId}`);
            return;
        }

        // ---- 周期推进：与是否佩戴无关，卸下饰品也照常轮换 ----
        let epoch = data.getLong("bs_epoch");
        if (now - epoch >= BIG_STOMACH_CYCLE) {
            // 处理所有过期周期：任一周期未完成 → 连击清零
            let failed = false;
            while (now - epoch >= BIG_STOMACH_CYCLE) {
                let done = data.getBoolean("bs_done");
                if (!done) {
                    failed = true;
                }
                data.putBoolean("bs_done", false);
                epoch += BIG_STOMACH_CYCLE;
            }

            let streak = data.getInt("bs_streak");
            if (failed) {
                streak = 0;
                data.putInt("bs_streak", 0);
            }
            data.putLong("bs_epoch", epoch);
            let foodId = pickBigStomachFood();
            data.putString("bs_food", foodId != null ? foodId : "");

            // 仅佩戴时提示结果与新任务（卸下时不打扰）
            let wearing = getCuriosItem(player, "rainbow:big_stomach") != null;
            if (wearing) {
                if (failed) {
                    player.tell("§c[大胃袋] 你没有吃下想吃的东西，大胃袋失效了！连击已清零。");
                } else if (streak > 0) {
                    player.tell("§a[大胃袋] 上一轮进食任务完成！连击保持 §6x" + streak);
                }
                notifyBigStomachTask(player, foodId);
            }
            console.log(`[大胃袋] ${player.getDisplayName().getString()} 新周期任务，食物：${foodId}，连击：${streak}`);
        }

        // 佩戴时把任务同步到所有大胃袋饰品 NBT
        if (getCuriosItem(player, "rainbow:big_stomach") != null) {
            syncBigStomachTaskToStacks(player, data, now);
        }
    } catch (e) {
        console.log("[大胃袋] 任务轮询出错：" + e);
    }
})