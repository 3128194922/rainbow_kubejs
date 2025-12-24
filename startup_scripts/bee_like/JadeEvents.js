const $Entitys = Java.loadClass('net.minecraft.world.entity.Entity')

JadeEvents.onCommonRegistration(event=>{
    event.entityDataProvider('rainbow:bee_like', $Entitys).setCallback((tag,accessor)=>{
        let entity = accessor.getEntity();
        if (!entity) return;
        if (!entity.persistentData.getString("like_food")) return;
        
        tag.putString("like_food_card", entity.persistentData.getString("like_food"));
    })
})