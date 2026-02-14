// Priority: 5000
/**
 * 处理宠物、召唤物等非玩家实体的伤害结算
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} actual
 */
function handleNonPlayerDamage(event, actual) {
    if (!actual || !actual.isLiving() || actual.isPlayer()) return;

    let owner = null;
    // 1. 检查自定义驯服系统 (KubeJS persistentData)
    if (actual.persistentData.OwnerName) {
        let ownerUuidStr = actual.persistentData.OwnerName;
        try {
            // 尝试通过 UUID 获取玩家
            owner = actual.server.getPlayerList().getPlayer(java.util.UUID.fromString(ownerUuidStr));
        } catch (e) {
            // 如果失败，尝试通过名称获取（备用）
            owner = actual.server.getPlayerList().getPlayer(ownerUuidStr);
        }
    }
    // 2. 检查原版驯服系统 (Vanilla TamableAnimal)
    else if (actual.owner) {
        owner = actual.owner;
    }

    if (owner && owner.isPlayer()) {
        let attributeValue = owner.getAttributeValue("rainbow:generic.pet_damage");
        event.setAmount(attributeValue * event.getAmount());
    }
}
