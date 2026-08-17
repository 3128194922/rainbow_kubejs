// 圣经 - 盔甲纹饰伤害抵消
// 根据玩家穿戴的纹饰盔甲数量提供伤害抵消：每件纹饰盔甲抵消 1 点伤害（最多 4 件），受到伤害最低为 0
// 注册：[startup_scripts/Registry/Registry_curios.js] rainbow:the_bible
function handleTheBible(event, attacker, victim, source) {
    if (victim == null || !victim.isPlayer()) return;
    if (!hasCurios(victim, 'rainbow:the_bible')) return;

    try {
        // 统计 4 个盔甲栏位中带纹饰 (Trim) 的盔甲数量
        let armorSlots = [
            { key: "head", slot: $BIBLE_EQUIP_SLOT.HEAD },
            { key: "chest", slot: $BIBLE_EQUIP_SLOT.CHEST },
            { key: "legs", slot: $BIBLE_EQUIP_SLOT.LEGS },
            { key: "feet", slot: $BIBLE_EQUIP_SLOT.FEET }
        ];

        let trimCount = 0;
        armorSlots.forEach(slotInfo => {
            if (!slotInfo || !slotInfo.slot) return;
            let armorItem = victim.getItemBySlot(slotInfo.slot);
            if (!armorItem || armorItem.isEmpty()) return;
            let nbt = armorItem.getNbt();
            if (!nbt || !nbt.contains("Trim", 10)) return;
            let trim = nbt.getCompound("Trim");
            if (!trim) return;
            let pattern = trim.getString("pattern");
            if (!pattern || pattern == "") return;
            trimCount++;
        });

        if (trimCount <= 0) return;

        // 每件纹饰盔甲抵消 1 点伤害，受伤最低为 0
        let originalAmount = event.getAmount();
        let newAmount = Math.max(0.0, originalAmount - trimCount);
        event.setAmount(newAmount);
        //console.log("圣经抵消伤害: -" + trimCount + " (纹饰盔甲 " + trimCount + "/4), 原始 " + originalAmount + " -> " + newAmount);
    } catch (e) {
        console.log("圣经伤害抵消报错:");
        console.log(e);
    }
}