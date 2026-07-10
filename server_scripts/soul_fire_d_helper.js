// Soul Fire'd - 自定义火焰辅助函数
// 用于在 KubeJS 中为实体附着 soul_fire_d 数据包定义的自定义火焰
//
// 使用方式：将此文件放入 kubejs/server_scripts/ 目录
// 在任意 KubeJS 事件或函数中调用 SFire.xxx()
//
// 数据包中已注册的火焰类型：
//   minecraft:fire         - 原版火焰, 伤害 1.0
//   minecraft:soul_fire    - 灵魂火, 伤害 2.0  (对应 FireManager.SOUL_FIRE_TYPE = "soul")
//   netherexp:ancient      - 远古火, 伤害 0.0
//   endergetic:ender       - 末影火, 伤害 3.0
//   dungeonsdelight:living - 活火, 伤害 2.0

const $FireManager = Java.loadClass("it.crystalnest.soul_fire_d.api.FireManager")
const $ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation")
const $Fire = Java.loadClass("it.crystalnest.soul_fire_d.api.Fire")

global.SFire = {
  // ==================== 火焰类型常量 ====================

  DEFAULT_FIRE_TYPE: $FireManager.DEFAULT_FIRE_TYPE,
  SOUL_FIRE_TYPE: $FireManager.SOUL_FIRE_TYPE,

  // ==================== 设置实体着火 ====================

  /**
   * 设置实体以指定火焰类型着火
   * @param {Entity} entity - 目标实体
   * @param {number} seconds - 燃烧秒数
   * @param {string|ResourceLocation} fireType - 火焰类型ID，如 "minecraft:soul" 或 "netherexp:ancient"
   */
  setOnFire: function(entity, seconds, fireType) {
    var loc = this._resolve(fireType)
    if (loc != null) {
      $FireManager.setOnFire(entity, seconds, loc)
    }
  },

  /**
   * 设置实体以灵魂火着火（便捷方法）
   * @param {Entity} entity - 目标实体
   * @param {number} seconds - 燃烧秒数
   */
  setOnSoulFire: function(entity, seconds) {
    $FireManager.setOnFire(entity, seconds, $FireManager.SOUL_FIRE_TYPE)
  },

  /**
   * 设置实体以指定火焰类型着火（内部函数可自定义设置行为）
   * @param {Entity} entity - 目标实体
   * @param {number} seconds - 燃烧秒数
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @param {function} setter - 自定义着火函数 (entity, seconds) => void
   */
  setOnFireCustom: function(entity, seconds, fireType, setter) {
    var loc = this._resolve(fireType)
    if (loc != null) {
      var BiConsumer = Java.loadClass("java.util.function.BiConsumer")
      $FireManager.setOnFire(entity, seconds, loc, new BiConsumer({
        accept: function(e, s) {
          // e 是 Entity, s 是 Integer
          // 在 Rhino 中需要特殊处理
          setter(e, s)
        }
      }))
    }
  },

  // ==================== 造成/治疗火焰伤害 ====================

  /**
   * 对实体造成"站在火焰中"的伤害
   * @param {Entity} entity - 目标实体
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {boolean} 是否造成了伤害
   */
  damageInFire: function(entity, fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.damageInFire(entity, loc) : false
  },

  /**
   * 对实体造成"正在燃烧"的伤害（每 tick 调用）
   * @param {Entity} entity - 目标实体
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {boolean} 是否造成了伤害
   */
  damageOnFire: function(entity, fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.damageOnFire(entity, loc) : false
  },

  // ==================== 获取伤害源 ====================

  /**
   * 获取指定火焰类型的"站在火中"伤害源
   * @param {Entity} entity - 目标实体
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {DamageSource|null}
   */
  getInFireDamageSource: function(entity, fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getInFireDamageSourceFor(entity, loc) : null
  },

  /**
   * 获取指定火焰类型的"正在燃烧"伤害源
   * @param {Entity} entity - 目标实体
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {DamageSource|null}
   */
  getOnFireDamageSource: function(entity, fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getOnFireDamageSourceFor(entity, loc) : null
  },

  // ==================== 实体火类型查询 ====================

  /**
   * 获取实体当前的自定义火焰类型
   * @param {Entity} entity - 目标实体
   * @returns {ResourceLocation} 火焰类型ID
   */
  getEntityFireType: function(entity) {
    var FireTyped = Java.loadClass("it.crystalnest.soul_fire_d.api.type.FireTyped")
    return entity instanceof FireTyped ? entity.getFireType() : $FireManager.DEFAULT_FIRE_TYPE
  },

  /**
   * 判断实体是否具有指定的自定义火焰类型
   * @param {Entity} entity - 目标实体
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {boolean}
   */
  hasFireType: function(entity, fireType) {
    var loc = this._resolve(fireType)
    if (loc == null) return false
    var current = this.getEntityFireType(entity)
    return current != null && current.toString() === loc.toString()
  },

  /**
   * 判断实体是否正在燃烧自定义火焰
   * @param {Entity} entity - 目标实体
   * @returns {boolean}
   */
  isOnCustomFire: function(entity) {
    var ft = this.getEntityFireType(entity)
    return ft != null && ft.toString() !== $FireManager.DEFAULT_FIRE_TYPE.toString()
  },

  // ==================== 火焰属性查询 ====================

  /**
   * 获取指定火焰类型的完整 Fire 对象
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {Fire|null}
   */
  getFire: function(fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getFire(loc) : null
  },

  /**
   * 获取指定火焰的伤害值
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {number} 伤害值（正=伤害，负=治疗，0=无效果）
   */
  getFireDamage: function(fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getProperty(loc, function(f) { return f.getDamage() }) : 0
  },

  /**
   * 获取指定火焰的亮度
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {number} 亮度值 (0-15)
   */
  getFireLight: function(fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getProperty(loc, function(f) { return f.getLight() }) : 0
  },

  /**
   * 获取指定火焰的雨水浇灭属性
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {boolean}
   */
  canRainDouse: function(fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getProperty(loc, function(f) { return f.canRainDouse() }) : false
  },

  /**
   * 获取指定火焰的反转治疗/伤害属性
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {boolean}
   */
  invertHealAndHarm: function(fireType) {
    var loc = this._resolve(fireType)
    return loc != null ? $FireManager.getProperty(loc, function(f) { return f.invertHealAndHarm() }) : false
  },

  // ==================== 火焰组件查询 ====================

  /**
   * 获取指定火焰的方块组件ID
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @param {string} component - 组件名 (SOURCE_BLOCK, CAMPFIRE_BLOCK, TORCH_BLOCK, LANTERN_BLOCK, FLAME_PARTICLE 等)
   * @returns {ResourceLocation|null}
   */
  getComponent: function(fireType, component) {
    var loc = this._resolve(fireType)
    if (loc == null) return null
    var comp = this._component(component)
    return comp != null ? $FireManager.getComponentId(loc, comp) : null
  },

  // ==================== 火焰注册查询 ====================

  /**
   * 判断指定火焰类型是否已注册
   * @param {string|ResourceLocation} fireType - 火焰类型ID
   * @returns {boolean}
   */
  isRegistered: function(fireType) {
    var loc = this._resolve(fireType)
    return loc != null && $FireManager.isRegisteredType(loc)
  },

  /**
   * 列出所有已注册的火焰类型ID
   * @returns {string[]}
   */
  listFires: function() {
    return $FireManager.getFireTypes().stream()
      .map(function(rl) { return rl.toString() })
      .toList()
  },

  /**
   * 列出所有已注册的火焰详细信息
   * @returns {Array<{type: string, damage: number, light: number, canRainDouse: boolean, invertHealAndHarm: boolean}>}
   */
  listFireDetails: function() {
    return $FireManager.getFires().stream()
      .map(function(f) {
        return {
          type: f.getFireType().toString(),
          damage: f.getDamage(),
          light: f.getLight(),
          canRainDouse: f.canRainDouse(),
          invertHealAndHarm: f.invertHealAndHarm()
        }
      })
      .toList()
  },

  // ==================== 内部工具方法 ====================

  /**
   * 将字符串或 ResourceLocation 解析为 ResourceLocation
   * @param {string|ResourceLocation} fireType
   * @returns {ResourceLocation|null}
   */
  _resolve: function(fireType) {
    if (fireType == null) return null
    if (fireType instanceof $ResourceLocation) return fireType
    if (typeof fireType === "string") {
      var parts = fireType.split(":")
      if (parts.length === 2) return new $ResourceLocation(parts[0], parts[1])
      if (parts.length === 1) {
        return new $ResourceLocation(fireType)
      }
    }
    return null
  },

  /**
   * 根据字符串名称获取 Fire.Component 常量
   * @param {string} name - 组件名
   * @returns {Fire.Component|null}
   */
  _component: function(name) {
    switch (name) {
      case "SOURCE_BLOCK": return $Fire.Component.SOURCE_BLOCK
      case "CAMPFIRE_BLOCK": return $Fire.Component.CAMPFIRE_BLOCK
      case "CAMPFIRE_ITEM": return $Fire.Component.CAMPFIRE_ITEM
      case "LANTERN_BLOCK": return $Fire.Component.LANTERN_BLOCK
      case "LANTERN_ITEM": return $Fire.Component.LANTERN_ITEM
      case "TORCH_BLOCK": return $Fire.Component.TORCH_BLOCK
      case "TORCH_ITEM": return $Fire.Component.TORCH_ITEM
      case "WALL_TORCH_BLOCK": return $Fire.Component.WALL_TORCH_BLOCK
      case "FLAME_PARTICLE": return $Fire.Component.FLAME_PARTICLE
      case "FIRE_ASPECT_ENCHANTMENT": return $Fire.Component.FIRE_ASPECT_ENCHANTMENT
      case "FLAME_ENCHANTMENT": return $Fire.Component.FLAME_ENCHANTMENT
      default: return null
    }
  }
}

// ==================== 使用示例 ====================
//
// 例1: EntityEvents 中让实体着灵魂火
// EntityEvents.hurt(event => {
//   if (event.source.getType() === "inFire") {
//     SFire.setOnSoulFire(event.entity, 5)
//   }
// })
//
// 例2: 攻击时附带自定义火焰
// ItemEvents.entityInteracted(event => {
//   SFire.setOnFire(event.target, 3, "netherexp:ancient")
// })
//
// 例3: 自定义火焰伤害
// EntityEvents.hurt(event => {
//   if (event.source.getType() === "onFire") {
//     var ft = SFire.getEntityFireType(event.entity)
//     if (ft.toString() === "endergetic:ender") {
//       event.setDamage(event.damage * 1.5)
//     }
//   }
// })
//
// 例4: 列出所有已注册火焰
// console.log(SFire.listFireDetails())
