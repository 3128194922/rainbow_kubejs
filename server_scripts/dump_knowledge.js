// ==========================================
// 📚 AI 知识库导出工具 (Dump Knowledge)
// 功能：导出当前环境的所有物品、药水、实体、流体、生成结构等数据 (CSV格式)
// ==========================================

let $Registries = Java.loadClass("net.minecraft.core.registries.Registries");

// 定义辅助函数，将 Java 集合转换为 JS 数组
function toJsArray(collection) {
    let arr = [];
    if (!collection) return arr;
    
    try {
        if (collection.forEach) {
            collection.forEach(item => {
                if (item) {
                    if (item.location) arr.push(item.location().toString());
                    else arr.push(item.toString());
                }
            });
        } else if (collection.iterator) {
            let it = collection.iterator();
            while (it.hasNext()) {
                let item = it.next();
                if (item) {
                    if (item.location) arr.push(item.location().toString());
                    else arr.push(item.toString());
                }
            }
        } else if (Array.isArray(collection)) {
            return collection.map(i => i.toString());
        }
    } catch (e) {
        console.error("toJsArray 转换失败: " + e);
    }
    return arr;
}

// 安全获取注册表数据
function getRegistryIds(server, registryKey) {
    try {
        let registry = server.registryAccess().registryOrThrow(registryKey);
        return toJsArray(registry.keySet());
    } catch (e) {
        console.error(`无法获取注册表 ID: ${e}`);
        return [];
    }
}

// 收集标签 (Tags)
function collectTags(server, type) {
    let tagList = [];
    try {
        if (server.tags && server.tags[type]) {
            tagList = tagList.concat(toJsArray(server.tags[type].tags));
        }

        if (tagList.length === 0) {
            let registryKeyMap = {
                'item': $Registries.ITEM,
                'block': $Registries.BLOCK,
                'entity_type': $Registries.ENTITY_TYPE,
                'fluid': $Registries.FLUID,
                'biome': $Registries.BIOME
            };
            let key = registryKeyMap[type];
            if (key) {
                let registry = server.registryAccess().registryOrThrow(key);
                if (registry.getTagNames) {
                    tagList = tagList.concat(toJsArray(registry.getTagNames()));
                }
            }
        }
    } catch (e) {
        console.error(`收集 ${type} 标签时出错: ${e}`);
    }
    return Array.from(new Set(tagList));
}

// 将简单字符串数组转换为单列CSV
function arrayToCsv(arr, header) {
    let csv = header + "\n";
    arr.forEach(item => {
        csv += "\"" + String(item).replace(/"/g, "\"\"") + "\"\n";
    });
    return csv;
}

// 将食物数据转换为CSV (多列)
function foodsToCsv(foods) {
    let csv = "id,hunger,saturation\n";
    foods.forEach(f => {
        csv += "\"" + String(f.id).replace(/"/g, "\"\"") + "\"," + f.hunger + "," + f.saturation + "\n";
    });
    return csv;
}

// 将标签数据转换为CSV (type,tag)
function tagsToCsv(tags) {
    let csv = "type,tag\n";
    let keys = Object.keys(tags);
    keys.forEach(type => {
        tags[type].forEach(tag => {
            csv += type + ",\"" + String(tag).replace(/"/g, "\"\"") + "\"\n";
        });
    });
    return csv;
}

