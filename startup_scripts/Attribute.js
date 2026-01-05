// priority: 0
// ==========================================
// 自定义属性注册
// Custom Attribute Registration
// ==========================================
// 注册新的实体属性（如义体容量）并将其添加到玩家身上
// Registers new entity attributes (e.g., cyberware capacity) and attaches them to players

const $RangedAttribute = Java.loadClass('net.minecraft.world.entity.ai.attributes.RangedAttribute');
 
// 注册新的义体容量属性
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