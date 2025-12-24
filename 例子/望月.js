const { $Player } = require("packages/net/minecraft/world/entity/player/$Player")
/**
 * 
 * @param {$Player} player 
 * @returns {boolean}
 */
function PlayerLookAtMoon(player) {
    const { yaw, pitch, level } = player
    const renderDistance = Client.options.renderDistance().get()

    //check
    if (!level.overworld || level.isDay() || player.rayTrace(16 * renderDistance + 8).block != null) {
        player.tell(false)
        return false
    }

    //Moon Pitch
    const tempPitch = (((level.getSunAngle(0) - 1.62) * -90) / 1.57) - 2.825
    const add = level.dayTime() > 18000 ? Math.abs(tempPitch * 2 + 180) : 0
    const moonPitch = tempPitch + add

    if (Math.abs(moonPitch - pitch) > 2.825) {
        player.tell(false)
        return false
    }
    //MoonYaw is the formula provided by @Rad
    //There is still some degree of error.
    //If anyone can provide a more accurate formula, I would be very grateful.
    const temp = (Math.abs(18000 - level.getDayTime())) / 5000;
    const step = temp ** 2 - 27.49 * temp + 117.54;
    const absYaw = Math.abs(yaw)

    if ((level.getDayTime() < 18000 && yaw > 0) || (level.getDayTime() > 18000 && yaw < 0)) {
        player.tell(false)
        return false
    }

    if (!(absYaw > 85 - step && absYaw < 95 + step)) {
        player.tell(false)
        return false
    }

    player.tell('Look Moon')
    return true
}