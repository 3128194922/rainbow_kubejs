// [PET_SYSTEM_DISABLED] // priority: 0
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 宠物系统 Jade 提示
// [PET_SYSTEM_DISABLED] // Pet System Jade Tooltips
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 在 Jade 提示中标记被精神控制的召唤物
// [PET_SYSTEM_DISABLED] // Marks mind-controlled summons in Jade tooltips
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] JadeEvents.onClientRegistration((event) => {
// [PET_SYSTEM_DISABLED]     
// [PET_SYSTEM_DISABLED]     event.entity('rainbow:soul_diamondControl', Entitys).tooltip((tooltip, accessor, pluginConfig) => {
// [PET_SYSTEM_DISABLED]         let {serverData} = accessor;
// [PET_SYSTEM_DISABLED]         if (!serverData) return;
// [PET_SYSTEM_DISABLED]         
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED]         let UUID = serverData.get("OwnerName_");
// [PET_SYSTEM_DISABLED]         if(!UUID) return;
// [PET_SYSTEM_DISABLED]         tooltip.add(Text.gold(['[召唤物]']));
// [PET_SYSTEM_DISABLED]     });
// [PET_SYSTEM_DISABLED] });
