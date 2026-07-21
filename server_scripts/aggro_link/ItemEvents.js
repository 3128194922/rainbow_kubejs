// priority: 1000
// ==========================================
// 🎯 索敌棒：选择两个实体，让它们互相索敌攻击
// ==========================================
ItemEvents.entityInteracted("rainbow:aggro_stick", event => {
    try {
        let player = event.player;
        let target = event.target;
        let item = event.item;

        if (!target) return;

        let tag = item.getOrCreateTag();

        // 第一次点击：选择第一个生物
        if (!tag.contains("FirstUUID")) {
            tag.putString("FirstUUID", target.getUuid().toString());
            tag.putString("FirstType", target.type);
            tag.putString("FirstName", target.getName().getString());
            player.tell("§e已选择第一个生物：§6" + target.getName().getString() + "§e，请选择第二个生物。");
            return;
        }

        // 第二次点击：让两个生物互相索敌
        let firstUUID = tag.getString("FirstUUID");
        let firstName = tag.getString("FirstName");
        let secondUUID = target.getUuid().toString();
        let secondName = target.getName().getString();

        // 防止同一个生物
        if (firstUUID === secondUUID) {
            player.tell("§c不能选择同一个生物！");
            return;
        }

        // 获取第一个实体（通过 level.getEntity 传入 UUID 对象）
        let level = target.level;
        let firstEntity = level.getEntity(UUID.fromString(firstUUID));

        if (!firstEntity || !firstEntity.isAlive()) {
            player.tell("§c第一个生物已不存在或已死亡！");
            tag.remove("FirstUUID");
            tag.remove("FirstType");
            tag.remove("FirstName");
            return;
        }

        // 让第一个实体攻击第二个
        if (firstEntity instanceof Mob) {
            firstEntity.setTarget(target);
        } else {
            player.tell("§c第一个生物不是可攻击的生物类型！");
            tag.remove("FirstUUID");
            tag.remove("FirstType");
            tag.remove("FirstName");
            return;
        }

        // 让第二个实体攻击第一个
        if (target instanceof Mob) {
            target.setTarget(firstEntity);
        } else {
            player.tell("§c第二个生物不是可攻击的生物类型！");
            tag.remove("FirstUUID");
            tag.remove("FirstType");
            tag.remove("FirstName");
            return;
        }

        player.tell("§a成功让 §6" + tag.getString("FirstName") + " §a和 §6" + target.getName().getString() + " §a互相索敌！");

        // 清除保存
        tag.remove("FirstUUID");
        tag.remove("FirstType");
        tag.remove("FirstName");
    } catch (error) {
        console.log("索敌棒出错：" + error);
    }
});