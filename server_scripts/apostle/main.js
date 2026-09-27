// 使徒只在服务端选择目标、导航和生成弹幕，避免客户端重复造成伤害。
const APOSTLE_ID = 'rainbow:apostle';
const APOSTLE_BULLET_ID = 'rainbow:apostle_bullet';
const APOSTLE_TARGET_RANGE = 32.0;
const APOSTLE_MIN_RANGE = 12.0;
const APOSTLE_MAX_RANGE = 20.0;
const APOSTLE_BULLET_DAMAGE = 2.0;
const APOSTLE_BULLET_LIFETIME = 60;
const APOSTLE_ATTACK_INTERVAL = 20;
const APOSTLE_DELAY_TICKS = 10;
const APOSTLE_PI = 3.141592653589793;

// 通过注册表解析实体 ID，避免依赖 EntityType.toString() 的实现细节。
function apostleGetEntityId(entity) {
    try {
        if (entity == null) return '';
        const key = ForgeRegistries.ENTITY_TYPES.getKey(entity.getType());
        return key == null ? '' : key.toString();
    } catch (e) {
        console.log('[使徒] 实体 ID 读取异常: ' + e);
        return '';
    }
}

// 玩家与 Monster 类怪物为敌对目标；使徒彼此不会互相攻击或被弹幕误伤。
global.apostleIsValidTarget = function (target) {
    try {
        if (target == null || !target.isAlive()) return false;
        if (apostleGetEntityId(target) == APOSTLE_ID) return false;

        if (target instanceof Player) {
            return !target.isSpectator() && !target.isCreative();
        }
        return target instanceof Monster;
    } catch (e) {
        console.log('[使徒] 目标有效性检查异常: ' + e);
        return false;
    }
};

// 从使徒周围的实体中挑选最近的玩家或敌对怪物。
function apostleFindTarget(entity) {
    try {
        const level = entity.getLevel();
        const x = entity.getX();
        const y = entity.getY();
        const z = entity.getZ();
        const range = APOSTLE_TARGET_RANGE;
        const box = new AABB(x - range, y - range, z - range, x + range, y + range, z + range);
        const entities = level.getEntitiesWithin(box);
        let nearest = null;
        let nearestDistance = range * range;

        for (let i = 0; i < entities.length; i++) {
            const candidate = entities[i];
            if (candidate == null || candidate.getId() == entity.getId()) continue;
            if (!global.apostleIsValidTarget(candidate)) continue;

            const distance = entity.distanceToSqr(candidate);
            if (distance < nearestDistance) {
                nearest = candidate;
                nearestDistance = distance;
            }
        }
        return nearest;
    } catch (e) {
        console.log('[使徒] 寻敌异常: ' + e);
        return null;
    }
}

// 把使徒放回以目标为中心的安全环带，环带内沿切线绕行。
function apostleUpdateSpacing(entity, target, age) {
    try {
        const dx = entity.getX() - target.getX();
        const dz = entity.getZ() - target.getZ();
        let length = Math.sqrt(dx * dx + dz * dz);
        let radialX = 0.0;
        let radialZ = 1.0;

        if (length > 0.001) {
            radialX = dx / length;
            radialZ = dz / length;
        } else {
            const radians = entity.getYRot() * APOSTLE_PI / 180.0;
            radialX = Math.sin(radians);
            radialZ = Math.cos(radians);
        }

        let destinationRadius = 16.0;
        let tangentDistance = 0.0;
        if (length < APOSTLE_MIN_RANGE) {
            destinationRadius = 15.0;
        } else if (length > APOSTLE_MAX_RANGE) {
            destinationRadius = 16.0;
        } else {
            tangentDistance = Math.floor(age / 40) % 2 == 0 ? 4.0 : -4.0;
        }

        const tangentX = -radialZ;
        const tangentZ = radialX;
        const destinationX = target.getX() + radialX * destinationRadius + tangentX * tangentDistance;
        const destinationZ = target.getZ() + radialZ * destinationRadius + tangentZ * tangentDistance;
        const destinationY = target.getY();
        entity.getNavigation().moveTo(destinationX, destinationY, destinationZ, 1.05);
    } catch (e) {
        console.log('[使徒] 距离控制异常: ' + e);
    }
}

// 在指定位置创建归属明确的弹珠，初速度由 ThrowableItemProjectile.shoot 设置。
function apostleCreateBullet(owner, x, y, z, directionX, directionY, directionZ, speed, delay) {
    try {
        const level = owner.getLevel();
        if (level.isClientSide()) return null;

        const projectile = level.createEntity(APOSTLE_BULLET_ID);
        if (projectile == null) return null;
        projectile.setPos(x, y, z);
        projectile.setOwner(owner);
        projectile.setItem(Item.of(APOSTLE_BULLET_ID));
        projectile.setNoGravity(true);
        projectile.getPersistentData().putLong('apostleLife', 0);
        projectile.getPersistentData().putLong('apostleDelay', delay);

        if (delay <= 0) {
            projectile.shoot(directionX, directionY, directionZ, speed, 0.0);
        }
        projectile.spawn();
        return projectile;
    } catch (e) {
        console.log('[使徒] 创建弹珠异常: ' + e);
        return null;
    }
}