ServerEvents.commandRegistry(event => {
    let { commands: Commands } = event;

    event.register(
        Commands.literal("dump_knowledge")
            .requires(src => src.hasPermission(2)) // 需要管理员权限
            .executes(ctx => {
                let source = ctx.source;
                let player = source.player;
                let server = source.server;

                try {
                    if (player) player.tell("§a[AI知识库] 正在收集游戏数据...");
                    console.log("[DumpKnowledge] 开始导出知识库...");

                    let data = {
                        version: "1.2.0",
                        timestamp: new Date().toLocaleString(),
                        minecraft_version: Platform.minecraftVersion,
                        mod_count: Platform.mods.size(),
                        items: [],
                        foods: [], // 专门存放食物属性
                        effects: getRegistryIds(server, $Registries.MOB_EFFECT),
                        entities: getRegistryIds(server, $Registries.ENTITY_TYPE),
                        fluids: getRegistryIds(server, $Registries.FLUID),
                        blocks: getRegistryIds(server, $Registries.BLOCK),
                        biomes: getRegistryIds(server, $Registries.BIOME),
                        enchantments: getRegistryIds(server, $Registries.ENCHANTMENT),
                        structures: getRegistryIds(server, $Registries.STRUCTURE), // 生成结构
                        structure_sets: getRegistryIds(server, $Registries.STRUCTURE_SET), // 结构集
                        template_pools: getRegistryIds(server, $Registries.TEMPLATE_POOL), // 模板池
                        tags: {
                            item: collectTags(server, 'item'),
                            block: collectTags(server, 'block'),
                            entity_type: collectTags(server, 'entity_type'),
                            fluid: collectTags(server, 'fluid')
                        }
                    };

                    // 1. 物品与食物收集
                    Ingredient.all.itemIds.forEach(itemId => {
                        data.items.push(itemId);
                        try {
                            let item = Item.of(itemId).item;
                            if (item.foodProperties) {
                                let fp = item.foodProperties;
                                data.foods.push({
                                    id: itemId,
                                    hunger: fp.getNutrition(),
                                    saturation: parseFloat((fp.getNutrition() * fp.getSaturationModifier() * 2.0).toFixed(2))
                                });
                            }
                        } catch (e) {
                            // 忽略单个物品获取失败的情况
                        }
                    });

                    // 准备输出目录
                    let baseDir = 'kubejs';
                    if (!FilesJS.exists(baseDir)) FilesJS.createDirectory(baseDir);
                    let splitDir = baseDir + '/knowledge_base';
                    if (!FilesJS.exists(splitDir)) FilesJS.createDirectory(splitDir);

                    // 写入各模块 CSV 文件
                    // 简单数组模块写入单列CSV
                    let simpleModules = [
                        { key: 'items', file: 'items.csv', header: 'id' },
                        { key: 'effects', file: 'effects.csv', header: 'id' },
                        { key: 'entities', file: 'entities.csv', header: 'id' },
                        { key: 'fluids', file: 'fluids.csv', header: 'id' },
                        { key: 'blocks', file: 'blocks.csv', header: 'id' },
                        { key: 'biomes', file: 'biomes.csv', header: 'id' },
                        { key: 'enchantments', file: 'enchantments.csv', header: 'id' },
                        { key: 'structures', file: 'structures.csv', header: 'id' },
                        { key: 'structure_sets', file: 'structure_sets.csv', header: 'id' },
                        { key: 'template_pools', file: 'template_pools.csv', header: 'id' }
                    ];
                    simpleModules.forEach(mod => {
                        FilesJS.writeFile(splitDir + '/' + mod.file, arrayToCsv(data[mod.key], mod.header));
                    });

                    // foods.csv (多列)
                    FilesJS.writeFile(splitDir + '/foods.csv', foodsToCsv(data.foods));

                    // tags.csv (合并所有标签类型)
                    FilesJS.writeFile(splitDir + '/tags.csv', tagsToCsv(data.tags));

                    // 写入索引 CSV
                    let indexCsv = "module,file,count\n";
                    indexCsv += "items,items.csv," + data.items.length + "\n";
                    indexCsv += "foods,foods.csv," + data.foods.length + "\n";
                    simpleModules.forEach(mod => {
                        if (mod.key !== 'items') { // items 已单独写入
                            indexCsv += mod.key + "," + mod.file + "," + data[mod.key].length + "\n";
                        }
                    });
                    let tagKeys = Object.keys(data.tags);
                    let totalTags = 0;
                    tagKeys.forEach(k => { totalTags += data.tags[k].length; });
                    indexCsv += "tags,tags.csv," + totalTags + "\n";
                    FilesJS.writeFile(splitDir + '/index.csv', indexCsv);

                    let msg = "§b[AI知识库] CSV导出成功！文件已保存至: §e" + splitDir + "/";
                    if (player) player.tell(msg);
                    console.log(msg);
                    
                    return 1;
                } catch (err) {
                    let errorMsg = "§c[AI知识库] 导出失败: " + err.message;
                    if (player) player.tell(errorMsg);
                    console.error("[DumpKnowledge] 致命错误: " + err);
                    return 0;
                }
            })
    );
});
