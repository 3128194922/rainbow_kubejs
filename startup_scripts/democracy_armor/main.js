// priority: 9000
// ==========================================
// 🛡️ 民主防具套装复刻
// ==========================================
// 复刻 MysticArtifacts 的民主防具，使用 rainbow 命名空间避免与原模组注册表冲突。

const DEMOCRACY_ARMOR_TIER = 'rainbow:democracy'
const DEMOCRACY_HELMET_ID = 'rainbow:democracy_helmet'
const DEMOCRACY_CHESTPLATE_ID = 'rainbow:democracy_chestplate'
const DEMOCRACY_LEGGINGS_ID = 'rainbow:democracy_leggings'
const DEMOCRACY_BOOTS_ID = 'rainbow:democracy_boots'

const LEGACY_DEMOCRACY_HELMET_ID = 'mysticartifacts:democracy_helmet'
const LEGACY_DEMOCRACY_CHESTPLATE_ID = 'mysticartifacts:democracy_chestplate'
const LEGACY_DEMOCRACY_LEGGINGS_ID = 'mysticartifacts:democracy_leggings'
const LEGACY_DEMOCRACY_BOOTS_ID = 'mysticartifacts:democracy_boots'

// 注册与 MysticArtifacts 相同数值的护甲材质；数组顺序为脚、腿、胸、头的 EquipmentSlot 索引。
ItemEvents.armorTierRegistry(event => {
    try {
        event.add(DEMOCRACY_ARMOR_TIER, 'iron', tier => {
            tier.setDurabilityMultiplier(26)
            // KubeJS Rhino 不支持该 Java 数组转换函数；直接传入数组，让 KubeJS 转换为 int[]。
            tier.setSlotProtections([6, 9, 11, 6])
            tier.setEnchantmentValue(25)
            tier.setEquipSound(SoundEvents.ARMOR_EQUIP_NETHERITE)
            tier.setToughness(4)
            tier.setKnockbackResistance(0)
            tier.setRepairIngredient(Ingredient.of('mysticartifacts:rubber'))
        })
    } catch (e) {
        console.log('[民主防具] 注册护甲材质失败: ' + e)
    }
})

// 注册四件 GEO 护甲；穿戴时共用完整战术模型，由 GeckoLib 按装备槽位裁剪标准护甲骨骼；物品栏保留原有物品贴图。
StartupEvents.registry('item', event => {
    try {
        event.create(DEMOCRACY_HELMET_ID, 'anim_helmet')
            .tier(DEMOCRACY_ARMOR_TIER)
            .texture('rainbow:item/democracy_helmet')
            .geoModel(geo => {
                geo.setSimpleModel('rainbow:geo/armor/b01_tactical.geo.json')
                geo.setSimpleTexture('rainbow:textures/armor/b01_tactical_32.png')
            })
            .displayName('Helldiver helmet')
        event.create(DEMOCRACY_CHESTPLATE_ID, 'anim_chestplate')
            .tier(DEMOCRACY_ARMOR_TIER)
            .texture('rainbow:item/democracy_chestplate')
            .geoModel(geo => {
                geo.setSimpleModel('rainbow:geo/armor/b01_tactical.geo.json')
                geo.setSimpleTexture('rainbow:textures/armor/b01_tactical_32.png')
            })
            .displayName('Helldiver chestplate')
        event.create(DEMOCRACY_LEGGINGS_ID, 'anim_leggings')
            .tier(DEMOCRACY_ARMOR_TIER)
            .texture('rainbow:item/democracy_leggings')
            .geoModel(geo => {
                geo.setSimpleModel('rainbow:geo/armor/b01_tactical.geo.json')
                geo.setSimpleTexture('rainbow:textures/armor/b01_tactical_32.png')
            })
            .displayName('Helldiver leggings')
        event.create(DEMOCRACY_BOOTS_ID, 'anim_boots')
            .tier(DEMOCRACY_ARMOR_TIER)
            .texture('rainbow:item/democracy_boots')
            .geoModel(geo => {
                geo.setSimpleModel('rainbow:geo/armor/b01_tactical.geo.json')
                geo.setSimpleTexture('rainbow:textures/armor/b01_tactical_32.png')
            })
            .displayName('Helldiver boots')
    } catch (e) {
        console.log('[民主防具] 注册 rainbow 装备失败: ' + e)
    }
})

// 在 MysticArtifacts 创造标签中替换旧入口，避免同一套装备显示两份。
/*StartupEvents.modifyCreativeTab('mysticartifacts:mystic_artifacts_tab', event => {
    try {
        event.remove(LEGACY_DEMOCRACY_HELMET_ID)
        event.remove(LEGACY_DEMOCRACY_CHESTPLATE_ID)
        event.remove(LEGACY_DEMOCRACY_LEGGINGS_ID)
        event.remove(LEGACY_DEMOCRACY_BOOTS_ID)
        event.add([
            Item.of(DEMOCRACY_HELMET_ID, '{Damage:0}'),
            Item.of(DEMOCRACY_CHESTPLATE_ID, '{Damage:0}'),
            Item.of(DEMOCRACY_LEGGINGS_ID, '{Damage:0}'),
            Item.of(DEMOCRACY_BOOTS_ID, '{Damage:0}')
        ])
    } catch (e) {
        console.log('[民主防具] 替换创造标签入口失败: ' + e)
    }
})*/
