let $LivingTickEvent = Java.loadClass("net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent")
let $LivingDamageEvent = Java.loadClass("net.minecraftforge.event.entity.living.LivingDamageEvent")
let $WitherHomingMissile = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Wither_Homing_Missile_Entity')
let $IAnimatedEntity = Java.loadClass('com.github.L_Ender.lionfishapi.server.animation.IAnimatedEntity')
let $AnimationHandler = Java.loadClass('com.github.L_Ender.lionfishapi.server.animation.AnimationHandler')
let $TheHarbinger = Java.loadClass('com.github.L_Ender.cataclysm.entity.AnimationMonster.BossMonsters.The_Harbinger_Entity')
let $ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
let $ModEntities = Java.loadClass('com.github.L_Ender.cataclysm.init.ModEntities')
let $WitherMissile = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Wither_Missile_Entity')

function HarbingerDestructionMode(entity){
    if(entity.type=='cataclysm:the_harbinger'&&!entity.persistentData.harbingerDestructionMode){
        entity.setCustomName(Text.darkRed("先驱者，毁灭模式"))
        entity.mergeNbt({ Attributes: [{ Base: 90, Name: "minecraft:generic.follow_range" }] })
        entity.setItemSlot('mainhand','minecraft:netherite_axe')
        entity.persistentData.harbingerDestructionMode=true
        entity.persistentData.HowitzerSkillCooldown=false
        entity.persistentData.putInt('EMPCooldown',800)
        entity.persistentData.putInt('ChargeNumber',0)
        entity.persistentData.putInt('FiveChargeCooldown',600)
        entity.setMaxHealth(entity.getMaxHealth()*1.5-410)
        entity.setHealth(entity.getMaxHealth())
        entity.setNbt(entity.nbt)
    }
}

function prowlerNightmareShredder(entity){
    if(entity.type == 'cataclysm:the_prowler'&&!entity.persistentData.prowlerNightmareMode){
        entity.setCustomName(Text.darkRed("徘徊者，噩梦绞肉锯"))
        entity.persistentData.prowlerNightmareMode= true
        entity.persistentData.putInt('SummonNumber',0)
        entity.setItemSlot('mainhand','minecraft:netherite_axe')
        entity.setMaxHealth(entity.getMaxHealth()*1.3875-320)
        entity.setHealth(entity.getMaxHealth())
        entity.setNbt(entity.nbt)
    }
}

function SummonFlyWatcher(entity){
    entity.level.playSound(null, entity.getX(), entity.getY(), entity.getZ(), "cataclysm:harbinger_prepare", "hostile", 2, 1)
    let watcher = entity.level.createEntity('cataclysm:the_watcher')
       watcher.setNoGravity(true)
       watcher.setPosition(entity.x,entity.y+2.8,entity.z)
       watcher.setCustomName(Text.darkRed("观测者，浮游炮I型"))
       watcher.setMaxHealth(50)
       watcher.setHealth(50)
       watcher.mergeNbt({ Attributes: [{ Base: 14, Name: "minecraft:generic.armor" }] })
       watcher.persistentData.WatcherFlyMode=true
       if(entity.getTarget()!==null){watcher.setTarget(entity.getTarget())}
       watcher.potionEffects.add('minecraft:resistance',50,4,false,false)
       watcher.spawn()
}

