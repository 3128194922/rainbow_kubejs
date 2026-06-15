// priority: 0
PlayerEvents.loggedIn(event => {
    if (event.level.isClientSide()) return;
    let player = event.player;
    let server = event.server;
    
    // 饰品初始化：移除旧饰品
    let Curios = ["body", "belt", "bracelet", "curio", "hands", 
        "necklace", "ring" , "rings", "feet", "hands","super_curio",
        "legs","heart","waist","talisman",]

    Curios.forEach(curio=>{
        server.runCommandSilent(`/curios remove ${curio} ${player.getDisplayName().getString()} 10`);
    })
})