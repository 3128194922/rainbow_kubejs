// priority: 1000
// ==========================================
// 药水效果注册
// Potion Effect Registration
// ==========================================
// 注册自定义的药水效果，包括有益和有害效果
// Registers custom potion effects, including beneficial and harmful ones

// 注册自定义药水效果
StartupEvents.registry("mob_effect", event => {
    // 民主保佑：有益，黄色
    event.create("rainbow:democratic_save")
        .beneficial() // 标记为有益效果
        .color(0xFFFF00) // 设置颜色为黄色
    // 标记：有害，红色
    event.create("rainbow:tag")
        .harmful()
        .color(0xFF0000)
    // 曼巴：有益，淡黄色
    event.create("rainbow:manba")
        .beneficial() // 标记为有益效果
        .color(0xEAF044)
    // 嘲讽效果：有害，每20tick嘲讽周围生物攻击自己
    event.create('rainbow:taunt_effect')
        .harmful()
        .effectTick((mob, lvl) => {
            if (!mob || mob.level.isClientSide()) return
            if (mob.age % 20 != 0) return

            let mobAABB = mob.boundingBox.inflate(16)

            mob.level.getEntitiesWithin(mobAABB).forEach(entity => {
                if (!entity) return
                if (!entity.isLiving() || !entity.isAlive()) return

                // 跳过自己
                if (entity == mob) return

                // 跳过同队伍友军
                if (mob.team && entity.team && mob.team == entity.team) return

                // 跳过同一主人召唤物
                if (mob.persistentData.OwnerName && entity.persistentData.OwnerName
                    && mob.persistentData.OwnerName == entity.persistentData.OwnerName) return

                // 跳过 mob 的主人
                if (mob.owner && entity.id == mob.owner.id) return

                // 能设置目标时才嘲讽
                if (typeof entity.setTarget === 'function') {
                    entity.setTarget(mob)
                }
            })
        })

    // 服从命令：有益，使生物攻击被标记（tag）的目标
    event.create('rainbow:obey_command')
        .beneficial()
    
    // 杀戮欲望：有益，使生物攻击被标记（tag）的目标
    event.create('rainbow:killing_desire')
        .beneficial()
        .effectTick((mob, lvl) => {
            if (!mob || mob.level.isClientSide()) return
            if (mob.age % 20 != 0) return

            let now = mob.level.gameTime
            let lastRage = mob.persistentData.lastRageTick || 0
            let timeout = SecoundToTick(2)

            // 如果目标还存在且没超时，就不改
            if (mob.target && mob.target.isAlive() && (now - lastRage < timeout)) {
                return
            }

            // 否则重新找目标
            let mobAABB = mob.boundingBox.inflate(16)
            let candidates = mob.level.getEntitiesWithin(mobAABB).filter(entity => {
                if (!entity) return false
                if (!entity.isLiving() || !entity.isAlive()) return false
                if (entity == mob) return false
                if (!entity.hasEffect("rainbow:tag")) return false
                if (mob.team && entity.team && mob.team == entity.team) return false
                if (mob.persistentData.OwnerName && entity.persistentData.OwnerName
                    && mob.persistentData.OwnerName == entity.persistentData.OwnerName) return false
                if (mob.owner && entity.id == mob.owner.id) return false
                return true
            })

            if (candidates.length > 0 && typeof mob.setTarget === 'function') {
                let newTarget = candidates[Math.floor(Math.random() * candidates.length)] // 随机挑一个
                mob.setTarget(newTarget)
                mob.persistentData.lastRageTick = now
            }
        })

    // 下班时间：有益
    event.create("rainbow:off_work_time")
    .beneficial() // 标记为有益效果
    // 韧性：有益，增加攻击力和减伤
    event.create("rainbow:resilience")
        .beneficial()
        .color(0xEAF044)
        .modifyAttribute("generic.attack_damage", "resilience", 1.5, "multiply_total") // 每级攻击力提升 1.5 倍
        //.modifyAttribute("l2damagetracker:damage_reduction", "resilience", 0.5, "addition") // 每级额外增加 0.5 的减伤
    // 伤害积蓄：有益
    event.create("rainbow:damage_num")
        .beneficial() // 标记为有益效果
        .color(0xEAF044)
    // 肢解：有害，减少最大生命值
    /*event.create("rainbow:dismember")
        .harmful()
        .color(0xEAF044)
        .modifyAttribute("minecraft:generic.max_health", "dismember", 0.05, "multiply_total")
*/
    // 装填核心 Buff
    event.create("rainbow:reload_buff")
        .beneficial()
        .color(0x55FFFF)
        .effectTick((entity, amplifier) => {
            if (!entity || entity.level.isClientSide()) return;
            entity.cooldowns.removeCooldown('netherexp:shotgun_fist');
            entity.cooldowns.removeCooldown('netherexp:pump_charge_shotgun');
        })

    // 连射核心 Buff
    event.create("rainbow:short_buff")
        .beneficial()
        .color(0xFF55FF)
        .effectTick((entity, amplifier) => {
            if (!entity || entity.level.isClientSide()) return;
            if (entity.age % 20 != 0) return;
            let item = entity.getItemInHand("main_hand");
            if (item.id == 'species:crankbow') {
                if (item.nbt.getBoolean("IsUsing") == true) {
                    item.nbt.putInt("Speed", 40);
                }
            }
        })
});