// 使徒实体与弹幕实体统一在此功能入口注册，AI 实现在 server_scripts/apostle/main.js。
StartupEvents.registry('entity_type', event => {
    // 村民变种使徒：使用 Blockbench 几何体与白金配色贴图。
    event.create('rainbow:apostle', 'entityjs:mob')
        .mobCategory('monster')
        .sized(0.6, 1.95)
        .clientTrackingRange(10)
        .updateInterval(2)
        .modelResource(entity => 'rainbow:geo/entity/apostle.geo.json')
        .textureResource(entity => 'rainbow:textures/entity/apostle.png')
        .eggItem(item => {
            item.backgroundColor(0xDED7C5);
            item.highlightColor(0xC99A25);
        })
        .tick(entity => {
            try {
                const level = entity.getLevel();
                if (level.isClientSide()) return;
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
                const level = projectile.getLevel();
                if (level.isClientSide()) return;
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
                const level = projectile.getLevel();
                if (level.isClientSide()) return;
                if (typeof global.apostleProjectileHit == 'function') {
                    global.apostleProjectileHit(projectile, context.result.getEntity());
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
