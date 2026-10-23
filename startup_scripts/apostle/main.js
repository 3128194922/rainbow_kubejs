// 使徒实体与弹幕实体统一在此功能入口注册；tick 回调直接取 level，避免 Rhino 重复声明冲突。
// 动画控制器异常只记录一次；命中回调只抽样记录，用于定位弹幕未伤害的问题。
const APOSTLE_ANIMATION_RUNTIME = { controllerErrorLogged: false };
const APOSTLE_HIT_TRACE = { count: 0 };
// 与服务端 1–13 式编号一致；每招独立单次动作，时长对应招式持续时间。
const APOSTLE_CAST_ANIMATION_NAMES = ['rapid', 'fan', 'ring', 'door', 'lightning', 'wall', 'spiral', 'rain', 'dash', 'slam', 'laser', 'zones', 'summon_danmaku'];
StartupEvents.registry('entity_type', event => {
    // 村民变种使徒：使用 Blockbench 几何体、白金配色贴图和 GeckoLib 动画资源。
    let apostleBuilder = event.create('rainbow:apostle', 'entityjs:mob')
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
                // 从客户端 GeckoLib 控制器读播放状态，不依赖未同步的服务端 persistentData。
                // 战斗动作接管全身骨骼时暂停步态，避免施法中腿部仍在走路。
                let animatedEntity = animationEvent.getEntity();
                let controllers = animatedEntity.getAnimatableInstanceCache().getManagerForId(animatedEntity.getId()).getAnimationControllers();
                for (let index = 1; index <= APOSTLE_CAST_ANIMATION_NAMES.length; index++) {
                    let actionController = controllers.get('apostle_move_' + index);
                    if (actionController != null && actionController.isPlayingTriggeredAnimation()) return false;
                }
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
    // 零过渡 tick 保持释放关键帧与服务端时序一致；每段动画自身包含收势。
    for (let index = 0; index < APOSTLE_CAST_ANIMATION_NAMES.length; index++) {
        apostleBuilder.addTriggerableAnimationController('apostle_move_' + (index + 1), 0,
            'animation.apostle.' + APOSTLE_CAST_ANIMATION_NAMES[index], 'cast', 'PLAY_ONCE');
    }
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
                // Rhino 2001.2.3 在此回调的局部 const 初始化时报 redeclaration，导致伤害分支未执行。
                let projectile = context.entity;
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

// 为 EntityJS 的 PathfinderMob 注册完整基础属性；回调内使用 let，避免 Rhino 局部 const 初始化冲突。
EntityJSEvents.createAttributes(event => {
    try {
        let apostleType = ForgeRegistries.ENTITY_TYPES.getValue(new ResourceLocation('rainbow:apostle'));
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
