// priority: 4000
// ==========================================
// ParticleJS 文本粒子与通用文字反馈
// ==========================================

const DAMAGE_INDICATOR_PARTICLE = 'rainbow:damage_indicator_text';
const KATANA_HIT_CUT_PARTICLE = 'rainbow:katana_hit_cut';

// 伤害来源分类：用于保留现有伤害数字的颜色规则。
const PHYSICAL_DAMAGE_TYPES = [
    'player_attack', 'mob_attack', 'mob_attack_no_player', 'arrow', 'trident',
    'thrown', 'indirect_thrown', 'fireworks', 'explosion', 'explosion.player',
    'fall', 'fly_into_wall', 'falling_anvil', 'falling_block', 'falling_stalactite'
];
const MAGIC_DAMAGE_TYPES = [
    'magic', 'indirectMagic', 'indirect_magic', 'dragon_breath',
    'wither', 'wither_skull', 'freeze', 'sting'
];
const TRUE_DAMAGE_TYPES = [
    'out_of_world', 'generic', 'bad_respawn_point', 'starve', 'dry_out', 'sonic_boom'
];
const MELEE_DAMAGE_TYPES = [
    'player_attack', 'mob_attack', 'mob_attack_no_player'
];

// ParticleJS 文本粒子：伤害数字和免伤反馈共用同一个动态文本类型。
StartupEvents.registry('particle_type', event => {
    try {
        event.create(DAMAGE_INDICATOR_PARTICLE, 'particlejs')
            ["text(java.lang.String)"]('')
            .renderType('text')
            .lifetime(15, 19)
            .scale(1.0)
            .gravity(1.3)
            .textOutline(true);

        // 武士刀命中切割动画，复用 EEEAB 生物的六帧贴图。
        event.create(KATANA_HIT_CUT_PARTICLE, 'particlejs')
            ["texture(net.minecraft.resources.ResourceLocation)"](new ResourceLocation('eeeabsmobs', 'hit_cut_1'))
            .animation(6, 1, false, 1)
            .lifetime(5)
            .renderType('lit');
    } catch (e) {
        console.log('[ParticleJS] 注册文本/武士刀粒子出错: ' + e);
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
            textColor: color == null ? 0xFFFFFF : color,
            textOutlineColor: outlineColor == null ? 0x333333 : outlineColor,
            textOutline: outline == null ? true : outline
        });
        return true;
    } catch (e) {
        console.log('[ParticleJS] 发送文本粒子出错: ' + e);
        console.log(e);
        return false;
    }
}

// 服务端通用文字粒子 API，供 startup_scripts 与 server_scripts 共用。
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

function spawnDamageIndicator(entity, difference, source) {
    try {
        if (entity == null || entity.level == null || difference == null) return false;
        let amount = Math.abs(Number(difference));
        if (!isFinite(amount)) return false;

        let damageType = getDamageType(source);
        let textColor = 0xFF0000;
        let outlineColor = 0x330000;
        if (TRUE_DAMAGE_TYPES.indexOf(damageType) >= 0) {
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
        return sendTextParticle(entity.level, x, y, z, (Math.round(amount * 10 + 0.5) / 10).toFixed(1), textColor, true, outlineColor);
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

        // 武士刀格挡文字直接复用 ParticleJS 文本粒子，避免依赖已删除的旧文本 API。
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

// morecallback 战斗事件反馈：神化暴击、神化闪避、原版跳劈统一使用 KubeJS ParticleJS 文本粒子。
ForgeEvents.onEvent('com.morecallback.event.ApothicCriticalHitEvent', event => {
    try {
        let attacker = event.getAttacker();
        if (attacker == null || attacker.level == null || attacker.level.isClientSide()) return;
        global.sendParticleTextInFront(attacker, '暴击！', 0xFF3333);
    } catch (e) {
        console.log('[ParticleJS] 神化暴击文本粒子出错: ' + e);
        console.log(e);
    }
});

ForgeEvents.onEvent('com.morecallback.event.ApothicDodgeEvent', event => {
    try {
        let target = event.getTarget();
        if (target == null || target.level == null || target.level.isClientSide()) return;
        global.sendParticleTextInFront(target, '闪避！', 0x55FFFF);
    } catch (e) {
        console.log('[ParticleJS] 神化闪避文本粒子出错: ' + e);
        console.log(e);
    }
});

ForgeEvents.onEvent('com.morecallback.event.VanillaCriticalHitEvent', event => {
    try {
        if (event.isSuppressed()) return;
        let player = event.getPlayer();
        if (player == null || player.level == null || player.level.isClientSide()) return;
        global.sendParticleTextInFront(player, '跳劈！', 0xFFAA00);
    } catch (e) {
        console.log('[ParticleJS] 原版跳劈文本粒子出错: ' + e);
        console.log(e);
    }
});
