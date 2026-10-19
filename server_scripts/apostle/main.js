// 使徒只在服务端运行：目标选择、距离控制与 13 式弹幕招式全部由 persistentData 状态机驱动（idle/casting）；伤害统一走 KubeJS Entity.attack 包装。
// 行为逻辑设计见 docs/行为逻辑.md：权重随机轮换 + 大招冷却/保底 + 狂暴阶段；函数内临时变量统一使用 let，规避 Rhino tick 回调重复声明。
const APOSTLE_ID = 'rainbow:apostle';
const APOSTLE_BULLET_ID = 'rainbow:apostle_bullet';
const APOSTLE_TARGET_RANGE = 32.0;
const APOSTLE_MIN_RANGE = 12.0;
const APOSTLE_MAX_RANGE = 20.0;
const APOSTLE_BULLET_DAMAGE = 2.0;
const APOSTLE_BULLET_LIFETIME = 60;
const APOSTLE_PI = 3.141592653589793;
const APOSTLE_DEG = 0.017453292519943295; // 角度转弧度常量

// 招式体系常量（对应 docs/行为逻辑.md 招式表）：招式持续 tick、随机权重、大招冷却与狂暴参数。
// 招式编号：1连射 2扇形 3圆环 4旋转门 5引雷 6弹幕墙 7双臂螺旋 8弹幕雨 9冲刺 10落地冲击波 11激光 12地面危险区 13召唤
const APOSTLE_MOVE_DURATION = { 1: 42, 2: 10, 3: 10, 4: 80, 5: 30, 6: 40, 7: 70, 8: 50, 9: 36, 10: 36, 11: 60, 12: 26, 13: 16 };
const APOSTLE_MOVE_WEIGHT = { 1: 30, 2: 25, 3: 8, 4: 6, 5: 5, 6: 14, 7: 6, 8: 12, 9: 12, 10: 10, 11: 5, 12: 10 };
const APOSTLE_MOVE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const APOSTLE_ULTIMATE_IDS = [4, 5, 7, 11];
const APOSTLE_ULTIMATE_COOLDOWN = 200;   // 大招冷却 10s
const APOSTLE_IDLE_GAP = 30;             // 常规招式间隔 1.5s
const APOSTLE_ENRAGE_GAP = 16;           // 狂暴招式间隔 0.8s
const APOSTLE_ENRAGE_COOLDOWN = 100;     // 狂暴大招冷却 5s
const APOSTLE_ENRAGE_BULLET_MUL = 1.25;  // 狂暴弹速倍率

// 通过注册表解析实体 ID，避免依赖 EntityType.toString() 的实现细节。
function apostleGetEntityId(entity) {
    try {
        if (entity == null) return '';
        let key = ForgeRegistries.ENTITY_TYPES.getKey(entity.getType());
        return key == null ? '' : key.toString();
    } catch (e) {
        console.log('[使徒] 实体 ID 读取异常: ' + e);
        return '';
    }
}

