// priority: 4000
// ==========================================
// ParticleJS 自定义管线文本粒子与通用文字反馈
// ==========================================

const DAMAGE_INDICATOR_PARTICLE = 'rainbow:damage_indicator_text';
const KATANA_HIT_CUT_PARTICLE = 'rainbow:katana_hit_cut';
// 神化暴击先于最终伤害触发；暂存目标与原始 DamageSource，供伤害飘字一次性消费。
const DAMAGE_INDICATOR_CRITICAL_HITS = [];

// 伤害来源分类：用于保留现有伤害数字的颜色规则。
const PHYSICAL_DAMAGE_TYPES = [
    'player_attack', 'mob_attack', 'mob_attack_no_player', 'arrow', 'trident',
    'thrown', 'indirect_thrown', 'fireworks', 'explosion', 'explosion.player',
    'fall', 'fly_into_wall', 'falling_anvil', 'falling_block', 'falling_stalactite',
    // 圣十字架拆分伤害的物理段使用自定义 message_id。
    'holy_physical'
];
const MAGIC_DAMAGE_TYPES = [
    'magic', 'indirectMagic', 'indirect_magic', 'dragon_breath',
    'wither', 'wither_skull', 'freeze', 'sting',
    // 圣十字架拆分伤害的法术段使用自定义 message_id。
    'holy_magic'
];
const TRUE_DAMAGE_TYPES = [
    'out_of_world', 'generic', 'bad_respawn_point', 'starve', 'dry_out', 'sonic_boom',
    // 两种十字架的真实伤害段均有独立的自定义 message_id。
    'holy_true', 'rainbow:unholy_cross'
];
// 自定义伤害类型注册表 ID：用于修正 message_id 不为类型名时的真实伤害显示
const TRUE_DAMAGE_TYPE_IDS = [
    'rainbow:holy_true',
    'rainbow:unholy_cross',
    'rainbow:ancient_skull'
];
const MELEE_DAMAGE_TYPES = [
    'player_attack', 'mob_attack', 'mob_attack_no_player'
];

// 伤害数字和通用文字提示使用 ParticleJS custom 管线，绕过 RuOK 对 ParticleEngine 的接管。
StartupEvents.registry('particle_type', event => {
    try {
        event.create(DAMAGE_INDICATOR_PARTICLE, 'particlejs')
            .pipeline('custom')
            ["text(java.lang.String)"]('')
            .renderType('text')
            .lifetime(28, 34)
            .scale(1.7)
            .gravity(0.35)
            .textOutline(true);

        // 武士刀命中切割动画，复用 EEEAB 生物的六帧贴图。
        event.create(KATANA_HIT_CUT_PARTICLE, 'particlejs')
            ["texture(net.minecraft.resources.ResourceLocation)"](new ResourceLocation('eeeabsmobs', 'hit_cut_1'))
            .animation(6, 1, false, 1)
            .lifetime(5)
            .renderType('lit');
    } catch (e) {
        console.log('[ParticleJS] 注册自定义管线文字/武士刀粒子出错: ' + e);
        console.log(e);
    }
});

function particlePositionValue(position, methodName) {
    try {
        if (position == null) return null;
        let method = position[methodName];
        if (typeof method === 'function') return method.call(position);
        return position[methodName];
    } catch (e) {
        console.log('[ParticleJS] 读取粒子坐标出错: ' + e);
        return null;
    }
}

// 服务端通用 ParticleJS 文本粒子 API；custom 管线负责客户端同步与渲染。
function sendTextParticle(level, x, y, z, text, color, outline, outlineColor) {
    try {
        if (level == null || typeof ParticleJS === 'undefined' || ParticleJS == null) return false;
        if (level.isClientSide && level.isClientSide()) return false;
        if (x == null || y == null || z == null || text == null) return false;
        ParticleJS.spawn(level, DAMAGE_INDICATOR_PARTICLE, {
            x: Number(x),
            y: Number(y),
            z: Number(z),
            count: 1,
            dy: 0.3,
            text: String(text),
            textColor: color == null ? 0xFFFFFF : Number(color),
            textOutlineColor: outlineColor == null ? 0x333333 : Number(outlineColor),
            textOutline: outline == null ? true : Boolean(outline)
        });
        return true;
    } catch (e) {
        console.log('[ParticleJS] 发送自定义管线文本粒子出错: ' + e);
        console.log(e);
        return false;
    }
}

// 保持全局文本粒子 API 签名，供其他 startup_scripts 与 server_scripts 调用。
global.sendParticleText = function (player, x, y, z, text, color, outline, outlineColor) {
    try {
        if (player == null) return false;
        return sendTextParticle(player.level, x, y, z, text, color, outline, outlineColor);
    } catch (e) {
        console.log('[ParticleJS] sendParticleText出错: ' + e);
        console.log(e);
        return false;
    }
};

