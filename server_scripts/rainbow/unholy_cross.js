// 亵渎十字架额外真实伤害的伤害类型注册
// 与 rainbow:dismas_scarf 相同：1.20.1 的 DamageSource 没有 setBypassArmor/setBypassMagic，
// 需要通过 damage_type JSON + tag 实现"无视护甲/抗性/保护附魔"。
// 伤害类型 rainbow:unholy_cross 使用 message_id 'player'，击杀信息显示为玩家击杀。
// tag 使用 ServerEvents.tags 合并写入，避免与 dismas_scarf.js 的 highPriorityData tag JSON 同路径覆盖。
ServerEvents.highPriorityData(event => {
    event.addJson('rainbow:damage_type/unholy_cross', {
        message_id: 'player',
        scaling: 'never',
        exhaustion: 0.0
    });
});

ServerEvents.tags('damage_type', event => {
    event.add('minecraft:bypasses_armor', 'rainbow:unholy_cross');
    event.add('minecraft:bypasses_effects', 'rainbow:unholy_cross');
});
