// Priority: 5000
const POWER_SWORD_ATTACK_FIELD_REDUCTION_TICKS = 2 * 20;

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
            // 先驱者动力剑：同一物品通过 NBT 开启分解立场，并保留原有攻击次数消耗。
            try {
                let powerSwordTag = mainHand.getNbt();
                let currentTick = entity.level.getTime();
                if (powerSwordTag == null || !powerSwordTag.getBoolean("DecompositionField")
                    || powerSwordTag.getLong("DecompositionFieldUntil") <= currentTick) {
                    if (powerSwordTag != null && powerSwordTag.getBoolean("DecompositionField")) {
                        if (typeof global.triggerPowerSwordAnimation === "function") {
                            global.triggerPowerSwordAnimation(entity, mainHand, "decomposition_field_close");
                        }
                        powerSwordTag.remove("DecompositionField");
                        powerSwordTag.remove("DecompositionFieldUntil");
                        powerSwordTag.remove("Power");
                        entity.getInventory().setChanged();
                    }
                    return;
                }

                // 动力剑每次有效攻击都会消耗分解立场 2 秒的有效持续时间。
                let reducedFieldUntil = powerSwordTag.getLong("DecompositionFieldUntil") - POWER_SWORD_ATTACK_FIELD_REDUCTION_TICKS;
                if (reducedFieldUntil <= currentTick) {
                    if (typeof global.triggerPowerSwordAnimation === "function") {
                        global.triggerPowerSwordAnimation(entity, mainHand, "decomposition_field_close");
                    }
                    powerSwordTag.remove("DecompositionField");
                    powerSwordTag.remove("DecompositionFieldUntil");
                    powerSwordTag.remove("Power");
                    entity.getInventory().setChanged();
                    entity.cooldowns.addCooldown("rainbow:power_sword", SecoundToTick(40));
                }
                else {
                    powerSwordTag.putLong("DecompositionFieldUntil", reducedFieldUntil);

                    let power = powerSwordTag.getInt("Power");
                    if (power <= 0) {
                        power = 4;
                    }
                    else {
                        power = power - 1;
                    }
                    powerSwordTag.putInt("Power", power);
                    entity.getInventory().setChanged();

                    // 攻击次数耗尽时结束立场；定时结束由 server_scripts/power_sword/main.js 负责。
                    if (power <= 1) {
                        if (typeof global.triggerPowerSwordAnimation === "function") {
                            global.triggerPowerSwordAnimation(entity, mainHand, "decomposition_field_close");
                        }
                        powerSwordTag.remove("DecompositionField");
                        powerSwordTag.remove("DecompositionFieldUntil");
                        powerSwordTag.remove("Power");
                        entity.getInventory().setChanged();
                        entity.cooldowns.addCooldown("rainbow:power_sword", SecoundToTick(40));
                    }
                }
            }
            catch (e) {
                console.log("先驱者动力剑攻击状态处理出错：");
                console.log(e);
            }
            break;
    }

    // 吐根现由实际伤害入口统一触发近战/远程/法术AOE，不再创建击退爆炸。

}
