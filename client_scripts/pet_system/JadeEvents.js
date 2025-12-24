JadeEvents.onClientRegistration((event) => {
    
    event.entity('rainbow:MindControl', $Entitys).tooltip((tooltip, accessor, pluginConfig) => {
        let {serverData} = accessor;
        if (!serverData) return;
        

        let UUID = serverData.get("OwnerName_");
        if(!UUID) return;
        tooltip.add(Text.gold(['[召唤物]']));
    });
});