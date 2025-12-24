const $Entitys = Java.loadClass('net.minecraft.world.entity.Entity')

JadeEvents.onClientRegistration((event) => {
    
    event.entity('rainbow:bee_like', $Entitys).tooltip((tooltip, accessor, pluginConfig) => {
        let {serverData} = accessor;
        if (!serverData) return;

        let food = serverData.get("like_food_card");
        if(!food) return;
        tooltip.add(Text.gold(['想吃:']).append(Text.of(food)));
    });
});