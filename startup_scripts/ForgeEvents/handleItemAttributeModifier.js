// Priority: 5000
/**
 * 处理物品动态属性修改事件
 * @param {Internal.ItemAttributeModifierEvent} event
 */
function handleItemAttributeModifier(event) {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    // 邪恶面具：根据 maskId 动态添加属性
    if (item.id === "species:wicked_mask" && slotType === "head") {
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
    }

    // 饕餮之锅：食物数量影响攻击力
    let foodnum = item.getNbt().getInt("foodnumber") || 0;
    if (item.id === "rainbow:eldritch_pan" && slotType === "mainhand") {
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
