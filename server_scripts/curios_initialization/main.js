// priority: 0
PlayerEvents.loggedIn(event => {
    if (event.level.isClientSide()) return;
    let player = event.player;
    let server = event.server;
    
    // 饰品初始化：移除旧饰品
    let Curios = ["body", "belt", "bracelet", "curio", "hands", "necklace", "ring", "feet", "hands","super_curio"]

    Curios.forEach(curio=>{
        server.runCommandSilent(`/curios remove ${curio} ${player.getDisplayName().getString()} 10`);
    })
})