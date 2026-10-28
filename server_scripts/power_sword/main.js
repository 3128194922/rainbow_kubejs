// priority: 1000
// ==========================================
// 先驱者动力剑：单物品分解立场
// ==========================================

const POWER_SWORD_ID = "rainbow:power_sword";
const POWER_SWORD_FIELD_TAG = "DecompositionField";
const POWER_SWORD_FIELD_UNTIL_TAG = "DecompositionFieldUntil";
const POWER_SWORD_POWER_TAG = "Power";
const POWER_SWORD_FIELD_DURATION_TICKS = 200;
const POWER_SWORD_RECHARGE_COOLDOWN_TICKS = 40 * 20;
const POWER_SWORD_ANIMATION_CONTROLLER = "power_sword_controller";
const POWER_SWORD_ANIMATION_OPEN = "decomposition_field_open";
const POWER_SWORD_ANIMATION_LOOP = "decomposition_field_loop";
const POWER_SWORD_ANIMATION_CLOSE = "decomposition_field_close";

// 通过 GeckoLib 的同步接口把立场动画发送给持有该物品的客户端。
function triggerPowerSwordAnimation(player, stack, animationName) {
    try {
        if (player == null || stack == null || animationName == null) return;
        if (stack.id !== POWER_SWORD_ID || player.level == null || player.level.isClientSide()) return;
        let item = Item.of(POWER_SWORD_ID).item;
        if (item == null || GeoItem == null) return;
        let instanceId = GeoItem.getOrAssignId(stack, player.level);
        item.triggerAnim(player, instanceId, POWER_SWORD_ANIMATION_CONTROLLER, animationName);
    }
    catch (e) {
        console.log("先驱者动力剑 GeckoJS 动画触发出错：");
        console.log(e);
    }
}

// 攻击事件位于 startup_scripts，需要通过 global 跨脚本目录调用收场动画。
global.triggerPowerSwordAnimation = triggerPowerSwordAnimation;

// 结束分解立场并清除本次能量，保持单物品的普通状态。
function closePowerSwordField(player, stack) {
    try {
        if (player == null || stack == null) return;
        let tag = stack.getNbt();
        if (tag == null) return;
        if (tag.getBoolean(POWER_SWORD_FIELD_TAG)) {
            triggerPowerSwordAnimation(player, stack, POWER_SWORD_ANIMATION_CLOSE);
        }
        tag.remove(POWER_SWORD_FIELD_TAG);
        tag.remove(POWER_SWORD_FIELD_UNTIL_TAG);
        tag.remove(POWER_SWORD_POWER_TAG);
        player.getInventory().setChanged();
        player.cooldowns.addCooldown(POWER_SWORD_ID, POWER_SWORD_RECHARGE_COOLDOWN_TICKS);
    }
    catch (e) {
        console.log("先驱者动力剑结束分解立场出错：");
        console.log(e);
    }
}

// 右键开启分解立场；状态截止时间使用服务端游戏时间，避免跨维度/重载时漂移。
ItemEvents.rightClicked(POWER_SWORD_ID, event => {
    try {
        let player = event.player;
        let item = event.item;
        let level = event.level;
        let server = event.server;
        if (player == null || item == null || level == null || level.isClientSide()) return;
        if (player.cooldowns.isOnCooldown(POWER_SWORD_ID)) return;

        let tag = item.getOrCreateTag();
        let now = level.getTime();
        if (tag.getBoolean(POWER_SWORD_FIELD_TAG)
            && tag.getLong(POWER_SWORD_FIELD_UNTIL_TAG) > now) return;

        tag.putBoolean(POWER_SWORD_FIELD_TAG, true);
        tag.putLong(POWER_SWORD_FIELD_UNTIL_TAG, now + POWER_SWORD_FIELD_DURATION_TICKS);
        tag.remove(POWER_SWORD_POWER_TAG);
        player.getInventory().setChanged();
        server.runCommandSilent(`/playsound domesticationinnovation:chain_lightning voice @p ${player.x} ${player.y} ${player.z}`);
        triggerPowerSwordAnimation(player, item, POWER_SWORD_ANIMATION_OPEN);

        // 开场动画 0.35 秒结束后切入循环动画；期间若立场已结束则不再发送循环触发。
        server.scheduleInTicks(7, () => {
            try {
                if (player == null || player.level == null || player.level.isClientSide()) return;
                let hands = [player.getItemInHand("main_hand"), player.getItemInHand("off_hand")];
                hands.forEach(stack => {
                    if (stack == null || stack.id !== POWER_SWORD_ID) return;
                    let activeTag = stack.getNbt();
                    if (activeTag != null && activeTag.getBoolean(POWER_SWORD_FIELD_TAG)
                        && activeTag.getLong(POWER_SWORD_FIELD_UNTIL_TAG) > player.level.getTime()) {
                        triggerPowerSwordAnimation(player, stack, POWER_SWORD_ANIMATION_LOOP);
                    }
                });
            }
            catch (e) {
                console.log("先驱者动力剑 GeckoJS 循环动画触发出错：");
                console.log(e);
            }
        });
    }
    catch (e) {
        console.log("先驱者动力剑右键开启分解立场出错：");
        console.log(e);
    }
});

// 每 5 tick 清理主手/副手中已经到期的立场，保证模型、属性和攻击状态一致（0.25 秒粒度足够）。
PlayerEvents.tick(event => {
    try {
        let player = event.player;
        if (player == null || player.level == null || player.level.isClientSide()) return;
        // 性能优化：5 tick 节流，避免每 tick 读双手物品 NBT
        if (!everyTicks(player, 5)) return;
        // 性能埋点：包裹在节流早退判断之内，早退 tick 不计入统计（system/perf/probe.js 提供）
        global.perfTime('power_sword-playerTick', () => {
        let now = player.level.getTime();
        let hands = [player.getItemInHand("main_hand"), player.getItemInHand("off_hand")];
        hands.forEach(stack => {
            if (stack == null || stack.id !== POWER_SWORD_ID) return;
            let tag = stack.getNbt();
            if (tag == null || !tag.getBoolean(POWER_SWORD_FIELD_TAG)) return;
            if (tag.getLong(POWER_SWORD_FIELD_UNTIL_TAG) <= now) {
                closePowerSwordField(player, stack);
            }
        });
        }); // global.perfTime 包裹结束
    }
    catch (e) {
        console.log("先驱者动力剑定时结束分解立场出错：");
        console.log(e);
    }
});
