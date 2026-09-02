// ==========================================
// 🌀 心理卷轴（rainbow:psychic_scroll）服务端核心逻辑
// ==========================================
// 实体注册：startup_scripts/Registry/Registry_entity.js
// （与 rainbow:kuchiyose_scroll 共用模型，但为完全独立的两个实体）
// 召唤入口：global.summonPsychicScroll(player, seconds) / 命令 /psychicscroll [秒]
// 效果（参考 DomesticationInnovation 的 PsychicWallEntity）：
//   - 穿过墙检测区的实体获得沿墙面向、大小 = 当前速度 2 倍的速度
//     （施放者本人豁免——不能把自己发射出去）
//   - 抛射体强制转向墙面向角度（速度同样 ×2），含施放者自己的抛射体
//     （自己的箭穿墙 = 箭加速器玩法）
// 本机玩家的增速由 Registry_entity.js 的客户端分支本地应用
// （服务端修改玩家速度不会自动同步，需双端结算，见该文件注释）
// 冷却记录存内存（参照 SetEffect.js 的 ActiveSetTracker 模式），
// /reload 丢失无害（最多让区内实体多触发一次）

var PW_HALF_WIDTH = 1.5;   // 墙半宽（切向，检测区 3 格宽）
var PW_HALF_THICK = 0.45;  // 墙半厚（法向，检测用）
var PW_COOLDOWN = 15;      // 同一实体重复触发冷却（tick）
var PW_CD = {};            // wallUuid -> { colliderUuid -> 剩余tick }

// 检测盒：以墙中心为原点，法向轴薄、切向轴宽
// （AABB 无法表达任意斜面，look 向量按主分量量化到 6 轴定法向；
//   增速方向本身仍用完整 look 向量，不受量化影响）
function pwBuildBox(entity) {
    var look = entity.getLookAngle();
    var lx = Math.abs(look.x()), ly = Math.abs(look.y()), lz = Math.abs(look.z());
    var hx, hy, hz;
    if (lx >= ly && lx >= lz) { hx = PW_HALF_THICK; hy = PW_HALF_WIDTH; hz = PW_HALF_WIDTH; }
    else if (ly >= lz) { hx = PW_HALF_WIDTH; hy = PW_HALF_THICK; hz = PW_HALF_WIDTH; }
    else { hx = PW_HALF_WIDTH; hy = PW_HALF_WIDTH; hz = PW_HALF_THICK; }
    var cx = entity.getX(), cy = entity.getY() + 0.25, cz = entity.getZ();
    return new AABB(cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz);
}

// UUID 兼容取值：KubeJS 包装对象用 uuid 属性，原生实体用 getUUID()
function pwUuidOf(e) {
    try { return String(e.uuid); } catch (e2) {}
    try { return String(e.getUUID()); } catch (e2) {}
    return null;
}

