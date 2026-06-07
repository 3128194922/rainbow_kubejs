// priority: 0
// ==========================================
// 精英怪 Jade 提示
// ==========================================
//显示怪物词条
/*
JadeEvents.onClientRegistration((event) => {
    
    event.entity().tooltip((tooltip, accessor, pluginConfig) => {
        let {serverData} = accessor;
        if (!serverData) return;

        let power = serverData.get("POWER");

        if(power) {
            tooltip.add(Text.gold(power));
        }
    });
});
*/