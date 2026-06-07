// priority: 0
// ==========================================
// 精英怪 Jade 提示
// ==========================================

// 注册 Jade (Waila) 的通用数据提供者
/*JadeEvents.onCommonRegistration(event=>{
    // 为所有实体注册一个数据提供者
    event.entityDataProvider().setCallback((tag,accessor)=>{
        let entity = accessor.getEntity();
        if (!entity) return;
        
        // 检查实体是否有持久化数据 "isMiniBoss"
        if (!entity.persistentData.getBoolean("isMiniBoss")) return;
        
        // 将 "POWER" 数据写入到 Jade 的数据标签中，供客户端渲染显示
        tag.putString("POWER", entity.persistentData.getString("POWER"));
    })
})
*/