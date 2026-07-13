// Priority: 5000
/**
 * 处理玩家攻击实体时的武器充能逻辑
 * @param {Internal.AttackEntityEvent} event
 * @param {Internal.Player} entity
 * @param {Internal.Entity} target
 */
function handleAttackWeapon(event, entity, target) {
    // 泰拉刃：增加充能等级
    if (entity.getItemInHand("main_hand") === 'rainbow:terasword') {
        if (!entity.getItemInHand("main_hand").nbt.power) {
            entity.getItemInHand("main_hand").nbt.power = 1;
        }
        else {
            if (entity.getItemInHand("main_hand").nbt.power < 4) {
                entity.getItemInHand("main_hand").nbt.power = entity.getItemInHand("main_hand").nbt.power + 1;
            }
            else {
                return;
            }
        }
    }
    // 动力剑：充能逻辑
    if (entity.getItemInHand("main_hand") === 'rainbow:baseball_power') {
        console.log(entity.getItemInHand("main_hand").getNbt().getInt("Power"))
        if (!entity.getItemInHand("main_hand").getNbt().getInt("Power")) {
            entity.getItemInHand("main_hand").getNbt().putInt("Power", 4)
        } else {
            entity.getItemInHand("main_hand").getNbt().putInt("Power", entity.getItemInHand("main_hand").getNbt().getInt("Power") - 1)
        }

        // 充能耗尽，变回普通棒球棍
        if (entity.getItemInHand("main_hand").getNbt().getInt("Power") == 1) {
            entity.setItemInHand("main_hand", "rainbow:baseball_bat")
            entity.cooldowns.addCooldown("rainbow:baseball_bat", SecoundToTick(40))
        }
    }
    // 决斗剑：初始化类型
    if (entity.getItemInHand("main_hand") === 'rainbow:duel') {
        if (!entity.getItemInHand("main_hand").nbt.type) {
            entity.getItemInHand("main_hand").nbt.type = none;
        }
    }
}
