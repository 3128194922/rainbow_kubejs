// priority: 1000
// ==========================================
// 🧟 注册实体类型
// ==========================================
StartupEvents.registry('entity_type', event => {
    // 延迟TNT箭：击中目标后延迟爆炸
    event.create('rainbow:tnt_arrow', 'entityjs:arrow')
        .setKnockback(2)
        .setBaseDamage(0.5)
        .clientTrackingRange(8)
        .isAttackable(true)
        .sized(1, 1)
        .updateInterval(3)
        .defaultHitGroundSoundEvent("minecraft:entity.arrow.hit")
        .setWaterInertia(0.1)
        .mobCategory('misc')
        .item(item => {
            item.maxStackSize(64);
        })
        .textureLocation(() => "rainbow:textures/entity/tnt_arrow.png")

        // 触碰生物时启动延迟爆炸
        .onHitEntity(context => {
            let { entity } = context;
            let level = entity.getLevel();
            
            if (level.isClientSide()) return;
                level.createExplosion(entity.x, entity.y - 1, entity.z)
                    .causesFire(false)
                    .exploder(entity)
                    .explosionMode("none")
                    .strength(3)
                    .explode();
            entity.discard()
        })

        // 触碰方块时启动延迟爆炸
        .onHitBlock(context => {
            let { entity } = context;
            let level = entity.getLevel();
            let server = entity.getServer();

            if (level.isClientSide()) return;
            server.scheduleInTicks(40, () => {
                level.createExplosion(entity.x, entity.y - 1, entity.z)
                    .causesFire(false)
                    .exploder(entity)
                    .explosionMode("none")
                    .strength(3)
                    .explode();

                entity.discard();
            })
        })
        .displayName("延迟TNT箭")
        .playerTouch(context => {
            // 可选地阻止玩家捡起
        });
});

// ==========================================
// 📜 通灵卷轴（召唤物）
// ==========================================
// 主动技能 rainbow:kuchiyosenojutsu 的召唤实体（技能逻辑见 server_scripts/curios_skill_system/Skillwheel.js）
// 外观：无实体模型方块，通过 addRenderItemLayer 在骨骼 "scroll" 上直接渲染主手物品
// （rainbow:kuchiyosenojutsu）的物品模型 —— 与掉落物/展示框同款渲染
// 类型用 entityjs:tamable（TamableAnimal）：召唤时自动绑定召唤玩家为主人（见 Skillwheel.js）

StartupEvents.registry('entity_type', event => {
    event.create('rainbow:kuchiyose_scroll', 'entityjs:tamable')
        .sized(0.5, 0.5)
        .clientTrackingRange(10)
        .updateInterval(1)
        .mobCategory('misc')
        .isAttackable(entity => false)
        .modelResource(entity => "rainbow:geo/entity/kuchiyose_scroll.geo.json")
        .textureResource(entity => "rainbow:textures/item/kuchiyosenojutsu.png")
        .addRenderItemLayer(entity => "scroll", item => {
            item.renderItem(context => {
                let { poseStack, bone } = context;
                if (bone.name == "scroll") {
                    // 物品渲染大小，可按观感调整
                    poseStack.scale(1.5, 1.5, 1.5);
                }
            });
        })
        // 实体完全自治：投掷 + 自毁全部由实体自身 tick 驱动
        // 生命周期计数用 persistentData 计数器（不能用 entity.tickCount ——
        // Rhino 直接访问 Java 公有字段不可靠；也不能用 entity.age —— 映射
        // AgeableMob.getAge()，成年个体恒为 0，永不触发）
        // 投掷逻辑委托 global.kuchiyoseScrollTick（Skillwheel.js 挂载）
        .tick(entity => {
            try {
                if (entity.getLevel().isClientSide()) return;
                var data = entity.getPersistentData();
                var t = data.getLong('kuchiyoseTicks');
                if (t == 0) {
                    // 一次性诊断：确认 tick 回调执行 + global 函数可见性
                    console.log('[Kuchiyose] 实体tick运行, globalFn='
                        + (typeof global.kuchiyoseScrollTick));
                }
                t = t + 1;
                data.putLong('kuchiyoseTicks', t);
                if (typeof global.kuchiyoseScrollTick == 'function') {
                    global.kuchiyoseScrollTick(entity, t);
                }
                if (t > 100) entity.discard();
            } catch (e) {
                console.log('[Kuchiyose] 实体tick异常: ' + e);
            }
        })
});

// ==========================================
// 🎯 CBC 炮击目标实体
// ==========================================
// 独立于 rainbow:kuchiyose_scroll，避免把实体 ID 当作物品注册或复用通灵卷轴逻辑。
StartupEvents.registry('entity_type', event => {
    event.create('rainbow:cannon_target_marker', 'entityjs:nonliving')
        .sized(0.25, 0.25)
        .clientTrackingRange(32)
        .updateInterval(1)
        .mobCategory('misc')
        .modelResource(entity => "rainbow:geo/entity/psychic_scroll.geo.json")
        .textureResource(entity => "rainbow:textures/item/beacon_ball.png")
        .tick(entity => {
            try {
                if (entity.getLevel().isClientSide()) return;
                if (typeof global.cannonTargetMarkerTick == 'function') {
                    global.cannonTargetMarkerTick(entity);
                }
            } catch (e) {
                console.log('[CannonTarget] 目标实体tick异常: ' + e);
            }
        });
});

