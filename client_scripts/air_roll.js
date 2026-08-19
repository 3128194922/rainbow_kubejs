// ============ CombatRoll 空中翻滚双向控制（global 全局版） ============
// 1) 强制允许：绕过 CombatRoll 原判定 allow_rolling_while_airborn=false 的地面限制
// 2) 条件拦截：条件不满足时恢复原判定（空中翻滚被拦截），地面翻滚不受影响
// 原理：服务端不校验翻滚条件（只处理无敌帧/动画），客户端放行后全链路正常；
//       KubeJS ClientEvents.TICK 晚于原判定 1 tick（50ms），按住 R 无感。
// 注意：本脚本只影响本机客户端；全服生效请在服务端配置里同步 allow_rolling_while_airborn=true
//
// 全局接口（其他脚本 / 控制台可直接调用）：
//   global.airRollSettings   - 配置对象（可动态修改，实时生效）
//   global.shouldAllowAirRoll(player) - 判定是否允许空中翻滚
//   global.isKeyDown(name)   - 检测按键是否按住
//   global.hasAny(stacks, ids) - 物品ID列表匹配

global.airRollSettings = {
    forceAllowAirRoll: true,    // 主开关：true=干预空中翻滚判定；false=完全交给 CombatRoll 原判定
    requireHeldKey: false,      // 需要按住指定键才允许空中翻滚
    heldKey: 'key.sneak',       // 可用：key.forward/back/left/right/jump/sneak/sprint/attack/use/drop
    requireItems: false,        // 需要手持指定物品才允许（主手/副手任一匹配）
    items: ['minecraft:elytra'],
    requireArmor: false,        // 需要穿戴指定盔甲才允许（四件任选其一匹配）
    armor: ['minecraft:netherite_boots'],
    invert: false               // true=反转：满足以上条件时反而拦截空中翻滚
};

const CombatRoll = Java.loadClass('net.combatroll.CombatRoll');

ClientEvents.tick(() => {
    const config = CombatRoll.config;
    const player = Client.player;
    if (!config || !player) return;
    config.allow_rolling_while_airborn = global.shouldAllowAirRoll(player);
});

// ======================= 全局函数 =======================

/**
 * shouldAllowAirRoll(player)
 * 判定是否允许空中翻滚（CombatRoll 空中判定最终开关）。
 * 综合 airRollSettings 中按键/物品/盔甲条件，任一启用条件不满足即拦截；
 * 未启用任何条件时无条件放行。支持 invert 反转（满足条件反而拦截）。
 * @param {Player} player - 客户端玩家（Client.player）
 * @returns {boolean} true=允许空中翻滚；false=恢复原判定（拦截）
 * 示例：global.shouldAllowAirRoll(Client.player)
 */
global.shouldAllowAirRoll = function(player) {
    const s = global.airRollSettings;
    if (!s.forceAllowAirRoll) return true;
    let ok = true;
    if (s.requireHeldKey && !global.isKeyDown(s.heldKey)) ok = false;
    if (s.requireItems && !global.hasAny([player.mainHandItem, player.offHandItem], s.items)) ok = false;
    if (s.requireArmor && !global.hasAny([player.headArmorItem, player.chestArmorItem, player.legsArmorItem, player.feetArmorItem], s.armor)) ok = false;
    return s.invert ? !ok : ok;
};

/**
 * isKeyDown(name)
 * 检测指定按键当前是否被按住。
 * @param {string} name - 按键注册名（如 'key.sneak'、'key.jump'、'key.forward'）
 * @returns {boolean} true=按住中；找不到该键位时返回 false
 * 示例：global.isKeyDown('key.sneak')
 */
global.isKeyDown = function(name) {
    const options = Java.loadClass('net.minecraft.client.Minecraft').getInstance().options;
    for (const km of options.keyMappings) {
        if (km.getName() === name) return km.isDown;
    }
    return false;
};

/**
 * hasAny(stacks, ids)
 * 判断给定物品堆列表中任一物品的 ID 是否在目标列表内。
 * @param {ItemStack[]} stacks - 物品堆数组（如 [player.mainHandItem, player.offHandItem]）
 * @param {string[]} ids - 目标物品 ID 列表（如 ['minecraft:elytra']）
 * @returns {boolean} true=至少一个匹配
 * 示例：global.hasAny([player.headArmorItem, player.feetArmorItem], ['minecraft:netherite_helmet'])
 */
global.hasAny = function(stacks, ids) {
    for (const s of stacks) {
        if (!s.isEmpty() && ids.includes(s.id)) return true;
    }
    return false;
};