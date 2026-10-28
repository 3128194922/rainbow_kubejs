// priority: 0
// ==========================================
// 🏹 弓箭蓄力进度显示脚本
// ==========================================

// server_scripts/bow_progress.js
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    if (!everyTicks(player, 2)) return; // 每2tick检查一次，减少网络压力

    // 性能埋点：包裹在节流早退判断之内，早退 tick 不计入统计（system/perf/probe.js 提供）
    global.perfTime('bow-playerTick', () => {
    if (player.isUsingItem()) {
        let stack = player.getUseItem();
        if (stack && stack.id === "minecraft:bow") {
            let usedTicks = player.getTicksUsingItem();
            // 最大20tick为满拉弓 (1秒)
            let progress = Math.min(100, Math.floor((usedTicks / 20) * 100));

            // 检测满弓并执行指令（只触发一次，播放音效）
            if (progress >= 100 && !player.persistentData.bowFullyDrawn) {
                player.persistentData.bowFullyDrawn = true;
                player.server.runCommandSilent(`/playsound minecraft:ui.button.click player ${player.getDisplayName().getString()} ${player.x} ${player.y} ${player.z}`)
            }

            // 性能优化：仅当进度值变化时才发包（拉弓中每 2 tick 递增 10，行为不变；
            // 满弓保持在 100 期间不再重复发送），bowProgressSent 记录上次发送值
            if (player.persistentData.bowProgressSent != progress) {
                player.persistentData.bowProgressSent = progress;
                player.sendData("bow_progress", { progress: progress });
            }
        }
    } else {
        // 性能优化：空闲时不再每 2 tick 持续发包 + 写 NBT，
        // 仅在刚结束拉弓（上次发送过非零进度）时补发一次 0 并重置标记
        if (player.persistentData.bowProgressSent != 0) {
            player.sendData("bow_progress", { progress: 0 });
            player.persistentData.bowProgressSent = 0;
        }
        if (player.persistentData.bowFullyDrawn) {
            player.persistentData.bowFullyDrawn = false;
        }
    }
    }); // global.perfTime 包裹结束
});
// server_scripts/bow_progress.js
/*PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    if (!everyTicks(player, 2)) return; // 每2tick发送一次，减少网络压力

    if (player.isUsingItem()) {
        let stack = player.getUseItem();
        if (!stack) return;

        let id = stack.id;
        let usedTicks = player.getTicksUsingItem();
        let progress = 0;
        let maxTicks = 20; // 默认弓的最大蓄力时间

        if (id === "minecraft:bow") {
            // 弓逻辑
            maxTicks = 20; // 1s 拉满
            progress = Math.min(100, Math.floor((usedTicks / maxTicks) * 100));

            if (progress >= 100 && !player.persistentData.bowFullyDrawn) {
                player.persistentData.bowFullyDrawn = true;
                player.server.runCommandSilent(
                    `/playsound minecraft:ui.button.click player ${player.username} ${player.x} ${player.y} ${player.z}`
                );
            }

            player.sendData("bow_progress", { progress: progress });
        }

        if (id === "minecraft:crossbow") {
            // 弩逻辑
            maxTicks = 25; // 弩默认上弹时间 1.25s，可根据附魔不同调整
            progress = Math.min(100, Math.floor((usedTicks / maxTicks) * 100));

            if (progress >= 100 && !player.persistentData.crossbowLoaded) {
                player.persistentData.crossbowLoaded = true;
                player.server.runCommandSilent(
                    `/playsound minecraft:ui.button.click player ${player.username} ${player.x} ${player.y} ${player.z}`
                );
            }

            player.sendData("bow_progress", { progress: progress });
        }
    } else {
        // 不在拉弓/上弹 → 清零 & 重置标记
        player.sendData("bow_progress", { progress: 0 });
        player.persistentData.bowFullyDrawn = false;
        player.persistentData.crossbowLoaded = false;
    }
});*/
