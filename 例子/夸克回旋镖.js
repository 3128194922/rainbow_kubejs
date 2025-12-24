const { $Pickarang } = require("packages/org/violetmoon/quark/content/tools/entity/rang/$Pickarang")
const { $ServerPlayer } = require("packages/net/minecraft/server/level/$ServerPlayer")
const { $PickarangModule } = require("packages/org/violetmoon/quark/content/tools/module/$PickarangModule")
ItemEvents.rightClicked(event => {
    const {
        hand,
        player,
        player: { inventory , x , y , z , eyeHeight},
        player: { inventory : { containerSize } },
        level,
        server
    } = event
    if (hand != "MAIN_HAND") return
    if (level.isClientSide()) return
    let slot = 0
    function throwPickarang() {
        if (slot >= containerSize) return
        /**@type {$ItemStack} */
        let itemStack = inventory.getItem(slot)
        //if (itemStack.hasTag('minecraft:axes'))
        if (1)
        {
            let pickarang = new $Pickarang("quark:pickarang", level, player)
            let offsetX = (Math.random() - 0.5) * 5
            let offsetY = Math.random() * 0.5
            let offsetZ = (Math.random() - 0.5) * 5
            pickarang.setPos(x + offsetX, y + eyeHeight + offsetY, z + offsetZ)
            pickarang.setThrowData(slot, itemStack)
            pickarang.setOwner(player)
            let yaw = player.yRotO + (Math.random() - 0.5) * 20
            let pitch = player.xRotO + (Math.random() - 0.5) * 10
            pickarang.shoot(player, pitch, yaw, 0.0, 2.5, 0.0)
            level.addFreshEntity(pickarang)
            inventory.setStackInSlot(slot, $ItemStack.EMPTY)
            if (player instanceof $ServerPlayer) {
                $PickarangModule.throwPickarangTrigger.trigger(player)
            }
        }
        slot++
        server.scheduleInTicks(6, throwPickarang)
    }
    throwPickarang()
})