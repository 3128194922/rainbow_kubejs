// 使徒实体与弹幕实体统一在此功能入口注册；tick 回调直接取 level，避免 Rhino 重复声明冲突。
// 动画控制器异常只记录一次；命中回调只抽样记录，用于定位弹幕未伤害的问题。
const APOSTLE_ANIMATION_RUNTIME = { controllerErrorLogged: false };
const APOSTLE_HIT_TRACE = { count: 0 };
StartupEvents.registry('entity_type', event => {
    // 村民变种使徒：使用 Blockbench 几何体、白金配色贴图和 GeckoLib 动画资源。
    event.create('rainbow:apostle', 'entityjs:mob')
        .mobCategory('monster')
        .sized(0.6, 1.95)
        .clientTrackingRange(10)
        .updateInterval(2)
        .modelResource(entity => 'rainbow:geo/entity/apostle.geo.json')
        .textureResource(entity => 'rainbow:textures/entity/apostle.png')
        .animationResource(entity => 'rainbow:animations/entity/apostle.animation.json')
        // 移动与待机共用基础控制器，按 EntityJS animation event 的移动状态自动切换循环。
        .addAnimationController('apostle_locomotion', 5, animationEvent => {
            try {
                if (animationEvent.isMoving()) {
                    animationEvent.thenLoop('animation.apostle.move');
                } else {
                    animationEvent.thenLoop('animation.apostle.idle');
                }
                return true;
            } catch (e) {
                if (!APOSTLE_ANIMATION_RUNTIME.controllerErrorLogged) {
                    APOSTLE_ANIMATION_RUNTIME.controllerErrorLogged = true;
                    console.log('[使徒] 移动/待机动画控制器异常: ' + e);
                }
                return true;
            }
        })
        // 召唤动作单独注册为服务端可触发的单次动画，避免影响移动/待机状态判断。
        .addTriggerableAnimationController('apostle_summon_controller', 2, 'animation.apostle.summon_danmaku', 'summon_danmaku', 'PLAY_ONCE')
        .eggItem(item => {
            item.backgroundColor(0xDED7C5);
            item.highlightColor(0xC99A25);
        })
        .tick(entity => {
            try {
                if (entity.getLevel().isClientSide()) return;
                if (typeof global.apostleTick == 'function') {
                    global.apostleTick(entity);
                }
            } catch (e) {
                console.log('[使徒] 实体 tick 异常: ' + e);
            }
        });
});

// 使徒弹珠使用独立 KubeJS 弹射物类型，命中由服务端回调结算。
StartupEvents.registry('entity_type', event => {
    event.create('rainbow:apostle_bullet', 'entityjs:projectile')
        .mobCategory('misc')
        .sized(0.16, 0.16)
        .clientTrackingRange(8)
        .updateInterval(1)
        .renderScale(0.45, 0.45, 0.45)
        .textureLocation(entity => 'rainbow:textures/item/apostle_bullet.png')
        .item(item => {
            item.texture('rainbow:item/apostle_bullet');
            item.displayName('使徒弹幕');
            item.maxStackSize(64);
        })
        .canHitEntity(target => {
            try {
                return typeof global.apostleIsValidTarget == 'function'
                    && global.apostleIsValidTarget(target);
            } catch (e) {
                console.log('[使徒] 弹幕目标筛选异常: ' + e);
                return false;
            }
        })
        .tick(projectile => {
            try {
                if (projectile.getLevel().isClientSide()) return;
                if (typeof global.apostleBulletTick == 'function') {
                    global.apostleBulletTick(projectile);
                }
            } catch (e) {
                console.log('[使徒] 弹珠 tick 异常: ' + e);
            }
        })
        .onHitEntity(context => {
            try {
                const projectile = context.entity;
                if (projectile.getLevel().isClientSide()) return;
                APOSTLE_HIT_TRACE.count++;
                if (APOSTLE_HIT_TRACE.count == 1 || APOSTLE_HIT_TRACE.count % 20 == 0) {
                    console.log('[使徒] 弹幕碰撞回调已触发，累计命中回调: ' + APOSTLE_HIT_TRACE.count);
                }
                if (typeof global.apostleProjectileHit == 'function') {
                    global.apostleProjectileHit(projectile, context.result.getEntity());
                } else {
                    console.log('[使徒] 弹幕命中回调已触发，但伤害处理函数未加载');
                }
            } catch (e) {
                console.log('[使徒] 弹珠命中处理异常: ' + e);
            }
        });
});

// 为 EntityJS 的 PathfinderMob 注册完整基础属性，避免使用空属性表。
EntityJSEvents.createAttributes(event => {
    try {
        const apostleType = ForgeRegistries.ENTITY_TYPES.getValue(new ResourceLocation('rainbow:apostle'));
        if (apostleType == null) {
            console.log('[使徒] 默认属性注册失败：找不到 rainbow:apostle 实体类型');
            return;
        }
        event.create(apostleType, attributes => {
            attributes.add('minecraft:generic.max_health', 40.0);
            attributes.add('minecraft:generic.movement_speed', 0.28);
            attributes.add('minecraft:generic.follow_range', 32.0);
            attributes.add('minecraft:generic.attack_damage', 4.0);
            attributes.add('minecraft:generic.armor', 4.0);
        });
    } catch (e) {
        console.log('[使徒] 默认属性注册异常: ' + e);
    }
});
