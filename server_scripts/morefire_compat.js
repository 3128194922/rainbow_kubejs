// MoreFire reference-fire compatibility.
// Every entry is optional: missing mods are skipped automatically.
function configureFire(id, callback) {
  if (!MoreFire.exists(id)) return
  callback(MoreFire.get(id))
}

configureFire('minecraft:fire', fire => {
  fire.setUseVanillaEntityFireAnimation(true)
})

configureFire('minecraft:soul_fire', fire => {
  fire.setDefinitionColor(0x4CFFF2)
    .setAutoEntityFireColor(true)
    .setBlockRainExtinguish(false)
    .setBlockWaterExtinguish(true)
    .setEntityRainExtinguish(false)
    .setEntityWaterExtinguish(true)
    .setDamage(2.0)
    .setFireTicks(160)
})

configureFire('dungeonsdelight:living_fire', fire => {
  fire.setDefinitionColor(0x77FF62)
    .setAutoEntityFireColor(true)
    .setBlockRainExtinguish(false)
    .setBlockWaterExtinguish(false)
    .setEntityRainExtinguish(false)
    .setEntityWaterExtinguish(false)
    .setDamage(2.0)
    .addAttributeModifier({
      attribute: 'minecraft:generic.armor',
      uuid: 'morefire:living_fire_armor',
      operation: 'addition',
      amount: -4.0
    })
    .setFireTicks(160)
})

configureFire('endergetic:ender_fire', fire => {
  fire.setDefinitionColor(0xB15CFF)
    .setAutoEntityFireColor(true)
    .setBlockRainExtinguish(false)
    .setBlockWaterExtinguish(false)
    .setEntityRainExtinguish(false)
    .setEntityWaterExtinguish(false)
    .setDamage(3.0)
    .setFireTicks(200)
})

configureFire('netherexp:ancient_fire', fire => {
  fire.setDefinitionColor(0xFF4A20)
    .setAutoEntityFireColor(true)
    .setBlockRainExtinguish(false)
    .setBlockWaterExtinguish(false)
    .setEntityRainExtinguish(false)
    .setEntityWaterExtinguish(false)
    .setDamage(1.0)
    .setFireTicks(160)
})

configureFire('caverns_and_chasms:cupric_fire', fire => {
  fire.setDefinitionColor(0x5FC55B)
})
