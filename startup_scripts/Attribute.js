// priority: 0
// ==========================================
// 自定义属性注册
// Custom Attribute Registration
// ==========================================
// 注册新的实体属性（如义体容量）并将其添加到玩家身上
// Registers new entity attributes (e.g., cyberware capacity) and attaches them to players

// RangedAttribute / DefaultAttributes 统一由 startup_scripts/CONST.js 提供，DefaultAttributes 按事件阶段懒加载。

// 注册新的属性
StartupEvents.registry('attribute', event => {
    //额外召唤物
    event.createCustom('rainbow:generic.extra_summoning', () => {
        return new RangedAttribute(
            'attribute.name.generic.extra_summoning',
            0.0,
            0.0,
            10.0
        );
    });
    //爆炸伤害
    event.createCustom('rainbow:generic.boom_damage', () => {
        return new RangedAttribute(
            'attribute.name.generic.boom_damage',
            1.0,
            0.0,
            1000.0
        );
    });
    //魔法伤害
    /*event.createCustom('rainbow:generic.magic_damage', () => {
        return new $RangedAttribute(
            'attribute.name.generic.magic_damage',
            1.0,
            0.0,
            1000.0
        );
    });*/
    //投掷伤害
    event.createCustom('rainbow:generic.thrown_damage', () => {
        return new RangedAttribute(
            'attribute.name.generic.thrown_damage',
            1.0,
            0.0,
            1000.0
        );
    });
    //宠物伤害
    event.createCustom('rainbow:generic.pet_damage', () => {
        return new RangedAttribute(
            'attribute.name.generic.pet_damage',
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
        const DefaultAttributes = getDefaultAttributesClass();
        if (DefaultAttributes == null) {
            console.log('实体属性修改阶段无法获取 DefaultAttributes，跳过默认属性检查。');
            return;
        }
        const attributes = [
            'rainbow:generic.extra_summoning',
            'rainbow:generic.boom_damage',
            //'rainbow:generic.magic_damage',
            'rainbow:generic.thrown_damage',
            'rainbow:generic.pet_damage'
        ];
        
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

        //event.add('player', 'caverns_and_chasms:magic_damage');
        //event.add('player', 'caverns_and_chasms:magic_protection');
    }
);

// ==========================================
// 修改特定实体（如铁傀儡）的初始属性
// Modifies initial attributes of specific entities (e.g., Iron Golem)

// 通过 entityjs 挂载 C&C 原生属性到玩家（使用 ForgeRegistries 直接解析）
EntityJSEvents.attributes(event => {
    event.modify('minecraft:player', helper => {
        helper.add('caverns_and_chasms:magic_damage', 0.0);
        helper.add('caverns_and_chasms:magic_protection', 1.0);
        helper.add('caverns_and_chasms:stealth', 0.0);
    });

});

// 玩家暴击率归零
EntityJSEvents.attributes(event => {
    event.modify(EntityType.PLAYER, attributes => {
        attributes.add('attributeslib:crit_chance', 0)
    })
})
