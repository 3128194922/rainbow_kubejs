// priority: 0
// ==========================================
// 宠物系统 Jade 提示
// Pet System Jade Tooltips
// ==========================================
// 在 Jade 提示中标记被精神控制的召唤物
// Marks mind-controlled summons in Jade tooltips

JadeEvents.onClientRegistration((event) => {
    
    event.entity('rainbow:MindControl', $Entitys).tooltip((tooltip, accessor, pluginConfig) => {
        let {serverData} = accessor;
        if (!serverData) return;
        

        let UUID = serverData.get("OwnerName_");
        if(!UUID) return;
        tooltip.add(Text.gold(['[召唤物]']));
    });
});