function SummonFlyWatcherII(entity,x,y,z){
    entity.level.playSound(null, entity.getX(), entity.getY(), entity.getZ(), "cataclysm:harbinger_prepare", "hostile", 2, 1)
    let watcherII = entity.level.createEntity('cataclysm:the_watcher')
    watcherII.setPosition(x,y,z)
    watcherII.setNoGravity(true)
    watcherII.setMaxHealth(80)
    watcherII.setHealth(80)
    watcherII.setCustomName(Text.darkRed("观测者，浮游炮II型"))
    watcherII.persistentData.WatcherFlyModeII=true
    if(!entity.isPlayer()){
        if(entity.getTarget()!==null){watcherII.setTarget(entity.getTarget())}
    } 
    watcherII.mergeNbt({ Attributes: [{ Base: 16, Name: "minecraft:generic.armor" }] })
    watcherII.mergeNbt({ Attributes: [{ Base: 80, Name: "minecraft:generic.follow_range" }] })
    watcherII.potionEffects.add('minecraft:resistance',50,4,false,false)
    watcherII.spawn()
}
let EmpAttackBlackList=[
    'cataclysm:the_harbinger',
    'cataclysm:the_watcher',
    'cataclysm:the_prowler'
]
function HarbingerEMPAttack(entity){
    if(entity.type=='cataclysm:the_harbinger'&&entity.persistentData.harbingerDestructionMode
        &&entity.getAnimation()==$IAnimatedEntity.NO_ANIMATION&&entity.age%60==0&&
        entity.getHealth()<entity.getMaxHealth()*0.5&&entity.persistentData.getInt('EMPCooldown')<=0&&entity.isAlive()){
        $AnimationHandler.INSTANCE.sendAnimationMessage(entity,$TheHarbinger.STUN_ANIAMATION)
        entity.level.playSound(null, entity.getX(), entity.getY(), entity.getZ(), "cataclysm:harbinger_deathlaser_prepare", "hostile", 1, 1)
        if(entity.getAnimation()!==$TheHarbinger.STUN_ANIAMATION) return
        entity.level.server.scheduleInTicks(65, () =>{
            let EMPAttack = entity.damageSources().source($ResourceKey.create(Registries.DAMAGE_TYPE, "cataclysm:emp"), entity, entity)
            entity.level.getEntitiesWithin(AABB.ofBlock(entity.block.pos).inflate(20.0)).forEach(target=>{
            if(target.isLiving() && target!=entity && !EmpAttackBlackList.includes(target.getType())){
            target.attack(EMPAttack,50+target.getMaxHealth()*0.2)
            target.potionEffects.add('attributeslib:sundering',400,2)
            target.invulnerableTime=0
            let d0 = target.getX() - entity.getX();
            let d1 = target.getZ() - entity.getZ();
            let d2 = d0*d0 + d1*d1
            target.setDeltaMovement(new Vec3d(d0 / d2*4 , 0.2, d1 / d2*4 ).scale(4.0))
            target.hurtMarked=true
            }
            })
            for(let i = 0; i < 8;i++){
            let x = entity.x + 8 * Math.cos(i);
            let z = entity.z + 8 * Math.sin(i);
            let y = entity.y;
            entity.level.createExplosion(x,y+0.5,z)
            .strength(3)
            .explosionMode('none')
            .exploder(entity)
            .explode()
        }
        entity.level.server.scheduleInTicks(10,()=>{
            for(let i = 0; i < 16;i++){
            let x = entity.x + 15 * Math.cos(i);
            let z = entity.z + 15 * Math.sin(i);
            let y = entity.y;
            entity.level.createExplosion(x,y+0.5,z)
            .strength(3)
            .explosionMode('none')
            .exploder(entity)
            .explode()
        }
        })
            entity.level.playSound(null, entity.getX(), entity.getY(), entity.getZ(), "minecraft:item.totem.use", "hostile", 1, 1)
            $AnimationHandler.INSTANCE.sendAnimationMessage(entity,$TheHarbinger.LAUNCH_ANIAMATION)
        })
        entity.persistentData.putInt('EMPCooldown',800)
    }
}

/**
 * 
 * @param {Internal.LivingEntity_} entity 
 * @param {number} radius 
 * @param {number} height 
 * @param {boolean} dropItems 
 */
