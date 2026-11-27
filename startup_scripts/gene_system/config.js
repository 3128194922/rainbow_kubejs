// GENE_SYSTEM_DISABLED-NOTE: 实体基因系统已停用（2026-11-27）。恢复时删除每行开头的 "// [GENE_SYSTEM_DISABLED] "，本行保留。
// [GENE_SYSTEM_DISABLED] // priority: 15000
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] /**
// [GENE_SYSTEM_DISABLED]  * 实体基因池配置
// [GENE_SYSTEM_DISABLED]  * 实体ID -> 基因片段列表（字符串，长度不限）
// [GENE_SYSTEM_DISABLED]  * 实体生成时从中随机获得一个基因片段，每个实体只有唯一一个基因
// [GENE_SYSTEM_DISABLED]  */
// [GENE_SYSTEM_DISABLED] global.EntityGenePool = {
// [GENE_SYSTEM_DISABLED]     "minecraft:bat": ["AA", "BB", "AB"],
// [GENE_SYSTEM_DISABLED] };
// [GENE_SYSTEM_DISABLED] 
// [GENE_SYSTEM_DISABLED] /**
// [GENE_SYSTEM_DISABLED]  * 基因效果映射
// [GENE_SYSTEM_DISABLED]  * 基因ID -> 属性修饰器配置
// [GENE_SYSTEM_DISABLED]  * 若基因未在此映射中定义，则仅为标签存储，不应用任何属性效果
// [GENE_SYSTEM_DISABLED]  */
// [GENE_SYSTEM_DISABLED] global.GeneEffectMap = {
// [GENE_SYSTEM_DISABLED]     "AA": {
// [GENE_SYSTEM_DISABLED]         attribute: "attributeslib:creative_flight",
// [GENE_SYSTEM_DISABLED]         UUID: "aba249fe-82bd-45f4-ab00-8452d027e00f",
// [GENE_SYSTEM_DISABLED]         NUMBER: 1,
// [GENE_SYSTEM_DISABLED]         OPERATION: "addition"
// [GENE_SYSTEM_DISABLED]     },
// [GENE_SYSTEM_DISABLED]     "BB": {
// [GENE_SYSTEM_DISABLED]         attribute: "moreattribute:size_scale",
// [GENE_SYSTEM_DISABLED]         UUID: "34782055-835a-4deb-8151-d38f06b05b65",
// [GENE_SYSTEM_DISABLED]         NUMBER: -0.5,
// [GENE_SYSTEM_DISABLED]         OPERATION: "multiply_total"
// [GENE_SYSTEM_DISABLED]     }
// [GENE_SYSTEM_DISABLED] };
