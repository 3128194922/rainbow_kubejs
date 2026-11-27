// GENE_SYSTEM_DISABLED-NOTE: 实体基因系统已停用（2026-11-27）。恢复时删除每行开头的 "// [GENE_SYSTEM_DISABLED] "，本行保留。
// [GENE_SYSTEM_DISABLED] // priority: 10000
// [GENE_SYSTEM_DISABLED] // ==========================================
// [GENE_SYSTEM_DISABLED] // 🧬 基因系统
// [GENE_SYSTEM_DISABLED] // 从 global.EntityGenePool 读取实体基因池（String[]）
// [GENE_SYSTEM_DISABLED] // 从 global.GeneEffectMap 读取基因对应的属性效果
// [GENE_SYSTEM_DISABLED] // 生物生成时随机获得一个基因并应用效果
// [GENE_SYSTEM_DISABLED] // 繁殖时子嗣概率继承父母基因或随机获得新基因
// [GENE_SYSTEM_DISABLED] // ==========================================
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] // UUID / AttributeModifier / AttributeModifierOperation 统一由 startup_scripts/CONST.js 提供。
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] const GENE_KEY = "entity_gene";
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function getOperation(opName) {
// [GENE_SYSTEM_DISABLED]     if (opName === "multiply_base") return AttributeModifierOperation.MULTIPLY_BASE;
// [GENE_SYSTEM_DISABLED]     if (opName === "multiply_total") return AttributeModifierOperation.MULTIPLY_TOTAL;
// [GENE_SYSTEM_DISABLED]     return AttributeModifierOperation.ADDITION;
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function getGenePool(entityId) {
// [GENE_SYSTEM_DISABLED]     if (!global.EntityGenePool) return null;
// [GENE_SYSTEM_DISABLED]     return global.EntityGenePool[entityId];
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function getGeneEffect(geneId) {
// [GENE_SYSTEM_DISABLED]     if (!global.GeneEffectMap) return null;
// [GENE_SYSTEM_DISABLED]     return global.GeneEffectMap[geneId];
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function applyGeneEffect(entity, geneId) {
// [GENE_SYSTEM_DISABLED]     if (!geneId || !entity) return false;
// [GENE_SYSTEM_DISABLED]     let effect = getGeneEffect(geneId);
// [GENE_SYSTEM_DISABLED]     if (!effect) return true;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     try {
// [GENE_SYSTEM_DISABLED]         let attribute = entity.getAttribute(effect.attribute);
// [GENE_SYSTEM_DISABLED]         if (!attribute) return false;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]         let uuid = UUID.fromString(effect.UUID);
// [GENE_SYSTEM_DISABLED]         let modifier = new AttributeModifier(uuid, geneId, effect.NUMBER, getOperation(effect.OPERATION));
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]         attribute.removeModifier(uuid);
// [GENE_SYSTEM_DISABLED]         attribute.addPermanentModifier(modifier);
// [GENE_SYSTEM_DISABLED]         return true;
// [GENE_SYSTEM_DISABLED]     } catch (e) {
// [GENE_SYSTEM_DISABLED]         console.error(`[GeneSystem] 应用基因效果失败 [${geneId}]: ${e}`);
// [GENE_SYSTEM_DISABLED]         return false;
// [GENE_SYSTEM_DISABLED]     }
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function removeGeneEffect(entity, geneId) {
// [GENE_SYSTEM_DISABLED]     if (!geneId || !entity) return;
// [GENE_SYSTEM_DISABLED]     let effect = getGeneEffect(geneId);
// [GENE_SYSTEM_DISABLED]     if (!effect) return;
// [GENE_SYSTEM_DISABLED]     try {
// [GENE_SYSTEM_DISABLED]         let attribute = entity.getAttribute(effect.attribute);
// [GENE_SYSTEM_DISABLED]         if (attribute) {
// [GENE_SYSTEM_DISABLED]             let uuid = UUID.fromString(effect.UUID);
// [GENE_SYSTEM_DISABLED]             attribute.removeModifier(uuid);
// [GENE_SYSTEM_DISABLED]         }
// [GENE_SYSTEM_DISABLED]     } catch (e) {}
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function getRandomGene(entityId) {
// [GENE_SYSTEM_DISABLED]     let pool = getGenePool(entityId);
// [GENE_SYSTEM_DISABLED]     if (!pool || pool.length === 0) return null;
// [GENE_SYSTEM_DISABLED]     return pool[Math.floor(Math.random() * pool.length)];
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function isValidGene(entityId, geneId) {
// [GENE_SYSTEM_DISABLED]     let pool = getGenePool(entityId);
// [GENE_SYSTEM_DISABLED]     if (!pool) return false;
// [GENE_SYSTEM_DISABLED]     return pool.includes(geneId);
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function loadOrInitGene(entity, entityId) {
// [GENE_SYSTEM_DISABLED]     let pData = entity.getPersistentData();
// [GENE_SYSTEM_DISABLED]     let geneId = pData.contains(GENE_KEY) ? pData.getString(GENE_KEY) : null;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     if (geneId) {
// [GENE_SYSTEM_DISABLED]         if (isValidGene(entityId, geneId)) {
// [GENE_SYSTEM_DISABLED]             applyGeneEffect(entity, geneId);
// [GENE_SYSTEM_DISABLED]             return { geneId: geneId, isNew: false };
// [GENE_SYSTEM_DISABLED]         }
// [GENE_SYSTEM_DISABLED]         removeGeneEffect(entity, geneId);
// [GENE_SYSTEM_DISABLED]         pData.remove(GENE_KEY);
// [GENE_SYSTEM_DISABLED]     }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let newGeneId = getRandomGene(entityId);
// [GENE_SYSTEM_DISABLED]     if (!newGeneId) return { geneId: null, isNew: false };
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     pData.putString(GENE_KEY, newGeneId);
// [GENE_SYSTEM_DISABLED]     applyGeneEffect(entity, newGeneId);
// [GENE_SYSTEM_DISABLED]     return { geneId: newGeneId, isNew: true };
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] function pickChildGene(childId, geneA, geneB) {
// [GENE_SYSTEM_DISABLED]     let pool = getGenePool(childId);
// [GENE_SYSTEM_DISABLED]     if (!pool || pool.length === 0) return null;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let parentGenes = [];
// [GENE_SYSTEM_DISABLED]     if (geneA && pool.includes(geneA)) parentGenes.push(geneA);
// [GENE_SYSTEM_DISABLED]     if (geneB && pool.includes(geneB) && geneB !== geneA) parentGenes.push(geneB);
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     if (parentGenes.length > 0 && Math.random() < 0.5) {
// [GENE_SYSTEM_DISABLED]         return parentGenes[Math.floor(Math.random() * parentGenes.length)];
// [GENE_SYSTEM_DISABLED]     }
// [GENE_SYSTEM_DISABLED]     return pool[Math.floor(Math.random() * pool.length)];
// [GENE_SYSTEM_DISABLED] }
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityJoinLevelEvent", event => {
// [GENE_SYSTEM_DISABLED]     if (event.getLevel().isClientSide()) return;
// [GENE_SYSTEM_DISABLED]     let entity = event.getEntity();
// [GENE_SYSTEM_DISABLED]     if (!entity.isLiving()) return;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let entityId = entity.getType().toString();
// [GENE_SYSTEM_DISABLED]     if (!getGenePool(entityId)) return;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let result = loadOrInitGene(entity, entityId);
// [GENE_SYSTEM_DISABLED]     /*if (result.isNew) {
// [GENE_SYSTEM_DISABLED]         console.log(`[GeneSystem] ${entityId} 获得基因: ${result.geneId}`);
// [GENE_SYSTEM_DISABLED]     }*/
// [GENE_SYSTEM_DISABLED] });
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] ForgeEvents.onEvent("net.minecraftforge.event.entity.living.BabyEntitySpawnEvent", event => {
// [GENE_SYSTEM_DISABLED]     let parentA = event.getParentA();
// [GENE_SYSTEM_DISABLED]     let parentB = event.getParentB();
// [GENE_SYSTEM_DISABLED]     let child = event.getChild();
// [GENE_SYSTEM_DISABLED]     if (!parentA || !parentB || !child) return;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let childId = child.getType().toString();
// [GENE_SYSTEM_DISABLED]     if (!getGenePool(childId)) return;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let geneA = parentA.getPersistentData().contains(GENE_KEY) ? parentA.getPersistentData().getString(GENE_KEY) : null;
// [GENE_SYSTEM_DISABLED]     let geneB = parentB.getPersistentData().contains(GENE_KEY) ? parentB.getPersistentData().getString(GENE_KEY) : null;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     let childGene = pickChildGene(childId, geneA, geneB);
// [GENE_SYSTEM_DISABLED]     if (!childGene) return;
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     child.getPersistentData().putString(GENE_KEY, childGene);
// [GENE_SYSTEM_DISABLED]     applyGeneEffect(child, childGene);
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED]     //console.log(`[GeneSystem] ${childId} 子嗣${geneA || geneB ? '继承' : '获得'}基因: ${childGene}`);
// [GENE_SYSTEM_DISABLED] });
