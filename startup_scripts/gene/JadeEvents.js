// priority: 0
// ==========================================
// 🧬 基因矩阵 Jade 数据提供者
// ==========================================

JadeEvents.onCommonRegistration(event => {
    // 注册数据提供者，必须与 client_scripts 中的 ID 一致 ('gene:hormone_bonuses')
    event.entityDataProvider('gene:hormone_bonuses', $LivingEntity).setCallback((tag, accessor) => {
        let entity = accessor.getEntity();
        if (!entity) return;
        
        let pData = entity.persistentData;
        
        // 检查实体是否有九龙加成数据
        if (pData.contains('KowloonBonuses')) {
            // 将加成数据同步给客户端
            tag.put('KowloonBonuses', pData.get('KowloonBonuses'));
        }
        
        // 同步上限数据
        if (pData.contains('KowloonLimits')) {
            tag.put('KowloonLimits', pData.get('KowloonLimits'));
        }
        
        // 同步颜色数据
        if (pData.contains('KowloonColors')) {
            tag.put('KowloonColors', pData.get('KowloonColors'));
        }
    })
})
