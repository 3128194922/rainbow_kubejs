// 神射手护符：记录 Forge 弹幕的准确落点，仅在爆头后按射手距离计算伤害倍率。
const SHARPSHOOTER_CHARM_ID = 'rainbow:sharpshooter_charm';
const SHARPSHOOTER_HEAD_HALF_HEIGHT = 0.25;
const SHARPSHOOTER_IMPACT_TARGET = 'RainbowSharpshooterImpactTarget';
const SHARPSHOOTER_IMPACT_TICK = 'RainbowSharpshooterImpactTick';
const SHARPSHOOTER_IMPACT_Y = 'RainbowSharpshooterImpactY';

// Forge 对原版弹幕发布 ProjectileImpactEvent；自定义弹幕未发布时由伤害入口回退求交。
ForgeEvents.onEvent('net.minecraftforge.event.entity.ProjectileImpactEvent', event => {
    try {
        let projectile = event.getProjectile();
        if (projectile == null || projectile.level == null || projectile.level.isClientSide()) return;
        let hit = event.getRayTraceResult();
        if (hit == null || String(hit.getType()) != 'ENTITY') return;
        let target = hit.getEntity();
        if (target == null) return;

        // 原版 AbstractArrow 的 EntityHitResult 位置是目标脚下，必须重新求箭轨迹的入射点。
        let point = projectile instanceof AbstractArrow
            ? getSharpshooterArrowImpactPoint(projectile, target)
            : hit.getLocation();
        if (point == null) return;
        let data = projectile.getPersistentData();
        data.putString(SHARPSHOOTER_IMPACT_TARGET, String(target.getUuid()));
        data.putLong(SHARPSHOOTER_IMPACT_TICK, projectile.level.getTime());
        // Vec3 的 y 字段与 y() 方法同名；Rhino 必须显式调用方法才得到 double。
        data.putDouble(SHARPSHOOTER_IMPACT_Y, point.y());
    } catch (e) {
        console.log('[神射手护符] 记录弹幕落点失败: ' + e);
    }
});

// 对齐原版箭当前 tick 的检测线段；0.3 格扩展与 ProjectileUtil 的箭实体检测一致。
function getSharpshooterArrowImpactPoint(projectile, target) {
    let box = target.getBoundingBox();
    let velocity = projectile.getDeltaMovement();
    if (box == null || velocity == null) return null;
    let start = new Vec3(projectile.getX(), projectile.getY(), projectile.getZ());
    let end = new Vec3(start.x() + velocity.x(), start.y() + velocity.y(), start.z() + velocity.z());
    if (box.contains(start)) return start;
    let point = box.clip(start, end).orElse(null);
    if (point == null) point = box.inflate(0.3).clip(start, end).orElse(null);
    return point;
}

// TACZ 默认头部区域：目标眼睛高度上下各 0.25 格。
function isSharpshooterHeadHeight(target, worldY) {
    let relativeY = worldY - target.getY();
    let eyeHeight = target.getEyeHeight();
    return relativeY > eyeHeight - SHARPSHOOTER_HEAD_HALF_HEIGHT
        && relativeY < eyeHeight + SHARPSHOOTER_HEAD_HALF_HEIGHT;
}

// 优先使用 Forge 命中点；返回 null 表示本次没有可用命中记录，可尝试轨迹回退。
function getSharpshooterImpactHeadshot(projectile, target) {
    let data = projectile.getPersistentData();
    if (data.getString(SHARPSHOOTER_IMPACT_TARGET) != String(target.getUuid())) return null;
    let age = projectile.level.getTime() - data.getLong(SHARPSHOOTER_IMPACT_TICK);
    if (age != 0) return null;
    return isSharpshooterHeadHeight(target, data.getDouble(SHARPSHOOTER_IMPACT_Y));
}

// 对未发布 Forge 命中事件的弹幕，用当前位置和速度构成的两段轨迹求实体入射点。
function getSharpshooterTrajectoryHeadshot(projectile, target) {
    let box = target.getBoundingBox();
    let velocity = projectile.getDeltaMovement();
    if (box == null || velocity == null) return false;
    let position = new Vec3(projectile.getX(), projectile.getY(), projectile.getZ());
    // Vec3 的 x/y/z 直接属性在 Rhino 中可能是 FieldAndMethods，统一取方法返回值。
    let next = new Vec3(position.x() + velocity.x(), position.y() + velocity.y(), position.z() + velocity.z());
    let previous = new Vec3(position.x() - velocity.x(), position.y() - velocity.y(), position.z() - velocity.z());
    // 弹幕若已进入碰撞箱，优先取上一段的入射点，避免把穿出点误判成头部。
    let point = box.clip(previous, position).orElse(null);
    if (point == null && box.contains(position)) point = position;
    if (point == null) point = box.clip(position, next).orElse(null);
    return point != null && isSharpshooterHeadHeight(target, point.y());
}

// LivingHurtEvent 调用：只有可追溯弹幕爆头，才获得按射手距离计算的伤害倍率。
function applySharpshooterDamage(event, attacker, victim, source, context) {
    try {
        if (event == null || victim == null || source == null || !victim.isAlive()) return;
        let projectile = source.immediate;
        let isProjectile = projectile != null && projectile instanceof Projectile;
        if (!isProjectile && projectile != null && source.is(DamageTypeTags.IS_PROJECTILE)) {
            isProjectile = true;
        }

        let shooter = attacker;
        if (shooter == null && isProjectile && projectile.getOwner != null) shooter = projectile.getOwner();
        if (shooter == null || !shooter.isPlayer()) return;
        let equipped = context != null && context.attacker == shooter
            ? hasContextCurio(context, 'attacker', shooter, SHARPSHOOTER_CHARM_ID)
            : hasCurios(shooter, SHARPSHOOTER_CHARM_ID);
        if (!equipped) return;

        if (!isProjectile || projectile == shooter) return;

        let headshot = getSharpshooterImpactHeadshot(projectile, victim);
        if (headshot == null) headshot = getSharpshooterTrajectoryHeadshot(projectile, victim);
        if (!headshot) return;

        // 爆头倍率 = 1 + min(射手与目标距离, 20 格) × 10%，最高 3 倍。
        let dx = shooter.getX() - victim.getX();
        let dy = shooter.getY() - victim.getY();
        let dz = shooter.getZ() - victim.getZ();
        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let distanceMultiplier = 1 + Math.min(distance, 20) * 0.1;
        event.setAmount(event.getAmount() * distanceMultiplier);
        // 复用已有 ParticleJS 文本粒子接口，在目标眼睛上方显示红色爆头反馈。
        if (global.sendParticleText != null) {
            global.sendParticleText(victim, victim.getX(), victim.getEyeY() + 0.35, victim.getZ(), '爆头！', 0xFF0000, true, 0x330000);
        }
    } catch (e) {
        console.log('[神射手护符] 结算爆头伤害失败: ' + e);
    }
}
