// Priority: 5000
/**
 * 处理宠物、召唤物等非玩家实体的伤害结算
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 */
function handleNonPlayerDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!attacker || !attacker.isLiving() || attacker.isPlayer()) return;

    let owner = null;
    // 1. 检查自定义驯服系统 (KubeJS persistentData)
    if (attacker.persistentData.OwnerName) {
        let ownerUuidStr = attacker.persistentData.OwnerName;
        try {
            // 尝试通过 UUID 获取玩家
            owner = attacker.server.getPlayerList().getPlayer(UUID.fromString(ownerUuidStr));
        } catch (e) {
            // 如果失败，尝试通过名称获取（备用）
            owner = attacker.server.getPlayerList().getPlayer(ownerUuidStr);
        }
    }
    // 2. 检查原版驯服系统 (Vanilla TamableAnimal)
    else if (attacker.owner) {
        owner = attacker.owner;
    }

    if (owner && owner.isPlayer()) {
        let attributeValue = owner.getAttributeValue("rainbow:generic.pet_damage");
        event.setAmount(attributeValue * event.getAmount());
    }
}
