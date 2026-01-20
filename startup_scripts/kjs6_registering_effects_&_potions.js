// priority: 1000
// ==========================================
// 药水与酿造注册
// Potion & Brewing Registration
// ==========================================
// 注册新的药水类型（普通和延长版）以及自定义酿造配方
// Registers new potion types (normal and long) and custom brewing recipes

const $PotionBuilder = Java.loadClass("dev.latvian.mods.kubejs.misc.PotionBuilder")
const $ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries")
const $DeferredRegisterCreate = Java.loadClass("net.minecraftforge.registries.DeferredRegister")[
    "create(net.minecraftforge.registries.IForgeRegistry,java.lang.String)"
]

/** @type {Internal.DeferredRegister} */
const rainbow_POTIONS = $DeferredRegisterCreate($ForgeRegistries.POTIONS, "rainbow")
rainbow_POTIONS.register(ForgeModEvents.eventBus())

/**
 * 自动注册药水（普通 + 延长）
 *
 * @param {string} effectID 效果 ID，如 "attributeslib:flying"
 * @param {number} normalSec 普通药水秒数
 * @param {number} longSec 延长药水秒数
 */
function registerPotionPair(effectID, normalSec, longSec) {
    const idBase = effectID.split(":")[1] // flying
    const normalID = `${idBase}_potion`          // flying_potion
    const longID = `long_${idBase}_potion`       // long_flying_potion

    StartupEvents.init(event => {
        // 普通药水
        const normalBuilder = Utils.lazy(() =>
            new $PotionBuilder(`rainbow:${normalID}`)
                .effect(effectID, SecoundToTick(normalSec), 0)
        )
        rainbow_POTIONS.register(normalID, () =>
            normalBuilder.get().createObject()
        )

        // 延长药水
        const longBuilder = Utils.lazy(() =>
            new $PotionBuilder(`rainbow:${longID}`)
                .effect(effectID, SecoundToTick(longSec), 0)
        )
        rainbow_POTIONS.register(longID, () =>
            longBuilder.get().createObject()
        )
    })
}


// =====================================
// 自动注册
// =====================================
registerPotionPair("attributeslib:flying", 180, 480)
registerPotionPair("rainbow:apty4869", 90, 180)
// ===============================
// 全局酿造事件
// ===============================
MoreJSEvents.registerPotionBrewing((event) => {
    event.addPotionBrewing("gimmethat:moon","minecraft:awkward", "rainbow:flying_potion");
    event.addPotionBrewing("minecraft:redstone", "rainbow:flying_potion", "rainbow:long_flying_potion");
});