// Priority: 5000
/**
 * 处理物品动态属性修改事件
 * @param {Internal.ItemAttributeModifierEvent} event
 */
function handleItemAttributeModifier(event) {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    // 提尔锋仅在主手时获得 +50 盔甲穿透。
    if (item.id === "rainbow:tyrfing" && slotType === "mainhand") {
        event.addModifier(
            "attributeslib:armor_pierce",
            new AttributeModifier(
                "d8b3b8d2-1f0f-4e65-a489-00b0709d0b12",
                "tyrfing_armor_pierce",
                50.0,
                "addition"
            )
        );
    }

    // 邪恶面具：根据 maskId 动态添加属性
    /*if (item.id === "species:wicked_mask" && slotType === "head") {
        let maskId = item.getNbt().getString("id")
        let attrs = global.MobMaskAttributeConfig[maskId]

        if (!attrs) return
        if (!Array.isArray(attrs)) attrs = [attrs]

        attrs.forEach(attr => {
            if (!attr || !attr.attribute) return
            event.addModifier(
                attr.attribute,
                new AttributeModifier(
                    attr.UUID,
                    attr.ID,
                    attr.NUMBER,
                    attr.OPERATION
                )
            )
        })
    }*/

    // 饕餮之锅已迁移至 MysticArtifacts（mysticartifacts:eldritch_pan）；旧属性逻辑保留供对照。
    /*
    if (item.id === "rainbow:eldritch_pan" && slotType === "mainhand") {
        let itemNbt = item.getNbt();
        let foodnum = itemNbt != null ? itemNbt.getInt("foodnumber") || 0 : 0;
        event.addModifier(
            "generic.attack_damage",
            new AttributeModifier(
                'e93f7408-d7f1-4df1-a28f-43c2e16b004e',
                'eldritch_pan',
                1 * foodnum,
                "addition"
            )
        );
    }
    */

    // 先驱者动力剑已整项注释停用；分解立场攻击加成随技能逻辑一并停用。
    /*if (item.id === "rainbow:power_sword" && slotType === "mainhand") {
        let powerSwordTag = item.getNbt();
        if (powerSwordTag != null && powerSwordTag.getBoolean("DecompositionField")) {
            event.addModifier(
                "generic.attack_damage",
                new AttributeModifier(
                    "7a3b4c5d-6e7f-4801-9234-56789abcdef0",
                    "power_sword_decomposition_field",
                     12.0,
                    "addition"
                )
            );
        }
    }*/
    //庇护盾牌
    /*if (item.id === "caverns_and_chasms:aegis" && slotType === "offhand")
        {
        event.addModifier(
            "minecraft:generic.armor_toughness",
            new AttributeModifier(
                'b77f1163-e07e-4c30-9d9a-3f57ab31712a',
                'aegis',
                2,
                "addition"
            )
        );
        }*/
}
