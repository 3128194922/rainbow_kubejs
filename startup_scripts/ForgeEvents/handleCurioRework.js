// priority: 5000
// ==========================================
// 四件饰品重做逻辑；兽性闪避层数只保存在药水效果中，不写入饰品NBT。
// ==========================================

const BEAST_MASK_ID = "rainbow:beast_mask";
const BEAST_DODGE_EFFECT = "rainbow:beast_dodge";
const BEAST_DODGE_MAX_LEVEL = 10;
const BEAST_DODGE_EFFECT_TICKS = 200;

const FURY_MASK_ID = "rainbow:fury_mask";
const FURY_EFFECT_ID = "rainbow:fury";
const FURY_DAMAGE_REQUIRED = 10.0;
const FURY_DURATION_TICKS = 220;
const FURY_COOLDOWN_TICKS = 100;
const FURY_PITCH_KEY = "FuryPitch";
const FURY_PITCH_MIN = 1.0;
const FURY_PITCH_MAX = 2.0;
const FURY_PITCH_STEP = 0.1;
const FURY_VANILLA_CRIT_TICK = "rainbow:fury_vanilla_crit_tick";
const FURY_CRIT_TICK = "rainbow:fury_crit_tick";
const FURY_CRIT_TARGET = "rainbow:fury_crit_target";

function getCurioTagForRework(stack) {
    if (stack == null) return null;
    let nbt = stack.nbt;
    if (nbt == null) {
        stack.nbt = {};
        nbt = stack.nbt;
    }
    return nbt;
}

function getFuryPitch(nbt) {
    let pitch = nbt.getFloat(FURY_PITCH_KEY) || 0;
    if (pitch < FURY_PITCH_MIN || pitch > FURY_PITCH_MAX) pitch = FURY_PITCH_MIN;
    return pitch;
}

function advanceFuryPitch(pitch) {
    let nextPitch = pitch + FURY_PITCH_STEP;
    if (nextPitch > FURY_PITCH_MAX) nextPitch = FURY_PITCH_MIN;
    return Number(nextPitch.toFixed(2));
}

function handleBeastMaskHurt(event, victim, context) {
    if (!victim || !victim.isPlayer()) return;
    if (!hasContextCurio(context, "victim", victim, BEAST_MASK_ID)) return;

    try {
        let currentEffect = victim.getEffect(BEAST_DODGE_EFFECT);
        let dodgeLevel = currentEffect == null ? 0 : currentEffect.getAmplifier() + 1;
        dodgeLevel = Math.min(BEAST_DODGE_MAX_LEVEL, dodgeLevel + 1);
        victim.potionEffects.add(BEAST_DODGE_EFFECT, BEAST_DODGE_EFFECT_TICKS, dodgeLevel - 1, false, false);
    } catch (e) {
        console.log("[兽性面具] 闪避药水效果刷新出错: " + e);
        console.log(e);
    }
}

function handleFuryMaskHurt(event, victim, context) {
    if (!victim || !victim.isPlayer()) return;
    if (!hasContextCurio(context, "victim", victim, FURY_MASK_ID)) return;

    try {
        if (victim.cooldowns.isOnCooldown(FURY_MASK_ID)) return;

        let stack = getContextCurioStack(context, "victim", FURY_MASK_ID);
        let nbt = getCurioTagForRework(stack);
        if (nbt == null) return;

        let amount = Number(event.getAmount());
        if (!(amount > 0)) return;

        let energy = nbt.getFloat("Energy") || 0;
        energy = Math.min(FURY_DAMAGE_REQUIRED, energy + amount);
        if (energy < FURY_DAMAGE_REQUIRED) {
            nbt.putFloat("Energy", energy);
            return;
        }

        nbt.putFloat("Energy", 0);
        victim.potionEffects.add(FURY_EFFECT_ID, FURY_DURATION_TICKS, 0, false, false);
        victim.cooldowns.addCooldown(FURY_MASK_ID, FURY_COOLDOWN_TICKS);

        let pitch = getFuryPitch(nbt);
        victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "rainbow:voice.animals", "voice", 1.0, pitch);
        nbt.putFloat(FURY_PITCH_KEY, advanceFuryPitch(pitch));
    } catch (e) {
        console.log("[狂怒面具] 受伤充能出错: " + e);
        console.log(e);
    }
}

function markFuryVanillaCritical(event) {
    try {
        let player = event.getEntity();
        if (player == null || !player.isPlayer() || !event.isVanillaCritical()) return;
        player.persistentData.putLong(FURY_VANILLA_CRIT_TICK, player.level.getTime());
    } catch (e) {
        console.log("[狂怒面具] 记录跳劈暴击出错: " + e);
        console.log(e);
    }
}

// Apothic 自定义暴击不提供独立事件标记，因此按项目暴击率属性建立本次非跳劈暴击窗口；跳劈由上方 Forge 事件明确排除。
function markFuryCritical(event, attacker, victim, context) {
    if (attacker == null || !attacker.isPlayer() || victim == null) return;
    if (!hasContextCurio(context, "attacker", attacker, FURY_MASK_ID)) return;
    if (!attacker.hasEffect(FURY_EFFECT_ID)) return;

    try {
        if (!(event.getAmount() > 0)) return;
        let now = attacker.level.getTime();
        let vanillaCritTick = attacker.persistentData.getLong(FURY_VANILLA_CRIT_TICK);
        if (vanillaCritTick == now) {
            attacker.persistentData.putLong(FURY_VANILLA_CRIT_TICK, -1);
            return;
        }

        let chanceAttribute = attacker.getAttribute("attributeslib:crit_chance");
        let damageAttribute = attacker.getAttribute("attributeslib:crit_damage");
        let chance = chanceAttribute == null ? 0 : chanceAttribute.getValue();
        let critDamage = damageAttribute == null ? 1 : damageAttribute.getValue();
        if (!(chance > 0) || !(critDamage > 1)) return;

        let cappedChance = Math.min(1.0, chance);
        if (Math.random() < cappedChance) {
            attacker.persistentData.putLong(FURY_CRIT_TICK, now);
            attacker.persistentData.putString(FURY_CRIT_TARGET, victim.getUuid().toString());
        }
    } catch (e) {
        console.log("[狂怒面具] 非跳劈暴击判定出错: " + e);
        console.log(e);
    }
}

function handleFuryMaskAttack(event, attacker, victim) {
    if (attacker == null || !attacker.isPlayer() || victim == null) return;
    if (!attacker.hasEffect(FURY_EFFECT_ID)) return;

    try {
        if (!(event.getAmount() > 0)) return;
        attacker.heal(5);

        let now = attacker.level.getTime();
        let critTick = attacker.persistentData.getLong(FURY_CRIT_TICK);
        let critTarget = attacker.persistentData.getString(FURY_CRIT_TARGET);
        if (critTick == now && critTarget == victim.getUuid().toString()) {
            attacker.heal(20);
            attacker.persistentData.putLong(FURY_CRIT_TICK, -1);
            attacker.persistentData.putString(FURY_CRIT_TARGET, "");
        }
    } catch (e) {
        console.log("[狂怒面具] 攻击回血出错: " + e);
        console.log(e);
    }
}

ForgeEvents.onEvent("net.minecraftforge.event.entity.player.CriticalHitEvent", event => {
    markFuryVanillaCritical(event);
});
