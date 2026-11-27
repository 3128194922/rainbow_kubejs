// priority: 6000
// 饰品数值与新饰品入口：在线人数沿用旧口径，包含佩戴者本人。
const HOLY_BLOOD_FIRE_ATTRIBUTE = 'moreattribute:fire_immunity';
const HOLY_BLOOD_FIRE_MODIFIER_UUID = '6f2f8b1e-2a0e-4e4c-9f0a-5b7d3c1e8a21';

// TheBuff 的 attribute() 在 startup 阶段解析不到 MoreAttribute 的自定义属性，
// 因此在状态回调里按实体懒取属性，手动挂与原药水效果一致的 transient 修饰符。
function refreshHolyBloodFireVulnerability(entity, amplifier) {
    try {
        let attribute = entity.getAttribute(HOLY_BLOOD_FIRE_ATTRIBUTE);
        if (attribute == null) return;
        let uuid = UUID.fromString(HOLY_BLOOD_FIRE_MODIFIER_UUID);
        attribute.removeModifier(uuid);
        attribute.addTransientModifier(new AttributeModifier(uuid, 'holy_blood_fire_vulnerability',
            -0.25 * (amplifier + 1), AttributeModifierOperation.ADDITION));
    } catch (e) { console.log('[圣主之血] 火焰易伤属性附着失败: ' + e); }
}

function clearHolyBloodFireVulnerability(entity) {
    try {
        let attribute = entity.getAttribute(HOLY_BLOOD_FIRE_ATTRIBUTE);
        if (attribute == null) return;
        attribute.removeModifier(UUID.fromString(HOLY_BLOOD_FIRE_MODIFIER_UUID));
    } catch (e) { console.log('[圣主之血] 火焰易伤属性移除失败: ' + e); }
}

function rebalanceFriendAttributes(event) {
    try {
        let player = event.slotContext.entity();
        if (player == null || player.server == null) return;
        let bonus = Math.max(0, player.server.players.size()) * 0.05;
        for (let id of ['attributeslib:mining_speed', 'attributeslib:experience_gained', 'attributeslib:healing_received']) {
            event.modify(id, 'player_doll', bonus, 'multiply_total');
        }
    } catch (e) { console.log('[寻友护符] 刷新人数加成失败: ' + e); }
}

function holyBloodAura(slotContext, stack) {
    try {
        let player = slotContext.entity();
        if (player == null || player.level.isClientSide() || player.age % 20 != 0) return;
        for (let target of player.level.getEntitiesWithin(player.boundingBox.inflate(5))) {
            if (target == null || !target.isLiving() || !target.isAlive() || target == player) continue;
            let dx = target.getX() - player.getX();
            let dy = target.getY() - player.getY();
            let dz = target.getZ() - player.getZ();
            if (dx * dx + dy * dy + dz * dz <= 25) {
                // 使用无歧义的 4 参 String 重载；TheBuff 不走 addEffect，天然覆盖药水免疫实体。
                TheBuff.apply(target, 'rainbow:fire_vulnerability', 40, 0);
            }
        }
    } catch (e) { console.log('[圣主之血] 光环失败: ' + e); }
}

StartupEvents.registry('thebuff:buff', event => {
    // MoreAttribute 自带 0 下限，减抗不产生负火抗；多个光环只刷新同一级状态。
    // 显式写命名空间：KubeJS 注册表默认命名空间是 kubejs。
    event.create('rainbow:fire_vulnerability')
        .name('火焰易伤')
        .color('#A51D3B')
        .category('harmful')
        .maxLevel(1)
        .applyImmediately(false)
        .showInHud(true)
        .onApply(ctx => refreshHolyBloodFireVulnerability(ctx.entity, ctx.amplifier))
        .onExpire(ctx => clearHolyBloodFireVulnerability(ctx.entity));
});

StartupEvents.registry('item', event => {
    for (let id of ['holy_blood', 'holy_cross']) {
        let capability = CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
            .canEquip((slotContext, stack) => {
                let player = slotContext.entity();
                return player != null && !hasCurios(player, String(stack.id));
            });
        if (id == 'holy_blood') capability.curioTick(holyBloodAura);
        event.create('rainbow:' + id).rarity('epic').maxStackSize(1).tag('curios:charm').attachCuriosCapability(capability);
    }
});
