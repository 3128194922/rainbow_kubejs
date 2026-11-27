// MoreFire reference-fire compatibility.
// Every entry is optional: missing mods are skipped automatically.
function tagAllFireDamageTypes() {
  if (typeof MoreFire === 'undefined' || MoreFire == null) return
  let ids = MoreFire.list()
  let tagged = 0
  for (let id of ids) {
    let fire = MoreFire.get(id)
    if (fire == null) continue
    fire.setDamageType('minecraft:in_fire')
    tagged++
  }
  console.log('[MoreFire] 已将 ' + tagged + ' 个火焰统一为 minecraft:in_fire')
}

// 先覆盖所有已注册的 MoreFire 火焰，再执行逐项颜色/伤害配置。
tagAllFireDamageTypes()

function configureFire(id, callback) {
  if (!MoreFire.exists(id)) return
  let fire = MoreFire.get(id)
  if (fire == null) return
  callback(fire)
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

// 本项目自定义魂火方块（startup_scripts/soul_flamethrower/main.js 注册）：
// 魂火喷火器（soul_burner 附魔）喷出的火附着该方块，规则对齐原版灵魂火。
configureFire('rainbow:soul_flame', fire => {
  fire.setAutoEntityFireColor(true)
    .setBlockRainExtinguish(false)
    .setBlockWaterExtinguish(true)
    .setEntityRainExtinguish(false)
    .setEntityWaterExtinguish(true)
    .setDamage(2.0)
    .setFireTicks(160)
})
