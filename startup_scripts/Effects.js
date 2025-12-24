// priority: 1000
StartupEvents.registry("mob_effect", event => {
    event.create("rainbow:democratic_save")
        .beneficial() // 标记为有益效果
        .color(0xFFFF00) // 设置颜色为黄色
    event.create("rainbow:tag")
        .harmful()
        .color(0xFF0000)
    event.create("rainbow:manba")
        .beneficial() // 标记为有益效果
        .color(0xEAF044)
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

    event.create('rainbow:obey_command')
        .beneficial()
        .effectTick((mob, lvl) => {
            if (!mob || mob.level.isClientSide()) returnF
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

    event.create("rainbow:off_work_time")
    .beneficial() // 标记为有益效果

    event.create("rainbow:power_sword")
        .beneficial() // 标记为有益效果
        .color(0xEAF044)
    event.create("rainbow:resilience")
        .beneficial()
        .color(0xEAF044)
        .modifyAttribute("generic.attack_damage", "resilience", 1.5, "multiply_total") // 每级攻击力提升 1.5 倍
        .modifyAttribute("l2damagetracker:damage_reduction", "resilience", 0.5, "addition") // 每级额外增加 0.5 的减伤
    event.create("rainbow:damage_num")
        .beneficial() // 标记为有益效果
        .color(0xEAF044)
    event.create("rainbow:evil_eye")
        .harmful()
        .color(0xAA00FF)
        .effectTick((living, amplifier) => { })
    event.create("rainbow:dismember")
        .harmful()
        .color(0xEAF044)
        .modifyAttribute("minecraft:generic.max_health", "dismember", 0.05, "multiply_total")
    event.create("rainbow:apty4869")
        .beneficial()
        .color(0xEAF044)
        .effectTick((living, amplifier) => {
            let tag = living.getNbt();
            let age = tag.getInt("Age");
            let tick = (amplifier+1) * 100;

            if (age == 0) return;
            if (age % 20 !== 0) return;
    
            // 幼崽成长加速
            if (age < 0) {
                tag.putInt("Age",age + tick)
                living.setNbt(tag)
            }
            else
            if (age > 0) {
                tag.putInt("Age",age - tick)
                living.setNbt(tag)
            }
        })
    
    
    /*
    event.create("rainbow:youkaified") 
    .tag("minecraft:neutral")
    .color(0x8A5A83)
    .modifyAttribute("generic.movement_speed","youkaified",0.3,"multiply_total")
    .modifyAttribute("generic.attack_damage","youkaified",0.5,"multiply_total")
    .modifyAttribute("minecraft:generic.max_health","youkaified",20,"addition")
    .effectTick(event => {
        if(event.age % 20) return;
        event.getFoodData().setExhaustion(event.getFoodData().getExhaustionLevel() + 1)
    })*/
});