function MobBreakBlock(entity, radius, height, dropItems){
    let level = entity.level;
    let centerX = Math.floor(entity.getX());
    let centerY = Math.floor(entity.getY());
    let centerZ = Math.floor(entity.getZ());
    let r = radius;
    let h = height;
    for (let x = -r; x <= r; x++) {
    for (let z = -r; z <= r; z++) {
    for (let y = 0; y < h; y++) {
    let blockPos = new BlockPos(
        centerX + x,
        centerY + y,
        centerZ + z
        );
        let BlockHardness = level.getBlockState(blockPos).getDestroySpeed(null, blockPos);
        let getBlockId = level.getBlock(blockPos).getId()
        let BlockBlackList=[
            'minecraft:reinforced_deepslate'
        ]
        if(BlockHardness>=0&&!getBlockId.includes(BlockBlackList)){
        level.destroyBlock(blockPos, dropItems);
        }
    }
    }
    }
}
EntityEvents.spawned(event=>{
    let Entity = event.entity;
    let Level = event.level
    if(Level.name.getString()==="minecraft:the_nether"){
        prowlerNightmareShredder(Entity)
        HarbingerDestructionMode(Entity)
    }
})
EntityEvents.death(event=>{
    let Entity = event.entity;
    let Level = event.level;
    if(Entity.type=='cataclysm:the_harbinger'&&Entity.persistentData.harbingerDestructionMode){
        Level.server.scheduleInTicks(130, () => {
            let LootMechStar = Level.createEntity('item')
            LootMechStar.setPosition(Entity.x,Entity.y+2.5,Entity.z)
            LootMechStar.item = Item.of('firelight:mech_star')
            LootMechStar.setGlowing(true)
            LootMechStar.spawn()
        })
    }
    if(Entity.type=='cataclysm:the_prowler'&&Entity.persistentData.prowlerNightmareMode){
    Level.server.scheduleInTicks(40, () => {
    Level.createExplosion(Entity.x,Entity.y,Entity.z)
    .causesFire(true)
    .strength(5)
    .explosionMode('none')
    .exploder(Entity)
    .explode()
    let LootSmithingTemplate = Level.createEntity('item')
    LootSmithingTemplate.setPosition(Entity.x,Entity.y+2.5,Entity.z)
    LootSmithingTemplate.item = Item.of('firelight:witherite_smithing_template')
    LootSmithingTemplate.setGlowing(true)
    LootSmithingTemplate.spawn()
})
}
})
EntityEvents.hurt(event=>{
    let Entity = event.entity;
    let Attacker = event.source.actual;
    let DamageType = event.source.getType().toString();
    let Indirect = event.source.immediate;
    if(Attacker &&Entity.isLiving() && Attacker.isLiving()){
    if(Attacker.persistentData.WatcherFlyMode&&Attacker.type=='cataclysm:the_watcher'
        &&Entity.type=='cataclysm:the_prowler'&&Entity.persistentData.prowlerNightmareMode){
            event.cancel()
        }
        if(Attacker.persistentData.WatcherFlyModeII&&Attacker.type=='cataclysm:the_watcher'
        &&Entity.type=='cataclysm:the_harbinger'&&Entity.persistentData.harbingerDestructionMode){
            event.cancel()
        }
        if(Attacker.type=='cataclysm:the_harbinger'&&Attacker.persistentData.harbingerDestructionMode){
        if(Indirect.getType()=='cataclysm:wither_missile'||Indirect.getType()=='cataclysm:wither_homing_missile'){
            if(DamageType=='mob'){
            Entity.invulnerableTime=0
            Entity.potionEffects.add('attributeslib:sundering',150,1)
            }
        }
         if(Indirect.getType()=='cataclysm:laser_beam'){
            Entity.potionEffects.add('attributeslib:detonation',35,0)
            Entity.invulnerableTime=0
        }
        }
    }
})
NativeEvents.onEvent($LivingDamageEvent,event=>{
    let Mobs = event.entity
    let Attacker = event.source.actual
    let DamageType = event.source.getType().toString()
    let Target = Mobs.target
    let ProwlerBlackList=[
        'cataclysm:the_harbinger',
        'cataclysm:the_watcher',
        'cataclysm:the_prowler'
    ]
    if(Mobs.type=='cataclysm:the_harbinger'&&Mobs.persistentData.harbingerDestructionMode){
        if(Mobs.getHealth()<Mobs.getMaxHealth()*0.5&&DamageType=='cataclysm.emp'
        &&Mobs.getAnimation()!==$TheHarbinger.DEATHLASER_ANIMATION){
            $AnimationHandler.INSTANCE.sendAnimationMessage(Mobs,$TheHarbinger.LAUNCH_ANIAMATION)
            Mobs.potionEffects.add('minecraft:resistance',666,2,false,false)
            event.setCanceled(true)
        }
    }
    if(Attacker &&Mobs.isLiving() && Attacker.isLiving()&&
    Mobs!==null&&Attacker!==null&&Target!==null){
        if(Mobs.type=='cataclysm:the_harbinger'&&Mobs.persistentData.harbingerDestructionMode){
        if(Mobs.getHealth()<Mobs.getMaxHealth()*0.5){
            event.setAmount(event.getAmount()*0.6)
        }
        }
        if(Attacker.type=='cataclysm:the_prowler'&&DamageType=='cataclysm.shredder'&&
            Attacker.persistentData.prowlerNightmareMode
            &&!ProwlerBlackList.includes(Mobs.type)
        ){
            Attacker.heal(16)
            Mobs.potionEffects.add('attributeslib:bleeding',270,2)
        }
        if(Mobs.type=='cataclysm:the_prowler'&&Mobs.persistentData.prowlerNightmareMode){
            if(event.getAmount()>33.3){event.setAmount(33.3)}
        }
    }
    if(Mobs.type=='cataclysm:the_prowler'&&Mobs.persistentData.prowlerNightmareMode){
        MobBreakBlock(Mobs,2,3,true)
}
})
NativeEvents.onEvent($LivingTickEvent,event=>{
    let Mobs = event.entity;
    let target = Mobs.target
    if(Mobs == null) return
    if(Mobs.type=='cataclysm:the_harbinger'&&Mobs.persistentData.harbingerDestructionMode){
        if(Mobs.age%18==0){
            Mobs.level.server.runCommandSilent(`/execute at ${Mobs.getUuid().toString()} run particle minecraft:dust 1 0 0 2 ~ ~2 ~ 1 1 1 5 64 force`)
        }
        let getEmpCooldown = Mobs.persistentData.getInt('EMPCooldown')
        Mobs.persistentData.putInt('EMPCooldown',getEmpCooldown-1)
        Mobs.persistentData.putInt('FiveChargeCooldown',Mobs.persistentData.getInt('FiveChargeCooldown')-1)
        if(target == null) return
        if(target&&Mobs!==target&&target.getHealth()>0){
            HarbingerEMPAttack(Mobs)
        }
    }
})

