ClientEvents.tick(event => {
    const key = global.regKeyCharm;
    if (key.isDown())
        {
            Client.player.sendData("primaryCharm",{})
        }
})