global.sendParticleTextInFront = function (player, text, color) {
    try {
        if (player == null || player.getEyePosition == null || player.getLookAngle == null) return false;
        let eyePosition = player.getEyePosition();
        let lookAngle = player.getLookAngle();
        if (eyePosition == null || lookAngle == null || eyePosition.add == null || lookAngle.scale == null) return false;
        let position = eyePosition.add(lookAngle.scale(0.8));
        return global.sendParticleText(
            player,
            particlePositionValue(position, 'x'),
            particlePositionValue(position, 'y'),
            particlePositionValue(position, 'z'),
            text,
            color,
            true,
            0x333333
        );
    } catch (e) {
        console.log('[ParticleJS] sendParticleTextInFront出错: ' + e);
        console.log(e);
        return false;
    }
};

function getDamageType(source) {
    try {
        if (source == null) return '';
        if (source.getMsgId != null) return String(source.getMsgId());
        if (source.getType != null) return String(source.getType());
    } catch (e) {
        console.log('[ParticleJS] 读取伤害类型出错: ' + e);
    }
    return '';
}

// 按伤害类型注册表 ID 识别真实伤害：自定义伤害的 message_id 可能只是 'player'，
// 此时 getType() 无法区分普通攻击与自定义真实伤害。
let trueDamageTypeIdErrorLogged = false;

function isTrueDamageTypeId(source) {
    if (source == null) return false;
    // 优先用 DamageSource#is(ResourceKey) 精确比较，失败时退回 Holder#is(ResourceLocation)
    for (let i = 0; i < TRUE_DAMAGE_TYPE_IDS.length; i++) {
        let id = TRUE_DAMAGE_TYPE_IDS[i];
        try {
            if (source.is != null && source.is(ResourceKey.create(Registries.DAMAGE_TYPE, new ResourceLocation(id)))) {
                return true;
            }
        } catch (e) {
            if (!trueDamageTypeIdErrorLogged) {
                console.log('[ParticleJS] 按ResourceKey识别伤害类型失败: ' + e);
                trueDamageTypeIdErrorLogged = true;
            }
        }
        try {
            if (source.typeHolder != null) {
                let holder = source.typeHolder();
                if (holder != null && holder.is(new ResourceLocation(id))) return true;
            }
        } catch (e) {
            if (!trueDamageTypeIdErrorLogged) {
                console.log('[ParticleJS] 按Holder识别伤害类型失败: ' + e);
                trueDamageTypeIdErrorLogged = true;
            }
        }
    }
    return false;
}

// 使用 Java DamageSource.equals 匹配同一次伤害，避免同 tick 的其他攻击或派生伤害串标。
function consumeDamageIndicatorCritical(entity, source) {
    try {
        if (entity == null || source == null) return false;
        let targetKey = String(entity.getUuid());
        for (let i = DAMAGE_INDICATOR_CRITICAL_HITS.length - 1; i >= 0; i--) {
            let hit = DAMAGE_INDICATOR_CRITICAL_HITS[i];
            if (hit.targetKey === targetKey && hit.source.equals(source)) {
                DAMAGE_INDICATOR_CRITICAL_HITS.splice(i, 1);
                return hit.time === Number(entity.level.getTime());
            }
        }
    } catch (e) {
        console.log('[ParticleJS] 消费暴击飘字标记出错: ' + e);
    }
    return false;
}

function spawnDamageIndicator(entity, difference, source) {
    try {
        if (entity == null || entity.level == null || difference == null) return false;
        let amount = Math.abs(Number(difference));
        if (!isFinite(amount)) return false;

        let damageType = getDamageType(source);
        let textColor = 0xFF0000;
        let outlineColor = 0x330000;
        if (TRUE_DAMAGE_TYPES.indexOf(damageType) >= 0 || isTrueDamageTypeId(source)) {
            textColor = 0xFFFFFF;
            outlineColor = 0x333333;
        } else if (MAGIC_DAMAGE_TYPES.indexOf(damageType) >= 0) {
            textColor = 0xAA00FF;
            outlineColor = 0x220033;
        } else if (PHYSICAL_DAMAGE_TYPES.indexOf(damageType) >= 0) {
            textColor = 0xFF0000;
            outlineColor = 0x330000;
        }

        let x = entity.getRandomX(0.5);
        let y = entity.getEyeY();
        let z = entity.getRandomZ(0.5);
        // 暴击与数字间留一个空格，整条暴击文本统一使用亮红色与深红描边，区别于普通伤害。
        let text = (Math.round(amount * 10 + 0.5) / 10).toFixed(1);
        if (consumeDamageIndicatorCritical(entity, source)) {
            text = '暴击 ' + text + '！';
            textColor = 0xFF5555;
            outlineColor = 0x550000;
        }
        return sendTextParticle(entity.level, x, y, z, text, textColor, true, outlineColor);
    } catch (e) {
        console.log('[ParticleJS] 生成伤害数字出错: ' + e);
        console.log(e);
        return false;
    }
}

global.spawnDamageIndicator = function (entity, difference, source) {
    return spawnDamageIndicator(entity, difference, source);
};