// 实体自治 tick（由 Registry_entity.js 每服务端 tick 调用，tickNum 为 pwTicks 计数）
global.psychicWallTick = function (entity, tickNum) {
    try {
        var data = entity.getPersistentData();
        var wkey = pwUuidOf(entity);

        // 位置锚定：首次 tick 记录出生位置，此后每 tick 拉回，
        // 彻底杜绝箭击退/实体推移等一切位移（墙必须静止）
        if (!data.contains('pwAnchorX')) {
            data.putDouble('pwAnchorX', entity.getX());
            data.putDouble('pwAnchorY', entity.getY());
            data.putDouble('pwAnchorZ', entity.getZ());
        } else {
            var ax = data.getDouble('pwAnchorX');
            var ay = data.getDouble('pwAnchorY');
            var az = data.getDouble('pwAnchorZ');
            if (entity.getX() != ax || entity.getY() != ay || entity.getZ() != az) {
                entity.setPos(ax, ay, az);
                entity.setDeltaMovement(new Vec3(0, 0, 0));
            }
        }

        // 寿命：/summon 直刷（无 persistentData）默认 300t
        var life = data.contains('pwLife') ? data.getLong('pwLife') : 300;
        if (life <= 1) {
            if (PW_CD[wkey]) delete PW_CD[wkey];
            entity.discard();
            return;
        }
        data.putLong('pwLife', life - 1);

        var level = entity.getLevel();
        var look = entity.getLookAngle();
        var ownerUuid = data.contains('pwOwner') ? data.getString('pwOwner') : null;
        var selfId = entity.getId();
        var box = pwBuildBox(entity);

        // 墙体存在感粒子（每 5t 按检测盒尺寸铺一层微光）
        // 注意：AABB 包装对象无 getMaxX/getMaxY/getMaxZ 方法（Rhino 会抛
        // TypeError 中断整个 tick，偏转逻辑随之失效），散布直接用常量
        if (tickNum % 5 == 0) {
            level.spawnParticles('minecraft:end_rod', true,
                entity.getX(), entity.getY() + 0.25, entity.getZ(), 30,
                PW_HALF_WIDTH, PW_HALF_WIDTH, PW_HALF_WIDTH, 0.0);
        }

        // 冷却表推进（每 tick -1，归零移除）
        var cdMap = PW_CD[wkey];
        if (cdMap == null) { cdMap = {}; PW_CD[wkey] = cdMap; }
        var k;
        for (k in cdMap) {
            cdMap[k] = cdMap[k] - 1;
            if (cdMap[k] <= 0) delete cdMap[k];
        }

        // ==========================================
        // (A) 生物/玩家：薄板检测盒内，速度强制修正为墙面向 ×2
        // （抛射体不在此处理，见下方 (B) 前瞻拦截）
        // ==========================================
        var lx = look.x(), ly = look.y(), lz = look.z();
        var cx = entity.getX(), cy = entity.getY(), cz = entity.getZ();
        var colliders = level.getEntitiesWithin(box);
        var i, c;
        for (i = 0; i < colliders.length; i++) {
            c = colliders[i];
            if (c == null || c.getId() == selfId) continue;
            if (!c.isAlive()) continue;
            var isProj = false;
            try { isProj = c instanceof Projectile; } catch (e) {}
            if (isProj) continue; // 抛射体由 (B) 前瞻拦截统一处理

            var cu = pwUuidOf(c);
            if (ownerUuid != null && cu == ownerUuid) continue; // 施放者本人豁免
            if (cdMap[cu] != null) continue; // 冷却中

            cdMap[cu] = PW_COOLDOWN;

            // 核心效果：速度大小 ×2，方向改为墙面向
            var speed = c.getDeltaMovement().length();
            c.setDeltaMovement(look.scale(speed * 2));

            // 命中反馈
            level.playSound(null, c.getX(), c.getY(), c.getZ(),
                'minecraft:item.trident.hit', 'players', 1.0, 1.2);
            level.spawnParticles('minecraft:end_rod', true,
                c.getX(), c.getY() + 0.5, c.getZ(), 10, 0.3, 0.3, 0.3, 0.05);
        }

        // ==========================================
        // (B) 抛射体偏转加速（nonliving 基类，与 DI 心理墙对齐）
        // 实体 isPickable()=false：抛射物命中检测直接跳过墙本体，
        // 不会被弹回，也无需任何瞬移补偿。
        // 前瞻平面判定（速度+1.0 余量）保留：防 3格/tick 高速箭
        // 隧穿 0.9 格薄板导致漏偏转。
        // ==========================================
        var bigBox = new AABB(cx - 5, cy - 5, cz - 5, cx + 5, cy + 5, cz + 5);
        var projs = level.getEntitiesWithin(bigBox);
        var j, p;
        var dbgProjCount = 0; // 诊断：区内抛射体计数
        for (j = 0; j < projs.length; j++) {
            p = projs[j];
            if (p == null || p.getId() == selfId || !p.isAlive()) continue;
            var isProj2 = false;
            try { isProj2 = p instanceof Projectile; } catch (e) {}
            if (!isProj2) continue;
            dbgProjCount++;

            var vel = p.getDeltaMovement();
            var pSpeed = vel.length();
            if (pSpeed < 0.05) continue; // 静止抛射体（插地方块上的箭等）不处理

            // 有向距离 d：>0 在墙面前侧，<0 在墙后侧；va：速度沿法向分量
            var d = (p.getX() - cx) * lx + (p.getY() - cy) * ly + (p.getZ() - cz) * lz;
            var va = vel.x() * lx + vel.y() * ly + vel.z() * lz;
            // 本 tick 内将穿越墙面（含高速隧穿余量），或已处于薄板区内
            var crossing = (va < 0 && d > 0 && d < pSpeed + 1.0)
                || (va > 0 && d < 0 && -d < pSpeed + 1.0)
                || Math.abs(d) < 0.45;
            if (!crossing) continue;

            // 施放者自己的抛射体同样偏转加速（需求：所有碰墙抛射体均修正，
            // 墙面向 = 施放时的视线方向，自己的箭穿墙会被 ×2 加速射向敌人）
            var pu = pwUuidOf(p);
            if (cdMap[pu] != null) continue; // 冷却中
            cdMap[pu] = PW_COOLDOWN;

            // 偏转加速：速度方向 = 墙面向，大小 = 原速 ×2（下限 0.8 防慢速滞留）
            p.setDeltaMovement(look.scale(Math.max(pSpeed * 2, 0.8)));
            // 旋转修正（按 look 反算 yaw/pitch，旧值一并写入防插值翻转）
            // 注意：Rhino 的 Math 无 toDegrees，用 * 180 / Math.PI
            var yawDeg = Math.atan2(-lx, lz) * 180 / MATH_PI;
            var clampedLy = Math.max(-0.999, Math.min(0.999, ly));
            var pitchDeg = -Math.asin(clampedLy) * 180 / MATH_PI;
            try { p.setYRot(yawDeg); p.setXRot(pitchDeg); } catch (e) {}
            try { p.yRotO = yawDeg; p.xRotO = pitchDeg; } catch (e) {}
            // 标记速度变更以同步到客户端
            try { p.hurtMarked = true; } catch (e) {}

            // 诊断：偏转触发详情
            // console.log('[PsychicScroll] 诊断-偏转: ' + p.getType()
            //     + ', 原速=' + pSpeed.toFixed(2) + ', d=' + d.toFixed(2));

            // 命中反馈
            level.playSound(null, p.getX(), p.getY(), p.getZ(),
                'minecraft:item.trident.hit', 'players', 1.0, 1.2);
            level.spawnParticles('minecraft:end_rod', true,
                p.getX(), p.getY() + 0.5, p.getZ(), 10, 0.3, 0.3, 0.3, 0.05);
        }

        // 诊断（每 2 秒）：区内实体/抛射体概况，零则说明查询本身有问题
        // if (tickNum % 40 == 0) {
        //     console.log('[PsychicScroll] 诊断-概况: 墙前5格内实体' + projs.length
        //         + '个, 其中抛射体' + dbgProjCount + '个, look=('
        //         + lx.toFixed(2) + ',' + ly.toFixed(2) + ',' + lz.toFixed(2) + ')');
        // }
    } catch (e) {
        console.error('[PsychicScroll] tick异常: ' + e);
    }
};