// ==========================================
// 🌀 心理卷轴（心理墙变体）
// ==========================================
// 与 DomesticationInnovation 的 PsychicWallEntity 对齐：基类 entityjs:nonliving
// （继承原版 Entity，与 DI 心理墙同基类），碰撞行为天然一致：
//   - isPickable()=false：抛射物命中检测直接跳过墙，不会被弹回
//   - canBeCollidedWith()=false：实体不会被墙挡住
//   - isPushable()=false、hurt()=false：免伤免推
// 外观：psychic_scroll.geo.json 平板模型 + kuchiyosenojutsu 物品纹理
// （nonliving 无 addRenderItemLayer，不能用物品渲染层，改用几何体贴图）
// 功能：穿过墙检测区的实体/抛射体强制修正为墙面向 ×2 速度（偏转加速），
// 抛射体含施放者自己的（箭加速器）；施放者本人（玩家实体）豁免。
// 服务端核心逻辑委托 global.psychicWallTick（server_scripts/psychic_scroll.js）
// 双端结算（复刻原版心理墙做法）：服务端权威结算全部实体；
// 客户端对本机玩家本地应用增速——服务端修改玩家速度不会自动同步，
// 必须在玩家自己的客户端同时应用，否则会 rubber-band 回弹

// 客户端本地冷却（wallId -> 剩余tick）：persistentData 不同步到客户端，
// 服务端冷却表客户端读不到，本地自备一份防止本机玩家在检测区内每 tick 重复加速
var PS_CLIENT_CD = {};

function psychicScrollClientTick(entity) {
    try {
        if (entity.isRemoved()) { delete PS_CLIENT_CD[entity.getId()]; return; }
        var st = PS_CLIENT_CD[entity.getId()];
        if (st == null) { st = { cd: 0 }; PS_CLIENT_CD[entity.getId()] = st; }
        if (st.cd > 0) { st.cd--; return; }

        // 主人 UUID 经 CustomName 同步（persistentData 不同步到客户端）
        var ownerName = entity.getCustomName();
        var ownerUuid = ownerName == null ? null : String(ownerName.getString());

        // 墙面向：取同步的实体旋转（生成时锁定，无 AI 不会变化，与服务端一致）
        var look = entity.getLookAngle();
        var lx = Math.abs(look.x()), ly = Math.abs(look.y()), lz = Math.abs(look.z());
        var W = 1.5, T = 0.45, hx, hy, hz;
        if (lx >= ly && lx >= lz) { hx = T; hy = W; hz = W; }
        else if (ly >= lz) { hx = W; hy = T; hz = W; }
        else { hx = W; hy = W; hz = T; }
        var cx = entity.getX(), cy = entity.getY() + 0.25, cz = entity.getZ();
        var box = new AABB(cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz);

        var colliders = entity.getLevel().getEntitiesWithin(box);
        var i, c;
        for (i = 0; i < colliders.length; i++) {
            c = colliders[i];
            if (c == null || c.getId() == entity.getId()) continue;
            // 只处理本机玩家：远程实体由服务端权威结算，经位置同步到达
            if (!(typeof c.isLocalPlayer == 'function' && c.isLocalPlayer())) continue;
            // 本机玩家是 KubeJS 包装对象，无 getUUID()——用 uuid 属性
            // （server_scripts/psychic_scroll.js pwUuidOf 同款兜底写法）
            var cu = null;
            try { cu = String(c.uuid); } catch (e2) {}
            if (cu == null) { try { cu = String(c.getUUID()); } catch (e2) {} }
            if (ownerUuid != null && cu == ownerUuid) return;
            var speed = c.getDeltaMovement().length();
            c.setDeltaMovement(look.scale(speed * 2));
            st.cd = 15;
            return;
        }
    } catch (e) {
        console.log('[PsychicScroll] 客户端tick异常: ' + e);
    }
}

StartupEvents.registry('entity_type', event => {
    event.create('rainbow:psychic_scroll', 'entityjs:nonliving')
        // 与渲染裁剪；isPickable/canBeCollidedWith 均为 false，不影响抛射物
        // 命中检测与实体通行——偏转由墙 tick 的前瞻检测触发，与碰撞箱无关
        .sized(1.0, 1.0)
        .clientTrackingRange(10)
        .updateInterval(1)
        .mobCategory('misc')
        // 无需 isAttackable/isInvulnerableTo/isPushable/canBeCollidedWith 回调：
        // Entity 基类默认即 attackable=false / hurt=false / pushable=false /
        // canBeCollidedWith=false / isPickable=false，与 DI 心理墙完全一致
        .modelResource(entity => "rainbow:geo/entity/psychic_scroll.geo.json")
        .textureResource(entity => "rainbow:textures/item/kuchiyosenojutsu.png")
        // 生命周期计数用 persistentData（同 kuchiyose：tickCount/age 在 Rhino 不可靠）
        .tick(entity => {
            try {
                var level = entity.getLevel();
                if (level.isClientSide()) {
                    // 客户端分支：本机玩家本地应用增速
                    psychicScrollClientTick(entity);
                    return;
                }
                var data = entity.getPersistentData();
                var t = data.getLong('pwTicks');
                t = t + 1;
                data.putLong('pwTicks', t);
                if (t == 1) {
                    // 一次性诊断：确认 tick 回调执行 + global 函数可见性
                    // console.log('[PsychicScroll] 实体tick运行, globalFn='
                    //     + (typeof global.psychicWallTick));
                }
                if (typeof global.psychicWallTick == 'function') {
                    global.psychicWallTick(entity, t);
                }
            } catch (e) {
                console.log('[PsychicScroll] 实体tick异常: ' + e);
            }
        })
});