NativeEvents.onEvent($LivingTickEvent,event=>{
    let entity = event.entity;
    let target = entity.target;
    if(entity==null||target==null||!entity.isAlive())return
    if(entity.type=='cataclysm:the_harbinger'&&entity.persistentData.harbingerDestructionMode){
        if(entity.persistentData.getInt('FiveChargeCooldown')<=0&&entity.persistentData.getInt('ChargeNumber')<6&&
        entity.getAnimation()==$IAnimatedEntity.NO_ANIMATION&&entity.getHealth()<=entity.getMaxHealth()*0.42){
            if(entity.persistentData.getInt('ChargeNumber')>=1){
                entity.level.playSound(null, entity.getX(), entity.getY(), entity.getZ(), "cataclysm:harbinger_charge_prepare", "hostile", 3, 1)
            }
            if(entity.getAnimation()!==$TheHarbinger.CHARGE_ANIMATION){
                $AnimationHandler.INSTANCE.sendAnimationMessage(entity,$IAnimatedEntity.NO_ANIMATION)
            }
            entity.potionEffects.add('minecraft:glowing',80,0,false,false)
            $AnimationHandler.INSTANCE.sendAnimationMessage(entity,$TheHarbinger.CHARGE_ANIMATION)
            entity.persistentData.putInt('ChargeNumber',entity.persistentData.getInt('ChargeNumber')+1)
        }
        if(entity.persistentData.getInt('ChargeNumber')>=6){
            entity.persistentData.putInt('FiveChargeCooldown',600)
            entity.persistentData.putInt('ChargeNumber',0)
        }
    }
})

