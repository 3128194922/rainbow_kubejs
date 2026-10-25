// 派生伤害使用独立类型；真实伤害和已结算转移不再经过第二次原版防御。
const REBALANCE_DAMAGE_IDS = ['holy_physical', 'holy_magic', 'holy_true', 'kinetic_orb', 'lpecac_aoe', 'aegis_share', 'alien_meteor'];
ServerEvents.highPriorityData(event => {
    for (let id of REBALANCE_DAMAGE_IDS) {
        event.addJson('rainbow:damage_type/' + id, {message_id: id, scaling: 'never', exhaustion: 0});
    }
});
ServerEvents.tags('damage_type', event => {
    for (let id of ['holy_true', 'aegis_share', 'unholy_cross']) {
        for (let tag of ['bypasses_armor', 'bypasses_effects', 'bypasses_resistance', 'bypasses_enchantments']) {
            event.add('minecraft:' + tag, 'rainbow:' + id);
        }
    }
    event.add('minecraft:bypasses_armor', 'rainbow:holy_magic');
    event.add('minecraft:is_explosion', 'rainbow:lpecac_aoe');
    event.add('minecraft:bypasses_shield', 'rainbow:aegis_share');
});
