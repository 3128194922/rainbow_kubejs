// priority: 5000
// ==========================================
// 古圣头骨（rainbow:ancient_skull） - 伤害转化为延迟债务
// ==========================================
// 功能：
//   1. 佩戴者受到的所有伤害（LivingDamageEvent 的最终伤害）不立即扣血，
//      而是等量存入饰品 NBT 的 AncientSkullDebt。
//   2. curioTick 每 10 tick（0.5 秒）以自定义伤害类型 rainbow:ancient_skull
//      结算“剩余债务的 20%”（最少 0.5 点，剩余不足 0.01 时一次结清）。
//   3. 该伤害类型带 bypasses_armor / bypasses_effects / bypasses_resistance /
//      bypasses_enchantments tag，为真实伤害。
//   4. 债务未清零时 canUnequip 返回 false；强制卸下时由 onUnequip 立即结算全部债务。
// 递归防护：
//   - 伤害类型 msgId 为 'ancient_skull'，处理器直接跳过；
//   - 结算期间用 per-player UUID 表 ancientSkullSettlingPlayers 双保险。
// 无敌帧：
//   结算前保存 invulnerableTime 并清零，结算后恢复；
//   同时反射保存/还原 LivingEntity.lastHurt，避免后续无敌帧减伤以 DoT 数值为基准。
//   伤害源使用 new DamageSource(holder)（不指定直接/间接实体），
//   这样 Apothic Attributes 的闪避（要求直接实体为 LivingEntity）不会触发。
// ==========================================

const ANCIENT_SKULL_ITEM_ID = 'rainbow:ancient_skull';
const ANCIENT_SKULL_DEBT_TAG = 'AncientSkullDebt';
const ANCIENT_SKULL_PAY_INTERVAL = 10;
const ANCIENT_SKULL_PAY_RATIO = 0.2;
const ANCIENT_SKULL_MIN_PAY = 0.5;
const ANCIENT_SKULL_DEBT_EPSILON = 0.01;

let ancientSkullSettlingPlayers = {};
let ancientSkullLastHurtField = null;
let ancientSkullLastHurtFieldResolved = false;

/**
 * 获取并缓存 LivingEntity.lastHurt 字段（沿父类链查找，兼容 SRG 名 f_20898_ 与 Mojmap 名 lastHurt）。
 * @param {Internal.Entity} entity 实体
 * @returns {JavaObject|null}
 */
function getAncientSkullLastHurtField(entity) {
    if (ancientSkullLastHurtFieldResolved) return ancientSkullLastHurtField;
    ancientSkullLastHurtFieldResolved = true;
    try {
        let cls = entity.getClass();
        while (cls != null) {
            let fs = cls.getDeclaredFields();
            for (let i = 0; i < fs.length; i++) {
                let name = String(fs[i].getName());
                if ((name == 'lastHurt' || name == 'f_20898_') && String(fs[i].getType().getName()) == 'float') {
                    fs[i].setAccessible(true);
                    ancientSkullLastHurtField = fs[i];
                    return ancientSkullLastHurtField;
                }
            }
            cls = cls.getSuperclass();
        }
        console.log("[古圣头骨] 未找到 lastHurt 字段，将无法恢复无敌帧伤害基准");
    } catch (e) {
        ancientSkullLastHurtField = null;
        console.log("[古圣头骨] 无法获取 lastHurt 字段，将无法恢复无敌帧伤害基准: " + e);
    }
    return ancientSkullLastHurtField;
}

/**
 * onUnequip 的两个 stack 参数顺序在不同 KubeJS-Curios 版本中不稳定，按物品 id 取本体。
 * @param {Internal.ItemStack} firstStack
 * @param {Internal.ItemStack} secondStack
 * @returns {Internal.ItemStack|null}
 */
function ancientSkullPickStack(firstStack, secondStack) {
    if (firstStack != null && String(firstStack.id) == ANCIENT_SKULL_ITEM_ID) return firstStack;
    if (secondStack != null && String(secondStack.id) == ANCIENT_SKULL_ITEM_ID) return secondStack;
    return null;
}

