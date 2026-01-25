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
    //义体容量
    event.createCustom('rainbow:generic.cyberware_capacity', () => {
        return new $RangedAttribute(
            'attribute.name.generic.cyberware_capacity',
            0.0,
            0.0,
            100.0
        );
    });
    //爆炸伤害
    event.createCustom('rainbow:generic.boom_damage', () => {
        return new $RangedAttribute(
            'attribute.name.generic.boom_damage',
            1.0,
            0.0,
            1000.0
        );
    });
    //魔法伤害
    event.createCustom('rainbow:generic.magic_damage', () => {
        return new $RangedAttribute(
            'attribute.name.generic.magic_damage',
            1.0,
            0.0,
            1000.0
        );
    });
    //投掷伤害
    event.createCustom('rainbow:generic.thrown_damage', () => {
        return new $RangedAttribute(
            'attribute.name.generic.thrown_damage',
            1.0,
            0.0,
            1000.0
        );
    });
});
 
// 为所有生物实体（包括怪物）添加属性
ForgeModEvents.onEvent(
    'net.minecraftforge.event.entity.EntityAttributeModificationEvent',
    (event) => {
        const attributes = [
            'rainbow:generic.cyberware_capacity',
            'rainbow:generic.boom_damage',
            'rainbow:generic.magic_damage',
            'rainbow:generic.thrown_damage'
        ];
        
        const DefaultAttributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.DefaultAttributes');

        event.getTypes().forEach(type => {
            // 检查该实体类型是否有默认属性供应者（即是否为生物）
            if (DefaultAttributes.hasSupplier(type)) {
                attributes.forEach(attr => {
                    if (!event.has(type, attr)) {
                        event.add(type, attr);
                    }
                });
            }
        });
    }
);