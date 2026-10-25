/**
 * 魂火喷火器 × MoreFire 兼容 主入口。
 * 1. 注册自定义魂火方块 rainbow:soul_flame（MoreFire 类型，canSurvive 仅要求下方上表面结实，
 *    可在任意地面存活；火焰定义补充配置见 server_scripts/morefire_compat.js）。
 * 2. 接入 LivingHurtEvent / NeighborNotifyEvent（逻辑见本文件夹 handleSoulFlamethrower.js）。
 * 方块注册在 startup，生效需重启游戏（/reload 无效）。
 */

// 自定义魂火方块：接触/持续燃烧伤害 2.0、不蔓延烧毁方块、青色火焰（0x4CFFF2，与 soul_fire 定义一致）
// lightLevel 为 0~1 比例（KubeJS 内部 ×15），10/15 即原版 soul_fire 的 10 级光照
StartupEvents.registry('block', event => {
    event.create('rainbow:soul_flame', 'morefire')
        .fireDamage(2.0)
        .canBurn(false)
        .definitionColor(0x4CFFF2)
        .defaultCutout()
        .lightLevel(10 / 15)
        .noItem();
});

// 实体点燃：clanginghowl:fire_stream 伤害 → MoreFire 附着 rainbow:soul_flame
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
    try {
        if (event.entity.level.isClientSide()) return;
        handleSoulFlamethrowerHurt(event);
    } catch (e) {
        console.log('[魂火喷火器] LivingHurtEvent入口出错: ' + e);
    }
});

// 方块点燃：喷火放置的 minecraft:fire / minecraft:soul_fire → 替换为 rainbow:soul_flame
ForgeEvents.onEvent('net.minecraftforge.event.level.BlockEvent$NeighborNotifyEvent', event => {
    try {
        handleSoulFlamethrowerFirePlace(event);
    } catch (e) {
        console.log('[魂火喷火器] NeighborNotifyEvent入口出错: ' + e);
    }
});
