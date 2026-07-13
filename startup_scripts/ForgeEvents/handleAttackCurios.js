// Priority: 5000
/**
 * 处理玩家攻击实体时的饰品附火效果
 * @param {Internal.AttackEntityEvent} event
 * @param {Internal.Player} entity
 * @param {Internal.Entity} target
 */
function handleAttackCurios(event, entity, target) {
    // 末影手套：攻击时为目标附着末影火 3秒
    if (hasCurios(entity, 'rainbow:ender_glove')) {
        if (global.SFire) {
            global.SFire.setOnFire(target, 3, "endergetic:ender");
        }
    }
    // 生灵手套：攻击时为目标附着生灵火 3秒
    if (hasCurios(entity, 'rainbow:living_gauntlet')) {
        if (global.SFire) {
            global.SFire.setOnFire(target, 3, "dungeonsdelight:living");
        }
    }
}
