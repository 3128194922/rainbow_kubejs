// priority: 0
// ==========================================
// 🧬 基因提取器 - rainbow:amber_bee
// 对拥有 entity_gene 的生物右键，提取其基因片段
// ==========================================

ItemEvents.entityInteracted('rainbow:amber_bee', event => {
    let player = event.getPlayer();
    let target = event.getTarget();
    let item = event.getItem ? event.getItem() : event.item;

    if (!target.isLiving()) return;

    // 获取实体的基因（来自 startup_scripts/gene_system）
    let pData = target.getPersistentData();
    let geneId = pData.contains('entity_gene') ? pData.getString('entity_gene') : null;
    if (!geneId) {
        player.tell('该生物没有可提取的基因');
        return;
    }

    // 获取或创建物品 NBT
    let root = item.getOrCreateTag ? item.getOrCreateTag() : (item.nbt ?? new CompoundTag());

    // 若已写入基因，不允许重复写入
    if (root.contains('extracted_gene')) {
        player.tell('该注射器已含有基因信息，无法重复提取');
        return;
    }

    root.putString('extracted_gene', geneId);

    if (item.setTag) {
        item.setTag(root);
    } else {
        item.nbt = root;
    }

    player.tell(`§a成功提取基因: §e${geneId}`);
});