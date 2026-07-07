// priority: 0
PlayerEvents.loggedIn(event => {
    try{
            if (event.level.isClientSide()) return;
    let player = event.player;
    let server = event.server;
    
    // 饰品初始化：移除旧饰品
    let Curios = ["body", "belt", "bracelet", "curio", "hands", 
        "necklace", "ring" , "rings", "feet", "hands","super_curio",
        "legs","heart","waist","talisman", "informational",]

    Curios.forEach(curio=>{
        let result = server.runCommandSilent(`/curios remove ${curio} ${player.getDisplayName().getString()} 10`);
        console.log("饰品初始化：移除旧饰品 " + curio + " 结果：" + result);
    })
    }catch(e){
        console.log("玩家饰品初始化失败：" + e);
    }
})