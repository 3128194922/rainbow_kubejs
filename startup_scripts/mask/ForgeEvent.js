// priority: 0
// 物品动态属性修改事件
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        if (!item || item.getNbt() == null) return;

        // 邪恶面具：根据 maskId 动态添加属性
        if (item.id === "species:wicked_mask" && slotType === "head") {
            let maskId = item.getNbt().getString("id")
            let attrs = global.MobMaskAttributeConfig[maskId]

            // ✅ 统一为数组，自动兼容 0、1、多个
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

    } catch (e) {
        console.log(e);
    }
});