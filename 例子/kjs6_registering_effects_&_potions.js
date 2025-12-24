const $EntityType = Java.loadClass("net.minecraft.world.entity.EntityType")
const $MobEffect = Java.loadClass("net.minecraft.world.effect.MobEffect")
const $MobEffectCategory = Java.loadClass("net.minecraft.world.effect.MobEffectCategory")
const $BasicMobEffect$Builder = Java.loadClass("dev.latvian.mods.kubejs.misc.BasicMobEffect$Builder")
const $PotionBuilder = Java.loadClass("dev.latvian.mods.kubejs.misc.PotionBuilder")
const $ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries");

const $DeferredRegisterCreate = Java.loadClass("net.minecraftforge.registries.DeferredRegister")[
    "create(net.minecraftforge.registries.IForgeRegistry,java.lang.String)"
]

/** @type {Internal.DeferredRegister} */
const rainbow_MOB_EFFECTS = $DeferredRegisterCreate($ForgeRegistries.MOB_EFFECTS, "rainbow")
/** @type {Internal.DeferredRegister} */
const rainbow_POTIONS = $DeferredRegisterCreate($ForgeRegistries.POTIONS, "rainbow")
rainbow_MOB_EFFECTS.register(ForgeModEvents.eventBus())
rainbow_POTIONS.register(ForgeModEvents.eventBus())
let beneficialEffects = Utils.lazy(() => $ForgeRegistries.MOB_EFFECTS.getValues().filter(effect => effect.isBeneficial()))
let BREEDING_EFFECT = '';
StartupEvents.init(event => {
    const maturingEffectBuilder = new $BasicMobEffect$Builder("rainbow:maturing")
        .effectTick((entity, lvl) => global.maturingEffect(entity, lvl))
        .beneficial()
        .color(Color.rgba(136, 97, 34, 1));
    const MATURING_EFFECT = rainbow_MOB_EFFECTS.register("maturing", () => maturingEffectBuilder.createObject());
    const ageingPotionBuilder = Utils.lazy(() => 
        new $PotionBuilder("rainbow:ageing").effect(MATURING_EFFECT.get(), 60, 0).effect("minecraft:haste", 600, 0));
    const AGEING_POTION = rainbow_POTIONS.register("ageing", () => ageingPotionBuilder.get().createObject());

    const immaturingEffectBuilder = new $BasicMobEffect$Builder("rainbow:immaturing")
        .effectTick((entity, lvl) => global.immaturingEffect(entity, lvl))
        .beneficial()
        .color(Color.rgba(17, 206, 14, 1));
    const IMMATURING_EFFECT = rainbow_MOB_EFFECTS.register("immaturing", () => immaturingEffectBuilder.createObject());
    const rejuvenatingPotionBuilder = Utils.lazy(() => 
        new $PotionBuilder("rainbow:rejuvenating").effect(IMMATURING_EFFECT.get(), 60, 0));
    const REJUVENATING_POTION = rainbow_POTIONS.register("rejuvenating", () => rejuvenatingPotionBuilder.get().createObject());
  
    const breedingEffectBuilder = new $BasicMobEffect$Builder("rainbow:breeding")
        .effectTick((entity, lvl) => global.breedingEffect(entity, lvl))
        .beneficial()
        .color(Color.rgba(254, 128, 134, 1));
    BREEDING_EFFECT = rainbow_MOB_EFFECTS.register("breeding", () => breedingEffectBuilder.createObject());
    const breedingPotionBuilder = Utils.lazy(() => 
        new $PotionBuilder("rainbow:breeding").effect(BREEDING_EFFECT.get(), 30 * 20, 0));
    const BREEDING_POTION = rainbow_POTIONS.register("breeding", () => breedingPotionBuilder.get().createObject());

}) 



global.maturingEffect = (entity, lvl) => {
    if (entity.level.clientSide){
        entity.removeEffect('rainbow:maturing');
        return;
    } 
    if (entity.type == 'minecraft:tadpole'){
        //console.log(entity);
        entity.convertTo($EntityType.FROG, false);
        entity.setAge(0);
    } else if (entity.type == 'minecraft:guardian'){
        entity.convertTo($EntityType.ELDER_GUARDIAN, false)
    } else if (entity.setAge && entity.isBaby()){
        entity.setAge(0);
        entity.removeEffect('rainbow:maturing');
    } else {
        entity.removeEffect('rainbow:maturing');
    }
}

global.immaturingEffect = (entity, lvl) => {
    if (entity.level.clientSide){
        entity.removeEffect('rainbow:immaturing')
        return;
    } 
    if (entity.type == 'minecraft:frog'){
        entity.convertTo($EntityType.TADPOLE, false);
        entity.setAge(-24000);
    } else if (entity.type == 'minecraft:elder_guardian'){
        entity.convertTo($EntityType.GUARDIAN, false);
    } else if (entity.setAge && !entity.isBaby()){
        entity.setAge(-24000);
        entity.removeEffect('rainbow:immaturing');
    } else {
        entity.removeEffect('rainbow:immaturing');
    }
}

const $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
const $Animal = Java.loadClass("net.minecraft.world.entity.animal.Animal")
const $Player = Java.loadClass("net.minecraft.world.entity.player.Player")
const  $Villager = Java.loadClass("net.minecraft.world.entity.npc.Villager")

global.breedingEffect = (entity, lvl) => {
    if (entity instanceof $LivingEntity) {
        let dur = entity.getEffect(BREEDING_EFFECT.get()).duration
        let ntk = 80 >> lvl
        if (ntk == 0 || dur % ntk == 0){
            if (entity instanceof $Player) {
                entity.getFoodData().eat(1, 1.0);
            } else if (entity.getHealth() < entity.getMaxHealth()) {
                entity.heal(1.0);
            }
            if (entity instanceof $Animal && !entity.isBaby() && entity.canFallInLove()) {
                if (entity.getAge() >= 0) {
                    if (entity.getAge() > 0) entity.setAge(0); 
                    entity.setInLove(null);
                    entity.setInLoveTime(entity.getInLoveTime());
                }
            }
            if (entity instanceof $Villager && !entity.isBaby()) {
                if (entity.getAge() >= 0) {
                    if (entity.getAge() > 0) entity.setAge(0); 
                    if (entity.nbt.getByte("FoodLevel") < 12){
                        entity.server.runCommandSilent(`data merge entity ${entity.uuid} {FoodLevel : 30b}`);
                    }
                }
            }
        }
    }
}