// ==========================================
// 召唤入口（供技能/命令调用）
// ==========================================
global.summonPsychicScroll = function (player, seconds) {
    try {
        var life = Math.max(1, Math.round((seconds || 15) * 20));
        var level = player.level;
        var look = player.getLookAngle();
        var yaw = player.getYaw();
        var pitch = player.getPitch();

        // 生成位置：玩家面前 2 格、视线高度（同通灵卷轴），面向玩家视线方向
        var sx = player.getX() + look.x() * 2;
        var sy = player.getY() + player.getEyeHeight();
        var sz = player.getZ() + look.z() * 2;

        var wall = level.createEntity('rainbow:psychic_scroll');
        if (!wall) return null;
        // 注意：不能用 setNbt 设置属性——内部 Entity.load() 会把坐标重置到 0,0,0
        try {
            wall.setInvulnerable(true);
            wall.setSilent(true);
            wall.setNoGravity(true);
        } catch (e) {}
        wall.setPos(sx, sy, sz);
        wall.setYaw(yaw);
        wall.setPitch(pitch);
        // 注：nonliving 实体无 setYBodyRot（LivingEntity 专属）与 setItemSlot
        // （无手持槽）——外观由 psychic_scroll.geo.json 平板模型 + 物品纹理渲染

        // 主人 UUID 双通道：
        // persistentData（服务端判定）+ CustomName（原版同步通道，客户端判定用）
        // 注意：KubeJS 玩家包装对象没有 getUUID() 方法，用 uuid 属性（Skillwheel.js 同款写法）
        var ownerUuid = String(player.uuid);
        try {
            wall.setCustomName(ownerUuid);
            wall.setCustomNameVisible(false);
        } catch (e) {
            try { wall.setCustomName(Component.literal(ownerUuid)); } catch (e2) {}
        }
        var d = wall.getPersistentData();
        d.putString('pwOwner', ownerUuid);
        d.putLong('pwLife', life);

        wall.spawn();

        level.playSound(null, sx, sy, sz, 'minecraft:block.beacon.activate', 'players', 1.0, 1.4);
        level.spawnParticles('minecraft:end_rod', true, sx, sy, sz, 30, 1.2, 1.2, 1.2, 0.0);
        return wall;
    } catch (e) {
        console.error('[PsychicScroll] 召唤异常: ' + e);
        return null;
    }
};

// 测试命令：/psychicscroll [秒]（默认 15 秒）
ServerEvents.commandRegistry(function (event) {
    let Commands = event.commands;
    let Arguments = event.arguments;

    let summonFeedback = function (ctx, wall, secText) {
        if (wall == null) {
            ctx.getSource().sendFailure(Component.literal('§c心理卷轴召唤失败，查看服务器日志'));
            return 0;
        }
        ctx.getSource().sendSuccess(Component.literal(
            '§a✓ 心理卷轴已召唤（' + secText + '）：面前 2 格处，面向你的视线方向'), false);
        return 1;
    };

    event.register(
        Commands.literal('psychicscroll')
            .requires(function (s) {
                let e = s.getEntity();
                return e !== null && e.isPlayer();
            })
            .executes(function (ctx) {
                let player = ctx.getSource().getEntity();
                return summonFeedback(ctx, global.summonPsychicScroll(player, 15), '15 秒');
            })
            .then(Commands.argument('seconds', DoubleArgumentType.doubleArg(1, 600))
                .executes(function (ctx) {
                    let player = ctx.getSource().getEntity();
                    let sec = Number(Arguments.DOUBLE.getResult(ctx, 'seconds'));
                    return summonFeedback(ctx, global.summonPsychicScroll(player, sec), sec + ' 秒');
                }))
    );
});
