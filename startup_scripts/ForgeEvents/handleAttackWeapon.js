// Priority: 5000
/**
 * 处理玩家攻击实体时的武器充能逻辑
 * @param {Internal.AttackEntityEvent} event
 * @param {Internal.Player} entity
 * @param {Internal.Entity} target
 * @param {Object} context 攻击事件上下文
 */
function handleAttackWeapon(event, entity, target, context) {
    // 攻击事件上下文已缓存主手物品，旧调用方仍回退到单次读取。
    let mainHand = context != null ? context.mainHand : entity.getItemInHand("main_hand");
    let mainHandId = mainHand != null && mainHand.id != null ? String(mainHand.id) : "";
    let weaponCode = global.FORGE_ATTACK_WEAPON_CODES != null ? global.FORGE_ATTACK_WEAPON_CODES[mainHandId] : null;

    // 第三阶段：按物品 ID 查表后分发，避免连续比较；同时修正 ItemStack 与字符串比较无法命中的问题。
    switch (weaponCode) {
        case 1:
            // 泰拉刃：增加充能等级
            if (!mainHand.nbt.power) {
                mainHand.nbt.power = 1;
            }
            else {
                if (mainHand.nbt.power < 4) {
                    mainHand.nbt.power = mainHand.nbt.power + 1;
                }
                else {
                    return;
                }
            }
            break;
        case 2:
            // 动力剑：充能逻辑
            if (!mainHand.getNbt().getInt("Power")) {
                mainHand.getNbt().putInt("Power", 4)
            } else {
                mainHand.getNbt().putInt("Power", mainHand.getNbt().getInt("Power") - 1)
            }

            // 充能耗尽，变回普通棒球棍
            if (mainHand.getNbt().getInt("Power") == 1) {
                entity.setItemInHand("main_hand", "rainbow:baseball_bat")
                entity.cooldowns.addCooldown("rainbow:baseball_bat", SecoundToTick(40))
            }
            break;
        case 3:
            // 决斗剑：初始化类型
            if (!mainHand.nbt.type) {
                mainHand.nbt.type = none;
            }
            break;
    }

    // lpecac：攻击时在目标位置生成源于玩家的不破坏方块爆炸，爆炸大小由 boom_damage 属性决定，0.15秒冷却
    if (hasContextCurio(context, "attacker", entity, 'rainbow:lpecac')) {
        if (entity.cooldowns.isOnCooldown('rainbow:lpecac')) return;
        try {
            let boomValue = entity.getAttributeValue("rainbow:generic.boom_damage");
            entity.level.createExplosion(target.x, target.y, target.z)
                .causesFire(false)
                .exploder(entity)
                .explosionMode("none")
                .strength(boomValue/10)
                .explode();
            entity.cooldowns.addCooldown("rainbow:lpecac", SecoundToTick(0.15));
        } catch (e) {
            console.log('lpecac爆炸报错:');
            console.log(e);
        }
    }
}
