// 极限闪避围巾（rainbow:dismas_scarf）反击伤害类型注册
// 1.20.1 中 DamageSource 不再有 setBypassArmor/setBypassMagic 方法，
// "是否无视护甲/免伤"由 damage_type 注册表 + tag 决定。
// 这里注册自定义伤害类型 rainbow:dismas_scarf，并加入
// minecraft:bypasses_armor（无视护甲）与 minecraft:bypasses_effects（无视保护附魔/抗性效果）tag。
// 伤害来源仍记为玩家（message_id 用 player，击杀信息显示 "被玩家击杀"）。
ServerEvents.highPriorityData(event => {
    event.addJson('rainbow:damage_type/dismas_scarf', {
        message_id: 'player',
        scaling: 'never',
        exhaustion: 0.0
    });

    event.addJson('minecraft:tags/damage_type/bypasses_armor', {
        replace: false,
        values: ['rainbow:dismas_scarf']
    });

    event.addJson('minecraft:tags/damage_type/bypasses_effects', {
        replace: false,
        values: ['rainbow:dismas_scarf']
    });
});