// 统一监听实际伤害事件，保留现有伤害数字入口。
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDamageEvent', event => {
    try {
        let entity = event.getEntity();
        if (entity == null || entity.level == null || entity.level.isClientSide()) return;
        let source = event.getSource();
        global.spawnDamageIndicator(entity, -event.getAmount(), source);
        if (MELEE_DAMAGE_TYPES.indexOf(getDamageType(source)) >= 0) {
            ParticleJS.spawn(entity.level, KATANA_HIT_CUT_PARTICLE, {
                x: entity.getX(),
                y: entity.getY() + entity.getBbHeight() * 0.5,
                z: entity.getZ(),
                count: 1
            });
        }
    } catch (e) {
        console.log('[ParticleJS] LivingDamageEvent文本粒子出错: ' + e);
        console.log(e);
    }
});

// 近战命中额外播放切割动画；格挡文字仍由原有事件处理器负责。
ForgeEvents.onEvent('net.minecraftforge.event.entity.ProjectileImpactEvent', event => {
    try {
        let projectile = event.getProjectile();
        if (projectile == null || projectile.level == null || projectile.level.isClientSide()) return;
    } catch (e) {
        console.log('[ParticleJS] ProjectileImpactEvent处理出错: ' + e);
        console.log(e);
    }
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingAttackEvent', event => {
    try {
        let entity = event.getEntity();
        let source = event.getSource();
        if (entity == null || entity.level == null || entity.level.isClientSide()) return;

        // 武士刀格挡提示复用 ParticleJS 自定义管线文本粒子；切割贴图仍走原管线。
        if (entity.isUsingItem != null && entity.isUsingItem() && entity.getUseItem != null) {
            let useItem = entity.getUseItem();
            if (useItem != null && String(useItem.id) === 'mysticartifacts:katana') {
                global.sendParticleTextInFront(entity, '格挡！', 0xFFAA00);
                return;
            }
        }

        // 非格挡近战切割动画在 LivingDamageEvent 中播放，避免同一次攻击重复生成。
    } catch (e) {
        console.log('[ParticleJS] 近战切割粒子出错: ' + e);
        console.log(e);
    }
});

// morecallback 神化暴击仅标记本次伤害，统一在受击目标的伤害数字中显示“暴击数字！”。
ForgeEvents.onEvent('com.morecallback.event.ApothicCriticalHitEvent', event => {
    try {
        let target = event.getTarget();
        if (target == null || target.level == null || target.level.isClientSide()) return;
        let source = event.getDamageSource();
        if (source == null) return;
        DAMAGE_INDICATOR_CRITICAL_HITS.push({
            targetKey: String(target.getUuid()),
            source: source,
            time: Number(target.level.getTime())
        });
    } catch (e) {
        console.log('[ParticleJS] 记录神化暴击飘字标记出错: ' + e);
        console.log(e);
    }
});

// 伤害被取消或完全吸收时可能没有 LivingDamageEvent；每 tick 结束清除未消费标记。
ForgeEvents.onEvent('net.minecraftforge.event.TickEvent$ServerTickEvent', event => {
    try {
        if (String(event.phase) === 'END') DAMAGE_INDICATOR_CRITICAL_HITS.length = 0;
    } catch (e) {
        console.log('[ParticleJS] 清理暴击飘字标记出错: ' + e);
    }
});

ForgeEvents.onEvent('com.morecallback.event.ApothicDodgeEvent', event => {
    try {
        let target = event.getTarget();
        if (target == null || target.level == null || target.level.isClientSide()) return;
        global.sendParticleTextInFront(target, '闪避！', 0x55FFFF);
    } catch (e) {
        console.log('[ParticleJS] 神化闪避提示出错: ' + e);
        console.log(e);
    }
});

// 原版跳劈冷却 3 秒（60 tick）；以玩家持久数据记录冷却结束时间。
const VANILLA_CRIT_COOLDOWN_TICKS = 60;
const VANILLA_CRIT_COOLDOWN_KEY = 'rainbowVanillaCritCooldownUntil';

// 原版跳劈事件在 Forge CriticalHitEvent 阶段拦截冷却中的暴击倍率。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.CriticalHitEvent', event => {
    try {
        if (!event.isVanillaCritical()) return;
        let player = event.getEntity();
        if (player == null || player.level == null || player.level.isClientSide()) return;
        let now = player.level.getTime();
        let cooldownUntil = player.getPersistentData().getLong(VANILLA_CRIT_COOLDOWN_KEY);
        if (now < cooldownUntil) event.setResult(ForgeEventResult.DENY);
    } catch (e) {
        console.log('[ParticleJS] 原版跳劈冷却判定出错: ' + e);
        console.log(e);
    }
});

// MoreCallback 的跳劈事件用于确认暴击未被抑制，并启动 3 秒冷却。
ForgeEvents.onEvent('com.morecallback.event.VanillaCriticalHitEvent', event => {
    try {
        if (event.isSuppressed()) return;
        let player = event.getPlayer();
        if (player == null || player.level == null || player.level.isClientSide()) return;
        player.getPersistentData().putLong(VANILLA_CRIT_COOLDOWN_KEY, player.level.getTime() + VANILLA_CRIT_COOLDOWN_TICKS);
        global.sendParticleTextInFront(player, '重击！', 0xFFAA00);
    } catch (e) {
        console.log('[ParticleJS] 原版重击文本粒子出错: ' + e);
        console.log(e);
    }
});
