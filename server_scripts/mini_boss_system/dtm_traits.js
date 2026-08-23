// priority: 1
// DTM 法术并入 miniboss 系统（方案 A：注入 mod capability，施法交给 DTM 自己驱动）
// ------------------------------------------------------------
// 解析自 dtm_1.2.0-mcforge1.20.1.jar。
// DTM 的 DTMEventHandler.onLivingTick 会对所有实体的 activeTraits 逐个调用 trait.onTick(entity,
// romanLevel, ticks) 周期施法（法术内部自带节流：max(40, 220-20*romanLevel) tick，不占 AI goal）。
// 因此只要把 miniboss 抽到的 DTM 词条写进其 DTMMobData capability 的 activeTraits，并由
// isProcessed=true 开启驱动，DTM 就会自动调度对应 trait 施法，无需在 KubeJS 复刻法术。
//
// 用法：miniboss 生成后调用 global.applyDTMPowersToMiniBoss(entity)。
//       该函数只在实体持有任一 DTM 词条（_mb_p_<key>）时注入，不影响普通怪。

// capability 实例（DTMCapability.INSTANCE 为 public static）
const DTM_CAP_INST = Java.loadClass('com.jou1025.dtm.capability.DTMCapability').INSTANCE
// trait 注册表，用于校验 id 是否存在
const DTM_REGISTRY = Java.loadClass('com.jou1025.dtm.trait.DTMTraitRegistry')
// KubeJS6 移除了小写 `java` 类引用前缀，需用 Java.loadClass 取 ArrayList
const DTM_ArrayList = Java.loadClass('java.util.ArrayList')

// miniboss 词条 key（main.js POWER 中的 DTM 项）→ DTM trait id
// 语义：Frost=冰霜(cryomancy) Quake=岩爆(geomancy) Blast=连发(blaster) Trapper=地雷(redstone_trapper)
//       Snare=诱捕(snareling) Clone=分身(sorcery) Wind=狂风(aeromancy) Venom=剧毒(whisperer) Haunt=鬼火(wraith)
const DTM_TRAIT_IDS = {
  Frost: 'cryomancy',
  Quake: 'geomancy',
  Blast: 'blaster',
  Trapper: 'redstone_trapper',
  Snare: 'snareling',
  Clone: 'sorcery',
  Wind: 'aeromancy',
  Venom: 'whisperer',
  Haunt: 'wraith',
}

// 默认施法强度（romanLevel 越高，施法间隔越短、威力越强，建议 1~5）
const DTM_DEFAULT_ROMAN_LEVEL = 3

// 将 miniboss 持有的 DTM 词条写入实体 DTMMobData，开启 mod 自动施法
global.applyDTMPowersToMiniBoss = (entity) => {
  try {
    if (!entity || !entity.isAlive()) return
    let pd = entity.persistentData
    // 收集该 miniboss 抽到的 DTM trait id（仅保留已注册的）
    let list = new DTM_ArrayList()
    let available = {}
    try {
      DTM_REGISTRY.all().forEach(t => { available[t.getId()] = true })
      Object.keys(DTM_TRAIT_IDS).forEach(k => {
        if (!pd.getBoolean('_mb_p_' + k)) return
        let id = DTM_TRAIT_IDS[k]
        if (available[id] === true) list.add(id)
      })
    } catch (er) { console.log('[DTM] resolve traits: ' + er) }
    if (list.isEmpty()) return

    let cap = entity.getCapability(DTM_CAP_INST)
    if (!cap || !cap.isPresent()) {
      console.log('[DTM] ' + entity.getType() + ' 未挂载 DTM capability，无法注入法术')
      return
    }
    cap.ifPresent(data => {
      if (data.getRomanLevel() <= 0) data.setRomanLevel(DTM_DEFAULT_ROMAN_LEVEL)
      data.setProcessed(true)
      data.setActiveTraits(list)
      console.log('[DTM] miniboss 注入法术 ' + list.toString())
    })
  } catch (er) { console.log('[DTM] applyDTMPowersToMiniBoss: ' + er) }
}