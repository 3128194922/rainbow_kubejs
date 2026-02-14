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