// Remilia 风格的定向扇形弹：固定五发，逐发旋转形成可读弹幕空隙。
function apostleShootFan(entity, target) {
    try {
        const originX = entity.getX();
        const originY = entity.getY() + entity.getBbHeight() * 0.72;
        const originZ = entity.getZ();
        let dx = target.getX() - originX;
        let dy = target.getY() + target.getBbHeight() * 0.5 - originY;
        let dz = target.getZ() - originZ;
        let length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length < 0.001) return;

        dx /= length;
        dy /= length;
        dz /= length;
        const radiansPerDegree = 0.017453292519943295;
        const angles = [-30.0, -15.0, 0.0, 15.0, 30.0];
        for (let i = 0; i < angles.length; i++) {
            const angle = angles[i] * radiansPerDegree;
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            const shotX = dx * cosine - dz * sine;
            const shotZ = dx * sine + dz * cosine;
            apostleCreateBullet(entity, originX, originY, originZ, shotX, dy, shotZ, 1.05, 0);
        }
    } catch (e) {
        console.log('[使徒] 扇形弹幕异常: ' + e);
    }
}

// Kisin 风格的延迟瞄准弹：弹珠在使徒前短暂停留，再按目标当前坐标发射。
function apostleScheduleAimedShot(entity, target) {
    try {
        const originX = entity.getX();
        const originY = entity.getY() + entity.getBbHeight() * 0.72;
        const originZ = entity.getZ();
        const dx = target.getX() - originX;
        const dy = target.getY() + target.getBbHeight() * 0.5 - originY;
        const dz = target.getZ() - originZ;
        entity.getLevel().spawnParticles(
            'minecraft:end_rod', true,
            target.getX(), target.getY() + target.getBbHeight() * 0.5, target.getZ(),
            6, 0.18, 0.18, 0.18, 0.01
        );
        apostleCreateBullet(entity, originX, originY, originZ, dx, dy, dz, 1.1, APOSTLE_DELAY_TICKS);
    } catch (e) {
        console.log('[使徒] 延迟瞄准弹异常: ' + e);
    }
}

// 每颗弹珠独立累计生命周期；延迟弹到时再读取使徒当前目标并发射。
global.apostleBulletTick = function (projectile) {
    try {
        const level = projectile.getLevel();
        if (level.isClientSide()) return;
        const data = projectile.getPersistentData();
        const age = data.getLong('apostleLife') + 1;
        data.putLong('apostleLife', age);
        if (age >= APOSTLE_BULLET_LIFETIME) {
            projectile.discard();
            return;
        }

        const delay = data.getLong('apostleDelay');
        if (delay <= 0) return;
        if (delay > 1) {
            data.putLong('apostleDelay', delay - 1);
            return;
        }

        data.putLong('apostleDelay', 0);
        const owner = projectile.getOwner();
        if (owner == null || !owner.isAlive() || apostleGetEntityId(owner) != APOSTLE_ID) {
            projectile.discard();
            return;
        }
        const target = owner.getTarget();
        if (!global.apostleIsValidTarget(target)) {
            projectile.discard();
            return;
        }

        let dx = target.getX() - projectile.getX();
        let dy = target.getY() + target.getBbHeight() * 0.5 - projectile.getY();
        let dz = target.getZ() - projectile.getZ();
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < 0.001) {
            projectile.discard();
            return;
        }
        dx /= distance;
        dy /= distance;
        dz /= distance;
        projectile.shoot(dx, dy, dz, 1.1, 0.0);
    } catch (e) {
        console.log('[使徒] 弹珠生命周期异常: ' + e);
    }
};

// 命中时再次检查目标与主人，只有有效敌方目标受到两点伤害。
global.apostleProjectileHit = function (projectile, target) {
    try {
        const level = projectile.getLevel();
        if (level.isClientSide()) return;
        const owner = projectile.getOwner();
        if (owner == null || !owner.isAlive() || apostleGetEntityId(owner) != APOSTLE_ID) {
            projectile.discard();
            return;
        }
        if (target != null && target.getId() != owner.getId() && global.apostleIsValidTarget(target)) {
            const source = projectile.damageSources().thrown(projectile, owner);
            target.hurt(source, APOSTLE_BULLET_DAMAGE);
        }
        projectile.discard();
    } catch (e) {
        console.log('[使徒] 弹珠伤害结算异常: ' + e);
    }
};

// 使徒主 AI 入口：每十 tick 更新目标和站位，每秒切换一次弹幕招式。
global.apostleTick = function (entity) {
    try {
        const level = entity.getLevel();
        if (level.isClientSide()) return;
        const data = entity.getPersistentData();
        const age = data.getLong('apostleAge') + 1;
        data.putLong('apostleAge', age);

        if (age % 10 != 0) return;
        const target = apostleFindTarget(entity);
        if (target == null) {
            entity.setTarget(null);
            entity.getNavigation().stop();
            return;
        }

        entity.setTarget(target);
        apostleUpdateSpacing(entity, target, age);
        if (age % APOSTLE_ATTACK_INTERVAL == 0) {
            const attackIndex = Math.floor(age / APOSTLE_ATTACK_INTERVAL);
            if (attackIndex % 2 == 0) apostleShootFan(entity, target);
            else apostleScheduleAimedShot(entity, target);
        }
    } catch (e) {
        console.log('[使徒] 主 AI 异常: ' + e);
    }
};