/**
 * 读取饰品 NBT 中尚未结算的债务。
 * @param {Internal.ItemStack} stack 古圣头骨饰品
 * @returns {number}
 */
function ancientSkullGetDebt(stack) {
    try {
        if (stack == null || stack.isEmpty()) return 0;
        let nbt = stack.nbt;
        if (nbt == null || !nbt.contains(ANCIENT_SKULL_DEBT_TAG)) return 0;
        return nbt.getFloat(ANCIENT_SKULL_DEBT_TAG);
    } catch (e) {
        console.log("[古圣头骨] 读取债务失败: " + e);
        return 0;
    }
}

/**
 * 写入债务；低于清零阈值时直接移除字段，避免残留极小浮点数。
 * @param {Internal.ItemStack} stack 古圣头骨饰品
 * @param {number} debt 剩余债务
 */
function ancientSkullSetDebt(stack, debt) {
    try {
        if (stack == null || stack.isEmpty()) return;
        let tag = stack.getOrCreateTag();
        if (debt <= ANCIENT_SKULL_DEBT_EPSILON) {
            tag.remove(ANCIENT_SKULL_DEBT_TAG);
        } else {
            tag.putFloat(ANCIENT_SKULL_DEBT_TAG, debt);
        }
    } catch (e) {
        console.log("[古圣头骨] 写入债务失败: " + e);
    }
}

/**
 * 构造不归属任何实体的古圣头骨伤害源（避免触发 Apothic 闪避与玩家击杀归属）。
 * @param {Internal.Player} player 佩戴者
 * @returns {Internal.DamageSource}
 */
function ancientSkullCreateDamageSource(player) {
    let registry = player.level.registryAccess().registryOrThrow(Registries.DAMAGE_TYPE);
    let holder = registry.getHolderOrThrow(ResourceKey.create(Registries.DAMAGE_TYPE, new ResourceLocation('rainbow', 'ancient_skull')));
    return new DamageSource(holder);
}

/**
 * 对佩戴者结算一次真实伤害（清空无敌帧并在结束后还原）。
 * @param {Internal.Player} player 佩戴者
 * @param {number} amount 伤害值
 * @returns {boolean} 是否成功结算
 */
function ancientSkullDealTrueDamage(player, amount) {
    if (!(amount > 0)) return false;

    let key = player.getUuid().toString();
    if (ancientSkullSettlingPlayers[key]) return false;

    let lastHurtField = getAncientSkullLastHurtField(player);
    let previousLastHurt = null;
    if (lastHurtField != null) {
        try {
            previousLastHurt = lastHurtField.getFloat(player);
        } catch (e) {
            console.log("[古圣头骨] 读取 lastHurt 失败: " + e);
        }
    }

    let previousInvulnerableTime = player.invulnerableTime;
    let applied = false;
    ancientSkullSettlingPlayers[key] = true;
    try {
        player.invulnerableTime = 0;
        applied = player.attack(ancientSkullCreateDamageSource(player), amount);
    } catch (e) {
        console.log("[古圣头骨] 结算持续伤害失败: " + e);
    } finally {
        delete ancientSkullSettlingPlayers[key];
        player.invulnerableTime = previousInvulnerableTime;
        if (lastHurtField != null && previousLastHurt != null) {
            try {
                lastHurtField.setFloat(player, previousLastHurt);
            } catch (e) {
                console.log("[古圣头骨] 恢复 lastHurt 失败: " + e);
            }
        }
    }
    return applied;
}

/**
 * 受到伤害时把最终伤害转为债务，并取消本次扣血。
 * 由 startup_scripts/ForgeEvents/main.js 的 LivingDamageEvent 在最后调用，
 * 保证读取的是护甲/保护/圣经/大胃袋等处理后的最终伤害。
 * @param {Internal.LivingDamageEvent} event
 * @param {Internal.Entity} victim   受伤实体
 * @param {Internal.DamageSource} source 伤害源
 * @param {Object} context           伤害事件上下文
 */
