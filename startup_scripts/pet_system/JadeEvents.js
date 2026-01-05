// priority: 0
// ==========================================
// 宠物系统 Jade 数据提供者
// Pet System Jade Data Provider
// ==========================================
// 为 Jade (Waila) 提供被精神控制实体的所有者信息
// Provides owner information for mind-controlled entities to Jade (Waila)

JadeEvents.onCommonRegistration(event=>{
    event.entityDataProvider('rainbow:MindControl', $Entitys).setCallback((tag,accessor)=>{
        let entity = accessor.getEntity();
        if (!entity) return;
        if (!entity.persistentData.OwnerName) return;
        tag.putString("OwnerName_",entity.persistentData.OwnerName);
    })
})