// 玩家与 Monster 类怪物为敌对目标；使徒彼此、使徒阵营召唤物（apostleFaction 标记）不会互相攻击或被弹幕误伤。
global.apostleIsValidTarget = function (target) {
    try {
        if (target == null || !target.isAlive()) return false;
        if (apostleGetEntityId(target) == APOSTLE_ID) return false;
        if (target.getPersistentData().getLong('apostleFaction') == 1) return false;

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
        let apostleLevel = entity.getLevel();
        let x = entity.getX();
        let y = entity.getY();
        let z = entity.getZ();
        let range = APOSTLE_TARGET_RANGE;
        let box = new AABB(x - range, y - range, z - range, x + range, y + range, z + range);
        let entities = apostleLevel.getEntitiesWithin(box);
        let nearest = null;
        let nearestDistance = range * range;

        for (let i = 0; i < entities.length; i++) {
            let candidate = entities[i];
            if (candidate == null || candidate.getId() == entity.getId()) continue;
            if (!global.apostleIsValidTarget(candidate)) continue;

            let distance = entity.distanceToSqr(candidate);
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

// 通过本项目已用过的 LookControl API 对准目标；Rhino 的 MobEntityJS 包装不保证公开旋转字段或 setter。
function apostleFaceTarget(entity, target) {
    try {
        if (entity == null || target == null) return;
        entity.getLookControl().setLookAt(
            target.getX(),
            target.getY() + target.getBbHeight() * 0.5,
            target.getZ()
        );
    } catch (e) {
        console.log('[使徒] 朝向目标异常: ' + e);
    }
}

// 用 Minecraft 朝向控制接口沿给定水平向量转身，供旋转门和螺旋招式共用。
function apostleFaceDirection(entity, directionX, directionZ) {
    try {
        entity.getLookControl().setLookAt(
            entity.getX() + directionX,
            entity.getY() + entity.getBbHeight() * 0.5,
            entity.getZ() + directionZ
        );
    } catch (e) {
        console.log('[使徒] 朝向弹幕方向异常: ' + e);
    }
}

// 把使徒放回以目标为中心的安全环带，环带内沿切线绕行；狂暴时追走速度提升。
function apostleUpdateSpacing(entity, target, age) {
    try {
        let dx = entity.getX() - target.getX();
        let dz = entity.getZ() - target.getZ();
        let length = Math.sqrt(dx * dx + dz * dz);
        let radialX = 0.0;
        let radialZ = 1.0;

        if (length > 0.001) {
            radialX = dx / length;
            radialZ = dz / length;
        } else {
            let radians = entity.getYRot() * APOSTLE_DEG;
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

        let tangentX = -radialZ;
        let tangentZ = radialX;
        let destinationX = target.getX() + radialX * destinationRadius + tangentX * tangentDistance;
        let destinationZ = target.getZ() + radialZ * destinationRadius + tangentZ * tangentDistance;
        let destinationY = target.getY();
        let chaseSpeed = entity.getPersistentData().getLong('apostleEnrage') == 1 ? 1.3 : 1.05;
        entity.getNavigation().moveTo(destinationX, destinationY, destinationZ, chaseSpeed);
    } catch (e) {
        console.log('[使徒] 距离控制异常: ' + e);
    }
}

// 在指定位置创建归属明确的弹珠；damage/rain/maxLife 为可选参数（默认伤害 2、非弹幕雨、寿命 60）。
// rain=1 时存储下落方向，由弹珠 tick 逐 tick 提速模拟重力加速；delay>0 时延迟到时再按目标位置发射。
function apostleCreateBullet(owner, x, y, z, directionX, directionY, directionZ, speed, delay, damage, rain, maxLife) {
    try {
        if (damage == null) damage = APOSTLE_BULLET_DAMAGE;
        if (rain == null) rain = 0;
        if (maxLife == null) maxLife = APOSTLE_BULLET_LIFETIME;
        let apostleLevel = owner.getLevel();
        if (apostleLevel.isClientSide()) return null;

        let projectile = apostleLevel.createEntity(APOSTLE_BULLET_ID);
        if (projectile == null) return null;
        projectile.setPos(x, y, z);
        projectile.setOwner(owner);
        projectile.setItem(Item.of(APOSTLE_BULLET_ID));
        projectile.setNoGravity(true);
        projectile.getPersistentData().putLong('apostleLife', 0);
        projectile.getPersistentData().putLong('apostleDelay', delay);
        projectile.getPersistentData().putDouble('apostleDamage', damage);
        projectile.getPersistentData().putLong('apostleRain', rain);
        projectile.getPersistentData().putLong('apostleMaxLife', maxLife);

        if (rain == 1) {
            // 弹幕雨弹珠归一化并存储下落方向，弹珠 tick 内按已飞行时间重设速度。
            let len = Math.sqrt(directionX * directionX + directionY * directionY + directionZ * directionZ);
            if (len < 0.001) {
                directionX = 0.0;
                directionY = -1.0;
                directionZ = 0.0;
                len = 1.0;
            }
            projectile.getPersistentData().putDouble('apostleDirX', directionX / len);
            projectile.getPersistentData().putDouble('apostleDirY', directionY / len);
            projectile.getPersistentData().putDouble('apostleDirZ', directionZ / len);
        }

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

// 计算使徒胸口到目标胸口的单位方向；返回 [dx, dy, dz, 起点x, 起点y, 起点z]，无效返回 null。
function apostleAimData(entity, target) {
    try {
        if (!global.apostleIsValidTarget(target)) return null;
        let originX = entity.getX();
        let originY = entity.getY() + entity.getBbHeight() * 0.72;
        let originZ = entity.getZ();
        let dx = target.getX() - originX;
        let dy = target.getY() + target.getBbHeight() * 0.5 - originY;
        let dz = target.getZ() - originZ;
        let length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length < 0.001) return null;
        return [dx / length, dy / length, dz / length, originX, originY, originZ];
    } catch (e) {
        console.log('[使徒] 瞄准计算异常: ' + e);
        return null;
    }
}

// 狂暴时弹幕速度提升 25%。
function apostleSpeedMul(data) {
    return data.getLong('apostleEnrage') == 1 ? APOSTLE_ENRAGE_BULLET_MUL : 1.0;
}

// 将角度差归一化到 [-180, 180]，供激光缓慢转向追踪使用。
function apostleAngleDiff(from, to) {
    let diff = (to - from) % 360.0;
    if (diff > 180.0) diff -= 360.0;
    if (diff < -180.0) diff += 360.0;
    return diff;
}

// 在 0..6 中随机取 gapCount 个不重复缺口下标（弹幕墙用）。
function apostlePickGaps(gapCount) {
    let gaps = [];
    try {
        let guard = 0;
        while (gaps.length < gapCount && guard < 50) {
            guard++;
            let gap = Math.floor(Math.random() * 7);
            let duplicated = false;
            for (let i = 0; i < gaps.length; i++) {
                if (gaps[i] == gap) duplicated = true;
            }
            if (!duplicated) gaps.push(gap);
        }
    } catch (e) {
        console.log('[使徒] 缺口选取异常: ' + e);
    }
    return gaps;
}

// 读取实体 UUID（Dyeing 油漆层绑定用），失败返回 null。
function apostleUuid(entity) {
    try {
        return entity.getUUID().toString();
    } catch (e) {
        return null;
    }
}

// Dyeing 一次性世界坐标特效封装；Dyeing 未安装或异常时静默跳过，不影响战斗逻辑。
function apostleFx(level, options) {
    try {
        if (typeof Dyeing == 'undefined' || Dyeing == null) return;
        Dyeing.spawnFx(level, options);
    } catch (e) {
        console.log('[使徒] Dyeing 特效异常: ' + e);
    }
}

// 使用 Dyeing 的世界动画几何体显示预警，按实体 UUID 区分实例并设置服务端清理计时。
function apostleWarningModel(level, entity, variant, warningId, x, y, z, scale, yaw, duration) {
    try {
        if (typeof Dyeing == 'undefined' || Dyeing == null) return;
        let uuid = apostleUuid(entity);
        if (uuid == null) return;
        let id = 'apostle_' + uuid.replace(/-/g, '') + '_' + warningId;
        Dyeing.addAnimatedModel(level, id, {
            target: 'world', dimension: level.dimension().location().toString(),
            x: x, y: y, z: z,
            model: 'rainbow:apostle_warning',
            animation: 'animation.apostle.warning_' + variant,
            duration_ticks: duration, speed: 1.0, play_count: -1,
            end_action: 'end', scale: scale, yaw: yaw
        });
        Dyeing.setTimer(level, 'animated', '', id, duration);
    } catch (e) {
        console.log('[使徒] Dyeing 预警渲染异常: ' + e);
    }
}

// 给实体叠加静态油漆层（预警/狂暴视觉），失败只记日志。
function apostlePaintAdd(level, entity, id, color) {
    try {
        if (typeof Dyeing == 'undefined' || Dyeing == null) return;
        let uuid = apostleUuid(entity);
        if (uuid == null) return;
        Dyeing.paint(level, uuid, { id: id, type: 'static', color: color, scale: 1.0 });
    } catch (e) {
        console.log('[使徒] Dyeing 油漆添加异常: ' + e);
    }
}

// 移除实体指定油漆层。
function apostlePaintRemove(level, entity, id) {
    try {
        if (typeof Dyeing == 'undefined' || Dyeing == null) return;
        let uuid = apostleUuid(entity);
        if (uuid == null) return;
        Dyeing.removePaint(level, uuid, id);
    } catch (e) {
        console.log('[使徒] Dyeing 油漆移除异常: ' + e);
    }
}

// 落雷预警：Dyeing 发光柱与小范围落点环带，限时自动清除。
function apostleLightningWarn(level, entity, index, x, y, z) {
    apostleWarningModel(level, entity, 'column', 'lightning_' + index + '_column', x, y + 0.02, z, 1.0, 0.0, 22);
    apostleWarningModel(level, entity, 'ring', 'lightning_' + index + '_ring', x, y + 0.03, z, 1.0, 0.0, 22);
}

// 地面范围预警：Dyeing 环带模型按 radius 缩放，替代高数量粒子圆环。
function apostleGroundWarn(level, entity, warningId, x, y, z, radius, duration) {
    apostleWarningModel(level, entity, 'ring', warningId, x, y + 0.03, z, radius / 2.0, 0.0, duration);
}

// 用 Dyeing 几何光束沿当前角度显示激光预警与持续光路，beam 模型长度为 16 格。
function apostleLaserFx(entity, data, duration) {
    try {
        let ox = data.getDouble('apostleOrigX');
        let oy = data.getDouble('apostleOrigY');
        let oz = data.getDouble('apostleOrigZ');
        let radians = data.getDouble('apostleAngle') * APOSTLE_DEG;
        let dirX = Math.cos(radians);
        let dirZ = Math.sin(radians);
        let yaw = Math.atan2(dirX, dirZ) / APOSTLE_DEG;
        apostleWarningModel(entity.getLevel(), entity, 'beam', 'laser_beam', ox + dirX * 8.0, oy, oz + dirZ * 8.0, 1.0, yaw, duration);
    } catch (e) {
        console.log('[使徒] 激光特效异常: ' + e);
    }
}

// 对指定点水平半径内的有效目标用 KubeJS attack 包装结算伤害（垂直范围 ±vertical），来源由调用方给出。
function apostleDamageArea(entity, x, y, z, radius, vertical, amount, source) {
    try {
        let apostleLevel = entity.getLevel();
        let box = new AABB(x - radius, y - vertical, z - radius, x + radius, y + vertical, z + radius);
        let entities = apostleLevel.getEntitiesWithin(box);
        let targetCount = 0;
        for (let i = 0; i < entities.length; i++) {
            let target = entities[i];
            if (target == null || !global.apostleIsValidTarget(target)) continue;
            let dx = target.getX() - x;
            let dz = target.getZ() - z;
            if (dx * dx + dz * dz > radius * radius) continue;
            targetCount++;
            apostleApplyDamage(target, source, amount, '范围技能');
        }
        if (targetCount == 0) console.log('[使徒] 范围技能结算时没有有效目标，radius=' + radius + ', y=' + y);
    } catch (e) {
        console.log('[使徒] 范围伤害异常: ' + e);
    }
}

// 统一通过 KubeJS Entity.attack 结算伤害；记录拒伤与异常，区分技能未命中和伤害被拒绝。
function apostleApplyDamage(target, source, amount, attackName) {
    try {
        if (target == null || source == null) return false;
        let beforeHealth = target.getHealth();
        let applied = target.attack(source, amount);
        let afterHealth = target.getHealth();
        if (!applied || afterHealth >= beforeHealth) {
            console.log('[使徒] ' + attackName + '伤害未扣除生命值，target=' + apostleGetEntityId(target)
                + ', accepted=' + applied + ', before=' + beforeHealth + ', after=' + afterHealth + ', amount=' + amount);
        }
        return applied;
    } catch (e) {
        console.log('[使徒] ' + attackName + '伤害调用异常: ' + e);
        return false;
    }
}

// 激光光路伤害：沿光束方向 16 格、垂直距离 0.8 格、高度 ±1.5 格内的有效目标受 4 点伤害。
function apostleLaserDamage(entity, data) {
    try {
        let apostleLevel = entity.getLevel();
        let ox = data.getDouble('apostleOrigX');
        let oy = data.getDouble('apostleOrigY');
        let oz = data.getDouble('apostleOrigZ');
        let radians = data.getDouble('apostleAngle') * APOSTLE_DEG;
        let dirX = Math.cos(radians);
        let dirZ = Math.sin(radians);
        let perpX = -dirZ;
        let perpZ = dirX;
        let box = new AABB(ox - 18.0, oy - 4.0, oz - 18.0, ox + 18.0, oy + 4.0, oz + 18.0);
        let entities = apostleLevel.getEntitiesWithin(box);
        let targetCount = 0;
        for (let i = 0; i < entities.length; i++) {
            let target = entities[i];
            if (target == null || !global.apostleIsValidTarget(target)) continue;
            let relX = target.getX() - ox;
            let relZ = target.getZ() - oz;
            let along = relX * dirX + relZ * dirZ;
            if (along < 0.0 || along > 16.0) continue;
            let perp = relX * perpX + relZ * perpZ;
            if (perp < 0.0) perp = -perp;
            if (perp > 0.8) continue;
            let midY = target.getY() + target.getBbHeight() * 0.5;
            if (midY > oy + 1.5 || midY < oy - 1.5) continue;
            targetCount++;
            apostleApplyDamage(target, entity.damageSources().mobAttack(entity), 4.0, '激光');
        }
        if (targetCount == 0) console.log('[使徒] 激光结算时没有目标位于光路内');
    } catch (e) {
        console.log('[使徒] 激光伤害异常: ' + e);
    }
}

// Remilia 风格的定向扇形弹：常规五发留空隙；狂暴时九发加密（±40° 每 10° 一发）。
function apostleShootFan(entity, target) {
    try {
        let aim = apostleAimData(entity, target);
        if (aim == null) return;
        let data = entity.getPersistentData();
        let enrage = data.getLong('apostleEnrage') == 1;
        let angles = enrage
            ? [-40.0, -30.0, -20.0, -10.0, 0.0, 10.0, 20.0, 30.0, 40.0]
            : [-30.0, -15.0, 0.0, 15.0, 30.0];
        let speed = 1.05 * apostleSpeedMul(data);
        for (let i = 0; i < angles.length; i++) {
            let angle = angles[i] * APOSTLE_DEG;
            let cosine = Math.cos(angle);
            let sine = Math.sin(angle);
            let shotX = aim[0] * cosine - aim[2] * sine;
            let shotZ = aim[0] * sine + aim[2] * cosine;
            apostleCreateBullet(entity, aim[3], aim[4], aim[5], shotX, aim[1], shotZ, speed, 0, APOSTLE_BULLET_DAMAGE, 0, APOSTLE_BULLET_LIFETIME);
        }
    } catch (e) {
        console.log('[使徒] 扇形弹幕异常: ' + e);
    }
}

// 水平均分圆环弹幕；angleOffset 用于狂暴双环的错位排布。
function apostleFireRing(entity, ox, oy, oz, count, speed, angleOffset) {
    try {
        for (let i = 0; i < count; i++) {
            let radians = (i * 360.0 / count + angleOffset) * APOSTLE_DEG;
            apostleCreateBullet(entity, ox, oy, oz, Math.cos(radians), 0.0, Math.sin(radians), speed, 0, APOSTLE_BULLET_DAMAGE, 0, APOSTLE_BULLET_LIFETIME);
        }
    } catch (e) {
        console.log('[使徒] 圆环弹幕异常: ' + e);
    }
}

// 统计使徒阵营召唤物数量（apostleFaction 标记），异常时返回上限值阻断召唤。
function apostleCountFactionMobs(entity) {
    try {
        let apostleLevel = entity.getLevel();
        let range = APOSTLE_TARGET_RANGE;
        let box = new AABB(entity.getX() - range, entity.getY() - range, entity.getZ() - range, entity.getX() + range, entity.getY() + range, entity.getZ() + range);
        let entities = apostleLevel.getEntitiesWithin(box);
        let count = 0;
        for (let i = 0; i < entities.length; i++) {
            let candidate = entities[i];
            if (candidate == null || candidate.getId() == entity.getId()) continue;
            if (candidate.getPersistentData().getLong('apostleFaction') == 1) count++;
        }
        return count;
    } catch (e) {
        console.log('[使徒] 阵营计数异常: ' + e);
        return 99;
    }
}

// 招式1 连射（东方自机狙）：每 0.5s 向目标当前位置发射 1 发瞄准弹，共 5 发。
function apostleMoveRapid(entity, data, t) {
    try {
        if (t % 10 != 0 || t > 40) return;
        let aim = apostleAimData(entity, entity.getTarget());
        if (aim == null) return;
        apostleCreateBullet(entity, aim[3], aim[4], aim[5], aim[0], aim[1], aim[2], 1.1 * apostleSpeedMul(data), 0, APOSTLE_BULLET_DAMAGE, 0, APOSTLE_BULLET_LIFETIME);
    } catch (e) {
        console.log('[使徒] 连射异常: ' + e);
    }
}

// 招式2 扇形齐射：短促施法定身，实际弹道由 apostleShootFan 计算（含狂暴 9 发变体）。
function apostleMoveFan(entity, data, t) {
    try {
        if (t != 0) return;
        apostleShootFan(entity, entity.getTarget());
    } catch (e) {
        console.log('[使徒] 扇形招式异常: ' + e);
    }
}

// 招式3 圆环齐射：常规 36 发单层；狂暴 48 发双环（第二环低速且错位 7.5°，两环错时到达）。
function apostleMoveRing(entity, data, t) {
    try {
        if (t != 0) return;
        let ox = entity.getX();
        let oz = entity.getZ();
        let mul = apostleSpeedMul(data);
        if (data.getLong('apostleEnrage') == 1) {
            apostleFireRing(entity, ox, entity.getY() + 1.0, oz, 24, 0.9 * mul, 0.0);
            apostleFireRing(entity, ox, entity.getY() + 1.0, oz, 24, 0.7 * mul, 7.5);
        } else {
            apostleFireRing(entity, ox, entity.getY() + 1.0, oz, 36, 0.9 * mul, 0.0);
        }
    } catch (e) {
        console.log('[使徒] 圆环招式异常: ' + e);
    }
}

// 招式4 旋转门：东南西北四条正交弹臂（每臂每 6 tick 1 发）整体每 tick 旋转 2°，用 LookControl 对齐弹幕方向。
function apostleMoveDoor(entity, data, t) {
    try {
        let angle = data.getDouble('apostleAngle') + 2.0;
        data.putDouble('apostleAngle', angle);
        let facingRadians = angle * APOSTLE_DEG;
        apostleFaceDirection(entity, Math.cos(facingRadians), Math.sin(facingRadians));
        if (t % 6 != 0) return;
        let mul = apostleSpeedMul(data);
        let ox = entity.getX();
        let oy = entity.getY() + 1.0;
        let oz = entity.getZ();
        for (let k = 0; k < 4; k++) {
            let radians = (angle + k * 90.0) * APOSTLE_DEG;
            apostleCreateBullet(entity, ox, oy, oz, Math.cos(radians), 0.0, Math.sin(radians), 0.95 * mul, 0, APOSTLE_BULLET_DAMAGE, 0, APOSTLE_BULLET_LIFETIME);
        }
    } catch (e) {
        console.log('[使徒] 旋转门异常: ' + e);
    }
}

// 招式5 引雷：目标脚下及周围随机共 3 个落雷点，Dyeing 火焰柱预警 1s；20 tick 时降下视觉雷并结算 9 点范围伤害。
function apostleMoveLightning(entity, data, t) {
    try {
        let apostleLevel = entity.getLevel();
        if (t == 0) {
            let target = entity.getTarget();
            data.putDouble('apostleP1X', target.getX());
            data.putDouble('apostleP1Y', target.getY());
            data.putDouble('apostleP1Z', target.getZ());
            for (let p = 2; p <= 3; p++) {
                let angle = Math.random() * 360.0 * APOSTLE_DEG;
                let radius = 1.5 + Math.random() * 1.5;
                data.putDouble('apostleP' + p + 'X', target.getX() + Math.cos(angle) * radius);
                data.putDouble('apostleP' + p + 'Y', target.getY());
                data.putDouble('apostleP' + p + 'Z', target.getZ() + Math.sin(angle) * radius);
            }
        }
        if (t == 0 || t == 10) {
            for (let p = 1; p <= 3; p++) {
                apostleLightningWarn(apostleLevel, entity, p, data.getDouble('apostleP' + p + 'X'), data.getDouble('apostleP' + p + 'Y'), data.getDouble('apostleP' + p + 'Z'));
            }
        }
        if (t != 20) return;
        for (let p = 1; p <= 3; p++) {
            let px = data.getDouble('apostleP' + p + 'X');
            let py = data.getDouble('apostleP' + p + 'Y');
            let pz = data.getDouble('apostleP' + p + 'Z');
            let bolt = apostleLevel.createEntity('minecraft:lightning_bolt');
            if (bolt == null) continue;
            bolt.setPos(px, py, pz);
            let visualOnly = false;
            try {
                bolt.setVisualOnly(true); // 视觉雷不引燃方块，伤害由下方统一结算为 9 点
                visualOnly = true;
            } catch (e) {
                console.log('[使徒] 落雷视觉化失败（退化为原版落雷伤害）: ' + e);
            }
            bolt.spawn();
            if (visualOnly) {
                apostleDamageArea(entity, px, py, pz, 2.0, 3.0, 9.0, entity.damageSources().lightningBolt());
            }
        }
    } catch (e) {
        console.log('[使徒] 引雷异常: ' + e);
    }
}

// 招式6 弹幕墙+缺口：垂直于使徒→目标连线的一排 7 发弹幕（间距 1.6），随机留缺口；共 3 波（0/14/28 tick），每波重新瞄准与洗缺口；狂暴仅 1 个缺口。
function apostleMoveWall(entity, data, t) {
    try {
        if (t != 0 && t != 14 && t != 28) return;
        let target = entity.getTarget();
        let dx = target.getX() - entity.getX();
        let dz = target.getZ() - entity.getZ();
        let length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.001) return;
        dx /= length;
        dz /= length;
        let perpX = -dz;
        let perpZ = dx;
        let mul = apostleSpeedMul(data);
        let gapCount = data.getLong('apostleEnrage') == 1 ? 1 : 2;
        let gaps = apostlePickGaps(gapCount);
        let ox = entity.getX();
        let oy = entity.getY() + 1.2;
        let oz = entity.getZ();
        for (let i = 0; i < 7; i++) {
            let isGap = false;
            for (let g = 0; g < gaps.length; g++) {
                if (gaps[g] == i) isGap = true;
            }
            if (isGap) continue;
            let offset = (i - 3) * 1.6;
            apostleCreateBullet(entity, ox + perpX * offset, oy, oz + perpZ * offset, dx, 0.0, dz, 0.85 * mul, 0, APOSTLE_BULLET_DAMAGE, 0, 40);
        }
    } catch (e) {
        console.log('[使徒] 弹幕墙异常: ' + e);
    }
}

// 招式7 双臂螺旋：先把 Minecraft yaw 转换成弹幕平面角，两条相对弹臂每 tick 转 3°。
function apostleMoveSpiral(entity, data, t) {
    try {
        if (t == 0) {
            let facingRadians = entity.getYRot() * APOSTLE_DEG;
            data.putDouble('apostleAngle', Math.atan2(Math.cos(facingRadians), -Math.sin(facingRadians)) / APOSTLE_DEG);
        }
        let angle = data.getDouble('apostleAngle') + 3.0;
        data.putDouble('apostleAngle', angle);
        let facingRadians = angle * APOSTLE_DEG;
        apostleFaceDirection(entity, Math.cos(facingRadians), Math.sin(facingRadians));
        if (t % 3 != 0) return;
        let mul = apostleSpeedMul(data);
        let ox = entity.getX();
        let oy = entity.getY() + 0.9;
        let oz = entity.getZ();
        for (let k = 0; k < 2; k++) {
            let radians = (angle + k * 180.0) * APOSTLE_DEG;
            apostleCreateBullet(entity, ox, oy, oz, Math.cos(radians), 0.0, Math.sin(radians), 0.8 * mul, 0, APOSTLE_BULLET_DAMAGE, 0, APOSTLE_BULLET_LIFETIME);
        }
    } catch (e) {
        console.log('[使徒] 双臂螺旋异常: ' + e);
    }
}

// 招式8 弹幕雨：以目标为中心 8 格半径的区域上空每 5 tick 生成 6 颗下落弹珠（0.4 起速逐 tick 加速），持续 2.5s；地面火焰圆环预警。
function apostleMoveRain(entity, data, t) {
    try {
        let apostleLevel = entity.getLevel();
        if (t == 0) {
            let target = entity.getTarget();
            data.putDouble('apostleRainX', target.getX());
            data.putDouble('apostleRainY', target.getY());
            data.putDouble('apostleRainZ', target.getZ());
        }
        if (t == 0 || t == 25) {
            apostleGroundWarn(apostleLevel, entity, 'rain_area', data.getDouble('apostleRainX'), data.getDouble('apostleRainY'), data.getDouble('apostleRainZ'), 8.0, 52);
        }
        if (t % 5 != 0 || t >= 50) return;
        let centerX = data.getDouble('apostleRainX');
        let centerY = data.getDouble('apostleRainY');
        let centerZ = data.getDouble('apostleRainZ');
        for (let i = 0; i < 6; i++) {
            let angle = Math.random() * 360.0 * APOSTLE_DEG;
            let radius = 8.0 * Math.sqrt(Math.random());
            let driftX = Math.random() * 0.2 - 0.1;
            let driftZ = Math.random() * 0.2 - 0.1;
            apostleCreateBullet(entity, centerX + Math.cos(angle) * radius, centerY + 8.0, centerZ + Math.sin(angle) * radius, driftX, -1.0, driftZ, 0.4, 0, APOSTLE_BULLET_DAMAGE, 1, 100);
        }
    } catch (e) {
        console.log('[使徒] 弹幕雨异常: ' + e);
    }
}

// 招式9 冲刺撞击：0.5s 预警（路径线+本体红漆）后向玩家位置冲刺 8 格，路径留弹幕拖尾、接触伤害 4；撞墙提前收招；结束 0.8s 硬直输出窗口。
function apostleMoveDash(entity, data, t) {
    try {
        let apostleLevel = entity.getLevel();
        if (t == 0 || t == 6) {
            let target = entity.getTarget();
            let dx = target.getX() - entity.getX();
            let dz = target.getZ() - entity.getZ();
            let length = Math.sqrt(dx * dx + dz * dz);
            if (length < 0.001) {
                dx = 1.0;
                dz = 0.0;
            } else {
                dx /= length;
                dz /= length;
            }
            if (t == 0) {
                data.putDouble('apostleDirX', dx);
                data.putDouble('apostleDirZ', dz);
                apostlePaintAdd(apostleLevel, entity, 'apostle_dash_warn', 'C81E1E66');
            }
            let ox = entity.getX();
            let oy = entity.getY() + entity.getBbHeight() * 0.72;
            let oz = entity.getZ();
            apostleWarningModel(apostleLevel, entity, 'beam', 'dash_path', ox + dx * 4.0, oy, oz + dz * 4.0, 0.5, Math.atan2(dx, dz) / APOSTLE_DEG, 12);
        }
        if (t == 10) {
            apostlePaintRemove(apostleLevel, entity, 'apostle_dash_warn');
        }
        if (t >= 10 && t < 20) {
            let dx = data.getDouble('apostleDirX');
            let dz = data.getDouble('apostleDirZ');
            let preX = entity.getX();
            let preZ = entity.getZ();
            entity.move(MoverType.SELF, new Vec3(dx * 0.9, 0.0, dz * 0.9));
            let movedX = entity.getX() - preX;
            let movedZ = entity.getZ() - preZ;
            if (movedX * movedX + movedZ * movedZ < 0.09) {
                // 实际位移不足说明撞墙，直接跳到硬直阶段
                data.putLong('apostleMoveTick', 19);
            }

            // 冲刺接触伤害 4 点：同一目标 1 秒内只结算一次
            let now = apostleLevel.getTime();
            let box = new AABB(entity.getX() - 1.5, entity.getY() - 1.0, entity.getZ() - 1.5, entity.getX() + 1.5, entity.getY() + 2.5, entity.getZ() + 1.5);
            let entities = apostleLevel.getEntitiesWithin(box);
            for (let i = 0; i < entities.length; i++) {
                let hit = entities[i];
                if (!global.apostleIsValidTarget(hit)) continue;
                if (now - hit.getPersistentData().getLong('apostleDashHit') < 20) continue;
                hit.getPersistentData().putLong('apostleDashHit', now);
                apostleApplyDamage(hit, entity.damageSources().mobAttack(entity), 4.0, '冲刺');
            }

            // 冲刺路径弹幕拖尾
            if (t % 2 == 0) {
                apostleCreateBullet(entity, entity.getX(), entity.getY() + 1.0, entity.getZ(), dx, 0.0, dz, 0.35, 0, APOSTLE_BULLET_DAMAGE, 0, 40);
            }
        }
        // t 20..35：硬直输出窗口，无动作
    } catch (e) {
        console.log('[使徒] 冲刺撞击异常: ' + e);
    }
}

// 招式10 落地冲击波：抛物线跳向玩家位置 0.8s（落点圆环预警），落地后放贴地低空环形弹幕（伤害 5，可跳跃躲过），随后 1s 硬直。
function apostleMoveSlam(entity, data, t) {
    try {
        let apostleLevel = entity.getLevel();
        if (t == 0) {
            let target = entity.getTarget();
            data.putDouble('apostleOrigX', entity.getX());
            data.putDouble('apostleOrigY', entity.getY());
            data.putDouble('apostleOrigZ', entity.getZ());
            data.putDouble('apostleLandX', target.getX());
            data.putDouble('apostleLandY', target.getY());
            data.putDouble('apostleLandZ', target.getZ());
        }
        let landX = data.getDouble('apostleLandX');
        let landY = data.getDouble('apostleLandY');
        let landZ = data.getDouble('apostleLandZ');
        if (t == 0 || t == 8) {
            apostleGroundWarn(apostleLevel, entity, 'slam_landing', landX, landY, landZ, 2.5, 18);
        }
        if (t <= 15) {
            // 抛物线飞行：XZ 线性插值，Y 叠加正弦弧顶 2.5 格
            let progress = t / 15.0;
            let sx = data.getDouble('apostleOrigX');
            let sy = data.getDouble('apostleOrigY');
            let sz = data.getDouble('apostleOrigZ');
            entity.setPos(
                sx + (landX - sx) * progress,
                sy + (landY - sy) * progress + Math.sin(progress * APOSTLE_PI) * 2.5,
                sz + (landZ - sz) * progress
            );
            return;
        }
        if (t == 16) {
            entity.setPos(landX, landY, landZ);
            // 贴地冲击波：低空（+0.3 格）环形弹幕，跳跃可躲
            let mul = apostleSpeedMul(data);
            let waveY = landY + 0.3;
            for (let i = 0; i < 24; i++) {
                let radians = i * 15.0 * APOSTLE_DEG;
                apostleCreateBullet(entity, landX, waveY, landZ, Math.cos(radians), 0.0, Math.sin(radians), 0.7 * mul, 0, 5.0, 0, 30);
            }
            apostleFx(apostleLevel, {
                particle: 'minecraft:end_rod', shape: 'ring',
                x: landX, y: waveY, z: landZ,
                radius: 1.5, count: 6, speed: 0.12
            });
            return;
        }
        // t 17..35：硬直输出窗口，无动作
    } catch (e) {
        console.log('[使徒] 落地冲击波异常: ' + e);
    }
}

// 招式11 直线激光扫射：Dyeing 几何光束预警 1s 后激活 2s，激光缓慢转向追踪并按光路结算伤害。
function apostleMoveLaser(entity, data, t) {
    try {
        let apostleLevel = entity.getLevel();
        if (t == 0) {
            let target = entity.getTarget();
            data.putDouble('apostleOrigX', entity.getX());
            data.putDouble('apostleOrigY', entity.getY() + 1.2);
            data.putDouble('apostleOrigZ', entity.getZ());
            data.putDouble('apostleAngle', Math.atan2(target.getZ() - entity.getZ(), target.getX() - entity.getX()) * 180.0 / APOSTLE_PI);
        }
        if (t < 20) {
            // 蓄能预警：前 1 秒每 10 tick 刷新一次火焰线段
            if (t == 0) apostleLaserFx(entity, data, 22);
            return;
        }
        let angle = data.getDouble('apostleAngle');
        let target = entity.getTarget();
        if (global.apostleIsValidTarget(target)) {
            let diff = apostleAngleDiff(angle, Math.atan2(target.getZ() - entity.getZ(), target.getX() - entity.getX()) * 180.0 / APOSTLE_PI);
            if (diff > 0.5) diff = 0.5;
            if (diff < -0.5) diff = -0.5;
            angle += diff;
            data.putDouble('apostleAngle', angle);
        }
        if (t % 5 == 0) apostleLaserFx(entity, data, 8);
        if (t % 10 == 0) apostleLaserDamage(entity, data);
    } catch (e) {
        console.log('[使徒] 激光扫射异常: ' + e);
    }
}

// 招式12 地面危险区：目标周围 3 格内随机 3 点（保底脚下 1 点），红色圆环预警 1s 后爆炸，半径 2 格内 6 点伤害。
function apostleMoveZones(entity, data, t) {
    try {
        let apostleLevel = entity.getLevel();
        if (t == 0) {
            let target = entity.getTarget();
            data.putDouble('apostleP1X', target.getX());
            data.putDouble('apostleP1Y', target.getY());
            data.putDouble('apostleP1Z', target.getZ());
            for (let p = 2; p <= 3; p++) {
                let angle = Math.random() * 360.0 * APOSTLE_DEG;
                let radius = Math.random() * 3.0;
                data.putDouble('apostleP' + p + 'X', target.getX() + Math.cos(angle) * radius);
                data.putDouble('apostleP' + p + 'Y', target.getY());
                data.putDouble('apostleP' + p + 'Z', target.getZ() + Math.sin(angle) * radius);
            }
        }
        if (t == 0 || t == 10) {
            for (let p = 1; p <= 3; p++) {
                apostleGroundWarn(apostleLevel, entity, 'zone_' + p, data.getDouble('apostleP' + p + 'X'), data.getDouble('apostleP' + p + 'Y'), data.getDouble('apostleP' + p + 'Z'), 2.0, 22);
            }
        }
        if (t != 20) return;
        for (let p = 1; p <= 3; p++) {
            let px = data.getDouble('apostleP' + p + 'X');
            let py = data.getDouble('apostleP' + p + 'Y');
            let pz = data.getDouble('apostleP' + p + 'Z');
            apostleLevel.spawnParticles('minecraft:explosion', true, px, py + 0.6, pz, 1, 0, 0, 0, 0);
            apostleDamageArea(entity, px, py, pz, 2.0, 2.5, 6.0, entity.damageSources().mobAttack(entity));
        }
    } catch (e) {
        console.log('[使徒] 地面危险区异常: ' + e);
    }
}

// 招式13 召唤小怪：召唤 2 只强化僵尸（血量 30、移速 0.3），打 apostleFaction 阵营标记避免弹幕误伤；场上 ≥4 只时跳过。
function apostleMoveSummon(entity, data, t) {
    try {
        if (t != 0) return;
        let apostleLevel = entity.getLevel();
        if (apostleCountFactionMobs(entity) >= 4) {
            console.log('[使徒] 场上使徒阵营小怪已达上限，跳过本次召唤');
            return;
        }
        for (let i = 0; i < 2; i++) {
            let zombie = apostleLevel.createEntity('minecraft:zombie');
            if (zombie == null) continue;
            zombie.setPos(entity.getX() + (i == 0 ? -1.5 : 1.5), entity.getY(), entity.getZ());
            zombie.getPersistentData().putLong('apostleFaction', 1);
            zombie.spawn();
            try {
                zombie.getAttribute(Attributes.MAX_HEALTH).setBaseValue(30.0);
                zombie.setHealth(30.0);
                zombie.getAttribute(Attributes.MOVEMENT_SPEED).setBaseValue(0.3);
            } catch (e) {
                console.log('[使徒] 召唤物强化异常: ' + e);
            }
        }
        apostleFx(apostleLevel, {
            particle: 'minecraft:flame', shape: 'ring',
            x: entity.getX(), y: entity.getY() + 0.2, z: entity.getZ(),
            radius: 1.8, count: 6, speed: 0.04
        });
    } catch (e) {
        console.log('[使徒] 召唤小怪异常: ' + e);
    }
}

// 招式逐 tick 分发；t 为招式内已进行的 tick 数（0 起始）。
function apostleCastTick(entity, data, moveId, t) {
    if (moveId == 1) apostleMoveRapid(entity, data, t);
    else if (moveId == 2) apostleMoveFan(entity, data, t);
    else if (moveId == 3) apostleMoveRing(entity, data, t);
    else if (moveId == 4) apostleMoveDoor(entity, data, t);
    else if (moveId == 5) apostleMoveLightning(entity, data, t);
    else if (moveId == 6) apostleMoveWall(entity, data, t);
    else if (moveId == 7) apostleMoveSpiral(entity, data, t);
    else if (moveId == 8) apostleMoveRain(entity, data, t);
    else if (moveId == 9) apostleMoveDash(entity, data, t);
    else if (moveId == 10) apostleMoveSlam(entity, data, t);
    else if (moveId == 11) apostleMoveLaser(entity, data, t);
    else if (moveId == 12) apostleMoveZones(entity, data, t);
    else if (moveId == 13) apostleMoveSummon(entity, data, t);
}

// 判断招式是否为大招（受独立冷却与保底限制）。
function apostleIsUltimate(moveId) {
    for (let i = 0; i < APOSTLE_ULTIMATE_IDS.length; i++) {
        if (APOSTLE_ULTIMATE_IDS[i] == moveId) return true;
    }
    return false;
}

// 权重随机选招：不与上一招重复；大招受独立冷却限制；大招保底标记下必选基础/进阶招式。
function apostleSelectMove(data) {
    try {
        let lastMove = data.getLong('apostleLastMove');
        let guarantee = data.getLong('apostleGuarantee') == 1;
        let age = data.getLong('apostleAge');
        let ids = [];
        let weights = [];
        let total = 0;
        for (let i = 0; i < APOSTLE_MOVE_IDS.length; i++) {
            let id = APOSTLE_MOVE_IDS[i];
            if (id == lastMove) continue;
            let ultimate = apostleIsUltimate(id);
            if (ultimate && guarantee) continue;
            if (ultimate && age < data.getLong('apostleCd' + id)) continue;
            ids.push(id);
            weights.push(APOSTLE_MOVE_WEIGHT[id]);
            total += APOSTLE_MOVE_WEIGHT[id];
        }
        if (ids.length == 0) return 1;
        let roll = Math.random() * total;
        for (let i = 0; i < ids.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return ids[i];
        }
        return ids[ids.length - 1];
    } catch (e) {
        console.log('[使徒] 招式选择异常: ' + e);
        return 1;
    }
}

// 进入施法状态并结算大招冷却/保底标记；召唤招式开始时只触发一次召唤动画，各招式的 t==0 初始化在招式函数内部完成。
function apostleBeginCast(entity, data, moveId) {
    try {
        data.putLong('apostleLastMove', moveId);
        if (apostleIsUltimate(moveId)) {
            let cooldown = data.getLong('apostleEnrage') == 1 ? APOSTLE_ENRAGE_COOLDOWN : APOSTLE_ULTIMATE_COOLDOWN;
            data.putLong('apostleCd' + moveId, data.getLong('apostleAge') + cooldown);
            data.putLong('apostleGuarantee', 1);
        } else {
            data.putLong('apostleGuarantee', 0);
        }
        data.putLong('apostleState', 1);
        data.putLong('apostleMove', moveId);
        data.putLong('apostleMoveTick', 0);
        entity.getNavigation().stop();
        if (moveId == 13) {
            try {
                entity.triggerAnim('apostle_summon_controller', 'summon_danmaku');
            } catch (e) {
                console.log('[使徒] 召唤动画触发异常: ' + e);
            }
        }
    } catch (e) {
        console.log('[使徒] 施法开始异常: ' + e);
    }
}

// 狂暴检查：血量低于 30% 触发一次，提升移速至 0.35 并叠加红色油漆层。
function apostleUpdateEnrage(entity, data) {
    try {
        if (data.getLong('apostleEnrage') == 1) return;
        let maxHealth = entity.getMaxHealth();
        if (maxHealth <= 0.0) return;
        if (entity.getHealth() / maxHealth > 0.3) return;
        data.putLong('apostleEnrage', 1);
        try {
            entity.getAttribute(Attributes.MOVEMENT_SPEED).setBaseValue(0.35);
        } catch (e) {
            console.log('[使徒] 狂暴移速设置异常: ' + e);
        }
        let apostleLevel = entity.getLevel();
        apostlePaintAdd(apostleLevel, entity, 'apostle_enrage', 'C81E1E66');
        apostleFx(apostleLevel, {
            particle: 'minecraft:flame', shape: 'ring',
            x: entity.getX(), y: entity.getY() + 0.2, z: entity.getZ(),
            radius: 2.0, count: 8, speed: 0.06
        });
        console.log('[使徒] 进入狂暴阶段');
    } catch (e) {
        console.log('[使徒] 狂暴检查异常: ' + e);
    }
}

// 血量阈值触发召唤标记：70% 与 40% 各一次，实际召唤在下一轮选招时优先插入。
function apostleCheckSummonTrigger(entity, data) {
    try {
        if (data.getLong('apostlePendingSummon') == 1) return;
        let maxHealth = entity.getMaxHealth();
        if (maxHealth <= 0.0) return;
        let ratio = entity.getHealth() / maxHealth;
        if (ratio <= 0.7 && data.getLong('apostleSummon70') == 0) {
            data.putLong('apostleSummon70', 1);
            data.putLong('apostlePendingSummon', 1);
            return;
        }
        if (ratio <= 0.4 && data.getLong('apostleSummon40') == 0) {
            data.putLong('apostleSummon40', 1);
            data.putLong('apostlePendingSummon', 1);
        }
    } catch (e) {
        console.log('[使徒] 召唤触发检查异常: ' + e);
    }
}

// 每颗弹珠独立累计生命周期（maxLife 支持按招式缩短）；延迟弹到时再按目标位置发射；弹幕雨弹珠逐 tick 提速模拟重力。
global.apostleBulletTick = function (projectile) {
    try {
        let apostleLevel = projectile.getLevel();
        if (apostleLevel.isClientSide()) return;
        let data = projectile.getPersistentData();
        let age = data.getLong('apostleLife') + 1;
        data.putLong('apostleLife', age);
        let maxLife = data.getLong('apostleMaxLife');
        if (maxLife <= 0) maxLife = APOSTLE_BULLET_LIFETIME;
        if (age >= maxLife) {
            projectile.discard();
            return;
        }

        let delay = data.getLong('apostleDelay');
        if (delay > 1) {
            data.putLong('apostleDelay', delay - 1);
            return;
        }
        if (delay == 1) {
            data.putLong('apostleDelay', 0);
            let owner = projectile.getOwner();
            if (owner == null || !owner.isAlive() || apostleGetEntityId(owner) != APOSTLE_ID) {
                projectile.discard();
                return;
            }
            let target = owner.getTarget();
            if (!global.apostleIsValidTarget(target)) {
                projectile.discard();
                return;
            }
            let dx = target.getX() - projectile.getX();
            let dy = target.getY() + target.getBbHeight() * 0.5 - projectile.getY();
            let dz = target.getZ() - projectile.getZ();
            let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance < 0.001) {
                projectile.discard();
                return;
            }
            dx /= distance;
            dy /= distance;
            dz /= distance;
            projectile.shoot(dx, dy, dz, 1.1, 0.0);
            return;
        }

        if (data.getLong('apostleRain') == 1) {
            // 弹幕雨：按存储方向按已飞行时间重设速度（0.4 起步，每 tick +0.035，上限 1.3）
            let speed = 0.4 + age * 0.035;
            if (speed > 1.3) speed = 1.3;
            projectile.shoot(data.getDouble('apostleDirX'), data.getDouble('apostleDirY'), data.getDouble('apostleDirZ'), speed, 0.0);
        }
    } catch (e) {
        console.log('[使徒] 弹珠生命周期异常: ' + e);
    }
};

// 命中时再次检查目标与主人，按弹珠自身 apostleDamage 结算（默认 2，冲击波弹 5）。
global.apostleProjectileHit = function (projectile, target) {
    try {
        let apostleLevel = projectile.getLevel();
        if (apostleLevel.isClientSide()) return;
        let owner = projectile.getOwner();
        if (owner == null || !owner.isAlive() || apostleGetEntityId(owner) != APOSTLE_ID) {
            projectile.discard();
            return;
        }
        if (target != null && target.getId() != owner.getId() && global.apostleIsValidTarget(target)) {
            let damage = projectile.getPersistentData().getDouble('apostleDamage');
            if (damage <= 0) damage = APOSTLE_BULLET_DAMAGE;
            // 使用本项目已核对的 mobAttack DamageSource，避免 thrown 来源被战斗防护规则忽略。
            apostleApplyDamage(target, owner.damageSources().mobAttack(owner), damage, '弹幕');
        } else if (target != null) {
            console.log('[使徒] 弹幕命中回调目标被筛除，target=' + apostleGetEntityId(target));
        }
        projectile.discard();
    } catch (e) {
        console.log('[使徒] 弹珠伤害结算异常: ' + e);
    }
};

// 使徒主 AI 入口：每 tick 让模型正面对准目标，空闲时每十 tick 刷新站位并推进招式状态机。
global.apostleTick = function (entity) {
    try {
        let apostleLevel = entity.getLevel();
        if (apostleLevel.isClientSide()) return;
        let data = entity.getPersistentData();
        let age = data.getLong('apostleAge') + 1;
        data.putLong('apostleAge', age);
        let trackedTarget = entity.getTarget();
        if (global.apostleIsValidTarget(trackedTarget)) apostleFaceTarget(entity, trackedTarget);

        if (age % 10 == 0) {
            apostleUpdateEnrage(entity, data);
            apostleCheckSummonTrigger(entity, data);
        }

        if (data.getLong('apostleState') == 1) {
            // 施法中：目标失效立即收招（同步清理冲刺预警油漆），短暂间隔后重新索敌
            let target = entity.getTarget();
            if (!global.apostleIsValidTarget(target)) {
                data.putLong('apostleState', 0);
                data.putLong('apostleGapUntil', age + 20);
                apostlePaintRemove(apostleLevel, entity, 'apostle_dash_warn');
                return;
            }
            let moveId = data.getLong('apostleMove');
            let moveTick = data.getLong('apostleMoveTick');
            apostleCastTick(entity, data, moveId, moveTick);
            // 招式内部可能改写 apostleMoveTick（冲刺撞墙提前收招），因此重新读取后再自增
            moveTick = data.getLong('apostleMoveTick') + 1;
            data.putLong('apostleMoveTick', moveTick);
            let duration = APOSTLE_MOVE_DURATION[moveId];
            if (duration == null) duration = 10;
            if (moveTick >= duration) {
                data.putLong('apostleState', 0);
                let gap = data.getLong('apostleEnrage') == 1 ? APOSTLE_ENRAGE_GAP : APOSTLE_IDLE_GAP;
                data.putLong('apostleGapUntil', age + gap);
            }
            return;
        }

        if (age % 10 == 0) {
            // 空闲刷新：寻找最近目标并维持 12–20 格环带
            let target = apostleFindTarget(entity);
            if (target == null) {
                entity.setTarget(null);
                entity.getNavigation().stop();
                return;
            }
            entity.setTarget(target);
            apostleUpdateSpacing(entity, target, age);
            if (data.getLong('apostleGapUntil') == 0) {
                // 首次锁定目标给 1s 反应时间
                data.putLong('apostleGapUntil', age + 20);
            }
        } else if (!global.apostleIsValidTarget(entity.getTarget())) {
            return;
        }

        if (age < data.getLong('apostleGapUntil')) return;

        // 选招：召唤触发优先插入，其余走权重随机
        let moveId;
        if (data.getLong('apostlePendingSummon') == 1) {
            data.putLong('apostlePendingSummon', 0);
            moveId = 13;
        } else {
            moveId = apostleSelectMove(data);
        }
        apostleBeginCast(entity, data, moveId);
    } catch (e) {
        console.log('[使徒] 主 AI 异常: ' + e);
    }
};
