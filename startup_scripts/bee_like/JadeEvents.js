// priority: 0
// ==========================================
// 🐝 蜜蜂类实体 Jade/Waila 显示逻辑
// 作用：为蜜蜂类实体添加自定义的数据显示（如喜好的食物）
// ==========================================

const $Entitys = Java.loadClass('net.minecraft.world.entity.Entity')

// 注册 Jade (Waila) 的通用数据提供者
JadeEvents.onCommonRegistration(event=>{
    // 为所有实体注册一个数据提供者，ID 为 'rainbow:bee_like'
    event.entityDataProvider('rainbow:bee_like', $Entitys).setCallback((tag,accessor)=>{
        let entity = accessor.getEntity();
        if (!entity) return;
        
        // 检查实体是否有持久化数据 "like_food"
        if (!entity.persistentData.getString("like_food")) return;
        
        // 将 "like_food" 数据写入到 Jade 的数据标签中，供客户端渲染显示
        tag.putString("like_food_card", entity.persistentData.getString("like_food"));
    })
})
