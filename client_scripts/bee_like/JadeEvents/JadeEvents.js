// priority: 0
// ==========================================
// 蜜蜂实体 Jade 提示
// Bee Entity Jade Tooltips
// ==========================================
// 在 Jade (Waila) 提示中显示蜜蜂类实体想吃的食物
// Displays the food the bee-like entity wants to eat in Jade (Waila) tooltips

const $Entitys = Java.loadClass('net.minecraft.world.entity.Entity')

JadeEvents.onClientRegistration((event) => {
    
    event.entity('rainbow:bee_like', $Entitys).tooltip((tooltip, accessor, pluginConfig) => {
        let {serverData} = accessor;
        if (!serverData) return;

        let food = serverData.get("like_food_card");
        if(food) {
            tooltip.add(Text.gold(['想吃:']).append(Text.of(food)));
        }
    });
});
