// priority: 10000
// ==========================================
// 🧬 基因系统
// 从 global.EntityGenePool 读取实体基因池（String[]）
// 从 global.GeneEffectMap 读取基因对应的属性效果
// 生物生成时随机获得一个基因并应用效果
// 繁殖时子嗣概率继承父母基因或随机获得新基因
// ==========================================

const UUID_CLASS = Java.loadClass('java.util.UUID');
const $AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier');
const $Operation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation');

const GENE_KEY = "entity_gene";

function getOperation(opName) {
    if (opName === "multiply_base") return $Operation.MULTIPLY_BASE;
    if (opName === "multiply_total") return $Operation.MULTIPLY_TOTAL;
    return $Operation.ADDITION;
}

function getGenePool(entityId) {
    return global.EntityGenePool?.[entityId];
}

function getGeneEffect(geneId) {
    return global.GeneEffectMap?.[geneId];
}

function applyGeneEffect(entity, geneId) {
    if (!geneId || !entity) return false;
    let effect = getGeneEffect(geneId);
    if (!effect) return true;

    try {
        let attribute = entity.getAttribute(effect.attribute);
        if (!attribute) return false;

        let uuid = UUID_CLASS.fromString(effect.UUID);
        let modifier = new $AttributeModifier(uuid, geneId, effect.NUMBER, getOperation(effect.OPERATION));

        attribute.removeModifier(uuid);
        attribute.addPermanentModifier(modifier);
        return true;
    } catch (e) {
        console.error(`[GeneSystem] 应用基因效果失败 [${geneId}]: ${e}`);
        return false;
    }
}

function removeGeneEffect(entity, geneId) {
    if (!geneId || !entity) return;
    let effect = getGeneEffect(geneId);
    if (!effect) return;
    try {
        let attribute = entity.getAttribute(effect.attribute);
        if (attribute) {
            let uuid = UUID_CLASS.fromString(effect.UUID);
            attribute.removeModifier(uuid);
        }
    } catch (e) {}
}

function getRandomGene(entityId) {
    let pool = getGenePool(entityId);
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function isValidGene(entityId, geneId) {
    let pool = getGenePool(entityId);
    if (!pool) return false;
    return pool.includes(geneId);
}

function loadOrInitGene(entity, entityId) {
    let pData = entity.getPersistentData();
    let geneId = pData.contains(GENE_KEY) ? pData.getString(GENE_KEY) : null;

    if (geneId) {
        if (isValidGene(entityId, geneId)) {
            applyGeneEffect(entity, geneId);
            return { geneId: geneId, isNew: false };
        }
        removeGeneEffect(entity, geneId);
        pData.remove(GENE_KEY);
    }

    let newGeneId = getRandomGene(entityId);
    if (!newGeneId) return { geneId: null, isNew: false };

    pData.putString(GENE_KEY, newGeneId);
    applyGeneEffect(entity, newGeneId);
    return { geneId: newGeneId, isNew: true };
}

function pickChildGene(childId, geneA, geneB) {
    let pool = getGenePool(childId);
    if (!pool || pool.length === 0) return null;

    let parentGenes = [];
    if (geneA && pool.includes(geneA)) parentGenes.push(geneA);
    if (geneB && pool.includes(geneB) && geneB !== geneA) parentGenes.push(geneB);

    if (parentGenes.length > 0 && Math.random() < 0.5) {
        return parentGenes[Math.floor(Math.random() * parentGenes.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityJoinLevelEvent", event => {
    if (event.getLevel().isClientSide()) return;
    let entity = event.getEntity();
    if (!entity.isLiving()) return;

    let entityId = entity.getType().toString();
    if (!getGenePool(entityId)) return;

    let result = loadOrInitGene(entity, entityId);
    if (result.isNew) {
        console.log(`[GeneSystem] ${entityId} 获得基因: ${result.geneId}`);
    }
});

ForgeEvents.onEvent("net.minecraftforge.event.entity.living.BabyEntitySpawnEvent", event => {
    let parentA = event.getParentA();
    let parentB = event.getParentB();
    let child = event.getChild();
    if (!parentA || !parentB || !child) return;

    let childId = child.getType().toString();
    if (!getGenePool(childId)) return;

    let geneA = parentA.getPersistentData().contains(GENE_KEY) ? parentA.getPersistentData().getString(GENE_KEY) : null;
    let geneB = parentB.getPersistentData().contains(GENE_KEY) ? parentB.getPersistentData().getString(GENE_KEY) : null;

    let childGene = pickChildGene(childId, geneA, geneB);
    if (!childGene) return;

    child.getPersistentData().putString(GENE_KEY, childGene);
    applyGeneEffect(child, childGene);

    console.log(`[GeneSystem] ${childId} 子嗣${geneA || geneB ? '继承' : '获得'}基因: ${childGene}`);
});
