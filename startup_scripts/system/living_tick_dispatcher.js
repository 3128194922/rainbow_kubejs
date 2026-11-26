// priority: 19000
// ==========================================
// LivingTick 统一调度器
// ==========================================
// 整个项目只注册一个 Forge LivingTickEvent，各模块通过
// global.registerLivingTickHandler(id, fn) 注册子函数。
// 这样每个 living entity 每 tick 只跨一次 Java -> Rhino 边界，
// 子函数共享同一个 event/entity，避免 7 个监听重复读取实体属性。
//
// 子函数签名：function(event, entity) {}
// - 调度器已保证 entity 非 null 且非客户端
// - 子函数内部仍需按自身目标实体类型尽早 return

const LIVING_TICK_HANDLERS = {}
let livingTickHandlerList = []
let livingTickHandlerListDirty = true

global.registerLivingTickHandler = function (id, handler) {
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error('[LivingTick] handler id 必须是非空字符串')
    }
    if (typeof handler !== 'function') {
        throw new Error('[LivingTick] handler 必须是函数: ' + id)
    }
    if (LIVING_TICK_HANDLERS[id] === undefined) {
        livingTickHandlerListDirty = true
    }
    LIVING_TICK_HANDLERS[id] = handler
}

global.unregisterLivingTickHandler = function (id) {
    if (LIVING_TICK_HANDLERS[id] !== undefined) {
        delete LIVING_TICK_HANDLERS[id]
        livingTickHandlerListDirty = true
    }
}

function getLivingTickHandlers() {
    if (livingTickHandlerListDirty) {
        livingTickHandlerList = []
        for (let id in LIVING_TICK_HANDLERS) {
            livingTickHandlerList.push({ id: id, handler: LIVING_TICK_HANDLERS[id] })
        }
        livingTickHandlerListDirty = false
    }
    return livingTickHandlerList
}

function dispatchLivingTick(event) {
    let entity = event.entity
    if (entity === null || entity === undefined) return
    if (entity.level === null || entity.level === undefined || entity.level.isClientSide()) return

    let handlers = getLivingTickHandlers()
    for (let i = 0; i < handlers.length; i++) {
        try {
            handlers[i].handler(event, entity)
        } catch (err) {
            console.log('[LivingTick] 子函数失败 ' + handlers[i].id + ': ' + err)
        }
    }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent', dispatchLivingTick)