function handleAncientSkullDamage(event, victim, source, context) {
    try {
        if (victim == null || !victim.isPlayer()) return;
        if (victim.level.isClientSide()) return;
        if (event == null || event.isCanceled()) return;
        if (victim.isDeadOrDying()) return;

        let amount = event.getAmount();
        if (!(amount > 0)) return;

        let damageType = context != null ? context.damageType : String(source.getType());
        if (damageType == 'ancient_skull' || damageType == 'outOfWorld' || damageType == 'genericKill') return;

        let key = victim.getUuid().toString();
        if (ancientSkullSettlingPlayers[key]) return;

        let stack = getContextCurioStack(context, 'victim', ANCIENT_SKULL_ITEM_ID);
        if (stack == null) return;

        ancientSkullSetDebt(stack, ancientSkullGetDebt(stack) + amount);
        event.setCanceled(true);
    } catch (e) {
        console.log("[古圣头骨] 伤害转化失败: " + e);
    }
}

/**
 * curioTick：每 10 tick 结算剩余债务的 20%（最少 0.5 点）。
 * @param {Internal.SlotContext} slotContext
 * @param {Internal.ItemStack} stack
 */
function ancientSkullCurioTick(slotContext, stack) {
    try {
        if (slotContext == null) return;
        let player = slotContext.entity();
        if (player == null || !player.isPlayer()) return;
        if (player.level.isClientSide()) return;
        if (player.isDeadOrDying()) return;
        if (!everyTicks(player, ANCIENT_SKULL_PAY_INTERVAL)) return;

        let debt = ancientSkullGetDebt(stack);
        if (debt <= ANCIENT_SKULL_DEBT_EPSILON) {
            if (debt > 0) ancientSkullSetDebt(stack, 0);
            return;
        }

        let payment = debt * ANCIENT_SKULL_PAY_RATIO;
        if (payment < ANCIENT_SKULL_MIN_PAY) payment = ANCIENT_SKULL_MIN_PAY;
        if (payment >= debt - ANCIENT_SKULL_DEBT_EPSILON) payment = debt;

        if (ancientSkullDealTrueDamage(player, payment)) {
            ancientSkullSetDebt(stack, Math.max(0, debt - payment));
        }
    } catch (e) {
        console.log("[古圣头骨] 持续伤害结算失败: " + e);
    }
}

/**
 * 强制卸下时立即结算全部剩余债务（死亡时只清空，不再造成伤害）。
 * @param {Internal.Player} player 佩戴者
 * @param {Internal.ItemStack} stack 古圣头骨饰品
 */
function ancientSkullSettleAll(player, stack) {
    try {
        if (player == null || !player.isPlayer() || stack == null) return;
        if (player.level.isClientSide()) return;

        let debt = ancientSkullGetDebt(stack);
        if (debt <= ANCIENT_SKULL_DEBT_EPSILON) {
            ancientSkullSetDebt(stack, 0);
            return;
        }

        if (player.isDeadOrDying()) {
            ancientSkullSetDebt(stack, 0);
            return;
        }

        if (ancientSkullDealTrueDamage(player, debt)) {
            ancientSkullSetDebt(stack, 0);
        }
    } catch (e) {
        console.log("[古圣头骨] 强制结算失败: " + e);
    }
}

/**
 * canUnequip：债务未清零时无法主动卸下（强制移除不受此限制）。
 * @param {Internal.SlotContext} slotContext
 * @param {Internal.ItemStack} stack
 * @returns {boolean}
 */
function ancientSkullCanUnequip(slotContext, stack) {
    try {
        if (!canUnequipNotOnCooldown(slotContext, stack)) return false;
        if (slotContext == null) return true;
        let entity = slotContext.entity();
        if (entity == null || !entity.isPlayer()) return true;
        if (entity.isDeadOrDying()) return true;
        return ancientSkullGetDebt(stack) <= ANCIENT_SKULL_DEBT_EPSILON;
    } catch (e) {
        console.log("[古圣头骨] 卸下检查失败: " + e);
        return true;
    }
}