NativeEvents.onEvent($LivingTickEvent,event=>{
    let Mobs = event.entity
    let target = Mobs.target
    let directionVec3 = Vec3d.directionFromRotation(Mobs.getRotationVector())
    if(Mobs == null || target == null || target==undefined) return
    if(target){
    if(Mobs.type=='cataclysm:the_prowler'&&Mobs.persistentData.prowlerNightmareMode){
        let getSummonNumber = Mobs.persistentData.getInt('SummonNumber')
        if(Mobs.age%260==0&&getSummonNumber<16){
            SummonFlyWatcher(Mobs)
            Mobs.persistentData.putInt('SummonNumber',getSummonNumber+1)
        }
    }
    if(Mobs.type=='cataclysm:the_watcher'&&Mobs.persistentData.WatcherFlyMode){
        let targetY = target.y + target.getEyeHeight() + 3.5;
        let dy = targetY - Mobs.y;
        Mobs.move('self', new Vec3d(0, dy > 0 ? 0.175 : -0.35, 0));
    }
    if(Mobs.type=='cataclysm:the_watcher'&&Mobs.persistentData.WatcherFlyModeII){
        let targetY = target.y + target.getEyeHeight() + 4.0;
        let dy = targetY - Mobs.y;
        Mobs.move('self', new Vec3d(0, dy > 0 ? 0.175 : -0.35, 0));
        let dx = target.x-Mobs.x;
        let dz = target.z - Mobs.z;
        let dh = dx*dx+dz*dz
        if(Mobs.age%80==0){
        if(target.isAlive()){
        let missile = new $WitherHomingMissile(Mobs, directionVec3, Mobs.level,30,target)
        Mobs.level.playSound(null, Mobs.getX(), Mobs.getY(), Mobs.getZ(), "cataclysm:rocket_launch", "hostile", 2, 1)
        missile.spawn()
        }
        }
        if(dh>=9*9&&Mobs.age%100==0){
            for (let wave = 0; wave < 40; wave++) {
                Mobs.level.server.scheduleInTicks(wave, () => {
                     Mobs.move('self', (new Vec3d(dx,0,dz)).scale(0.007))
                })
            }
        }
    }
    if(Mobs.nbt.getBoolean('Is_Act')==false||Mobs.getAnimation()==$TheHarbinger.STUN_ANIAMATION) return
    if(Mobs.type=='cataclysm:the_harbinger'&&Mobs.persistentData.harbingerDestructionMode){
        if(Mobs.getAnimation()!==$TheHarbinger.CHARGE_ANIMATION){
        if(Mobs.getHealth()>Mobs.getMaxHealth()*0.5){
        let NormaltargetY = target.y + target.getEyeHeight()+5;
        let dy = NormaltargetY - Mobs.y;
        Mobs.move('self', new Vec3d(0, dy > 0 ? 0.5 : -0.85, 0));
        }
        }
        else{
            let ChargeTargetY = target.y + target.getEyeHeight()+3.35
            let dy2 = ChargeTargetY - Mobs.y;
            Mobs.move('self', new Vec3d(0, dy2 > 0 ? 0.5 : -0.5, 0));
            if(Mobs.persistentData.HowitzerSkillCooldown==false&&Mobs.distanceToSqr(target)<=16){
                if(Mobs.getHealth()<Mobs.getMaxHealth()*0.66){
                    SummonFlyWatcherII(Mobs,Mobs.x,Mobs.y+Mobs.getEyeHeight(),Mobs.z)
                }
                Mobs.level.playSound(null, Mobs.getX(), Mobs.getY(), Mobs.getZ(), "cataclysm:rocket_launch", "hostile", 1, 1)
                let Howitzer = Mobs.level.createEntity('cataclysm:wither_howitzer')
                Howitzer.setOwner(Mobs)
                Howitzer.setPosition(Mobs.x,Mobs.y+3,Mobs.z)
                Howitzer.mergeNbt({radius:5})
                Howitzer.spawn()
                Mobs.persistentData.HowitzerSkillCooldown=true
                Mobs.level.server.scheduleInTicks(40, () => {Mobs.persistentData.HowitzerSkillCooldown=false})
            }
        }
        if(Mobs.isMoving()||Mobs.getAnimation()==$TheHarbinger.CHARGE_ANIMATION){
            MobBreakBlock(Mobs,2,5,false)
        }
        }
}
})