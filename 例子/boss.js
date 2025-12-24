/**
 * 
 * @param {$PlayerKJS_} player 
 * @param {float} ratio 
 * @param {string} bar_empty 
 * @param {string} bar_filled 
 * @param {string} name 
 */
function paint_bossbar(player,ratio,bar_empty,bar_filled,name){
    player.paint({
        bar_empty:{
            type: 'rectangle',x:0,y:8,z:0,w:192,h:16,alignX:'center',alignY:'top',draw:'ingame',
            texture: `kubejs:textures/painter/${bar_empty}.png`,visible: true 
        },
        bar_filled:{
             type:'rectangle', 
             x:`-91+(91*(${ratio}))`,y:8,z:1,w:`182*(${ratio})`,h: 16
             ,u1:`1-${ratio}`,u0:1,alignX: 'center', alignY: 'top',draw:'ingame',
             texture: `kubejs:textures/painter/${bar_filled}.png`, visible: true 
        },
        bar_name:{
            type:'text',alignX: 'center', alignY: 'top',draw:'ingame',
            scale: 1,x:0,y:4,text:name, visible: true 
        }
    })
}
/**
 * 
 * @param {$PlayerKJS_} player 
 */
function clear_bossbar(player){
    player.paint({
        bar_empty:{
            visible: false 
        },
        bar_filled:{
            visible: false
        },
        bar_name:{
            visible: false
        }
    })
}
/**
 * 
 * @param {$EntityKJS_} entity 
 */
function isBoss(entity){
    return entity.getType()=="minecraft:zombie"
}
PlayerEvents.tick(event=>{
    let player=event.player;
    if(player.age%4!=0)return;
    let level=event.level;
    let pos=player.position();
    let rng = new AABB.of(pos.x()-32, pos.y()-16, pos.z()-32, pos.x()+32, pos.y()+16, pos.z()+32);
    let entityList = level.getEntitiesWithin(rng);
    let dis=Infinity
    let boss=-1;
	for(let i=0;i<entityList.length;i++){
        if(isBoss(entityList[i])){
            if(player.distanceToEntitySqr(entityList[i])<dis){
                dis=player.distanceToEntitySqr(entityList[i]);
                boss=i;
            }
        }
    }
    if(boss==-1){
        clear_bossbar(player);
    }
    else{
        let boss_entity=entityList[boss];
        let ratio=boss_entity.getHealth()/boss_entity.getMaxHealth()
        switch(boss_entity.getType()){
            case "minecraft:zombie":
                paint_bossbar(player,ratio,"bar_empty","bar_filled","§cDr Zomboss")
        }
    }
})