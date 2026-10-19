// priority: 5000
// 汉剑由 KubeJS 注册：保留铁剑属性、Geo 外观与无限耐久，并在近战命中时触发低血量斩杀。
StartupEvents.registry('item', event => {
    event.create('rainbow:han_sword', 'anim_sword')
        .displayName('汉剑')
        .unstackable()
        .maxDamage(0)
        .tier(Tiers.IRON)
        .attackDamageBaseline(3.0)
        .speedBaseline(-2.4)
        .geoModel(geo => {
            try {
                geo.setSimpleModel('rainbow:geo/item/han_sword.geo.json')
                geo.setSimpleTexture('rainbow:textures/item/han_sword.png')
                geo.setSimpleAnimation('rainbow:animations/item/han_sword.animation.json')
            }
            catch (e) {
                console.log('[汉剑] 注册 Geo 模型失败：')
                console.log(e)
            }
        })
})

// 汉剑由 KubeJS 独立注册，并加入原版战斗用品标签。
StartupEvents.modifyCreativeTab('minecraft:combat', event => {
    try {
        event.add([Item.of('rainbow:han_sword')])
    }
    catch (e) {
        console.log('[汉剑] 加入原版战斗用品标签失败：')
        console.log(e)
    }
})

// 伤害已完成护甲、药水和吸收结算；目标当前生命严格低于 25% 时，将本次汉剑近战伤害提高到足以致死。
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDamageEvent', event => {
    try {
        let target = event.getEntity()
        let source = event.getSource()
        if (target == null || source == null || target.level == null || target.level.isClientSide()) return
        if (!target.isAlive() || event.isCanceled() || event.getAmount() <= 0) return

        let player = source.getEntity()
        if (!(player instanceof Player) || String(source.msgId()) !== 'player') return
        let mainHand = player.getItemInHand('main_hand')
        if (mainHand == null || mainHand.id !== 'rainbow:han_sword') return

        let health = target.getHealth()
        let maxHealth = target.getMaxHealth()
        if (health <= 0 || maxHealth <= 0 || health >= maxHealth * 0.25) return

        // 保留原近战伤害来源，使击杀、掉落和经验仍由原攻击流程结算。
        event.setAmount(Math.max(event.getAmount(), health))
        // 其他饰品仍可在本事件后限制伤害；下一 tick 确认目标已死亡才播放斩杀反馈。
        let level = target.level
        let x = target.getX()
        let y = target.getY()
        let z = target.getZ()
        player.server.scheduleInTicks(1, () => {
            try {
                if (target.isAlive()) return
                player.displayClientMessage(Component.literal('§c汉剑斩杀！'), true)
                level.playSound(null, x, y, z,
                    SoundEvents.PLAYER_ATTACK_CRIT, SoundSource.PLAYERS, 1.0, 0.75)
            }
            catch (feedbackError) {
                console.log('[汉剑] 斩杀反馈播放失败：')
                console.log(feedbackError)
            }
        })
    }
    catch (e) {
        console.log('[汉剑] 低血量斩杀处理失败：')
        console.log(e)
    }
})
