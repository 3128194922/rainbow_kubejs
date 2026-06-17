// priority: 500
// ==========================================
// 🌙 月光捕捉机制：玩家看向月亮时获得迷你月亮
// ==========================================

function PlayerLookAtMoon(player) {
    let { yaw, pitch, level } = player
    let renderDistance = 10

    if (!level.overworld || level.isDay() || player.rayTrace(16 * renderDistance + 8).block != null) {
        return false
    }

    let tempPitch = (((level.getSunAngle(0) - 1.62) * -90) / 1.57) - 2.825
    let add = level.dayTime() > 18000 ? Math.abs(tempPitch * 2 + 180) : 0
    let moonPitch = tempPitch + add

    if (Math.abs(moonPitch - pitch) > 2.825) {
        return false
    }

    let temp = (Math.abs(18000 - level.getDayTime())) / 5000;
    let step = temp ** 2 - 27.49 * temp + 117.54;
    let absYaw = Math.abs(yaw)

    if ((level.getDayTime() < 18000 && yaw > 0) || (level.getDayTime() > 18000 && yaw < 0)) {
        return false
    }

    if (!(absYaw > 85 - step && absYaw < 95 + step)) {
        return false
    }

    player.tell('你捕获到了月亮')
    return true
} 

// --- 月光水晶：看月亮获得物品 ---
ItemEvents.rightClicked('minecraft:stick',event => {
    let { player, item, level } = event;
    if (level.isClientSide()) return;

    if (PlayerLookAtMoon(player)) {
        player.give("rainbow:mini_moon");
        item.shrink(1);
    }
});

ItemEvents.rightClicked('rainbow:mini_moon',event => {
    let { player, item, level } = event;
    if (level.isClientSide()) return;

    level.server.runCommandSilent('/clanginghowl meteor_shower start')
    player.tell('你召唤了流星雨！')
    item.shrink(1);
});
