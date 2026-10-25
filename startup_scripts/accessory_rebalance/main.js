// priority: 6000
// 饰品数值与新饰品入口：在线人数沿用旧口径，包含佩戴者本人。
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
            if (dx * dx + dy * dy + dz * dz <= 25) target.potionEffects.add('rainbow:fire_vulnerability', 40, 0, false, true);
        }
    } catch (e) { console.log('[圣主之血] 光环失败: ' + e); }
}

StartupEvents.registry('mob_effect', event => {
    // MoreAttribute 自带0下限，减抗不产生负火抗；多个光环只刷新同一级效果。
    // 药水免疫实体由 ForgeEvents/handleHolyBlood.js 强制附着（morecallback 高优先级/免疫双事件，覆盖anka Boss）。
    event.create('rainbow:fire_vulnerability').harmful().color(0xA51D3B)
        .modifyAttribute('moreattribute:fire_immunity', 'holy_blood_vulnerability', -0.25, 'addition');
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
