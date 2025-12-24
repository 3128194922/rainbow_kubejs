const $RangedAttribute = Java.loadClass('net.minecraft.world.entity.ai.attributes.RangedAttribute');
 
// 注册新的子弹伤害属性
StartupEvents.registry('attribute', event => {
    event.createCustom('rainbow:generic.cyberware_capacity', () => {
        return new $RangedAttribute(
            'attribute.name.generic.cyberware_capacity',
            0.0,
            0.0,
            100.0
        );
    });
});
 
// 为玩家实体添加属性
ForgeModEvents.onEvent(
    'net.minecraftforge.event.entity.EntityAttributeModificationEvent',
    (event) => {
        if (!event.has('player', 'rainbow:generic.cyberware_capacity')) {
            event.add('player', 'rainbow:generic.cyberware_capacity');
        }
    }
);