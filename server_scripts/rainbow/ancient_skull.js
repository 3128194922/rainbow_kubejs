// 古圣头骨（rainbow:ancient_skull）持续伤害的类型注册
// 伤害类型 rainbow:ancient_skull 使用 message_id 'ancient_skull'：
// KubeJS 2001 的 DamageSource#getType() 返回 DamageType 的 msgId，
// 处理器据此识别头骨自身的持续伤害，避免再次转化为债务（递归）。
// 真实伤害 tag 使用 ServerEvents.tags 合并写入，避免与 dismas_scarf.js / unholy_cross.js 的同路径 tag JSON 覆盖。
ServerEvents.highPriorityData(event => {
    event.addJson('rainbow:damage_type/ancient_skull', {
        message_id: 'ancient_skull',
        scaling: 'never',
        exhaustion: 0.0
    });
});

ServerEvents.tags('damage_type', event => {
    event.add('minecraft:bypasses_armor', 'rainbow:ancient_skull');
    event.add('minecraft:bypasses_effects', 'rainbow:ancient_skull');
    event.add('minecraft:bypasses_resistance', 'rainbow:ancient_skull');
    event.add('minecraft:bypasses_enchantments', 'rainbow:ancient_skull');
});
