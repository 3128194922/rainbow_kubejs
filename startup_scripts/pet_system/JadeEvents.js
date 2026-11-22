// [PET_SYSTEM_DISABLED] // priority: 0
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 宠物系统 Jade 数据提供者
// [PET_SYSTEM_DISABLED] // Pet System Jade Data Provider
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 为 Jade (Waila) 提供被精神控制实体的所有者信息
// [PET_SYSTEM_DISABLED] // Provides owner information for mind-controlled entities to Jade (Waila)
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] JadeEvents.onCommonRegistration(event=>{
// [PET_SYSTEM_DISABLED]     event.entityDataProvider('rainbow:soul_diamondControl', Entitys).setCallback((tag,accessor)=>{
// [PET_SYSTEM_DISABLED]         let entity = accessor.getEntity();
// [PET_SYSTEM_DISABLED]         if (!entity) return;
// [PET_SYSTEM_DISABLED]         if (!entity.persistentData.OwnerName) return;
// [PET_SYSTEM_DISABLED]         tag.putString("OwnerName_",entity.persistentData.OwnerName);
// [PET_SYSTEM_DISABLED]     })
// [PET_SYSTEM_DISABLED] })
