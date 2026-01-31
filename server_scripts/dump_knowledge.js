// ==========================================
// 📚 AI 知识库导出工具 (Dump Knowledge)
// 功能：导出当前环境的所有物品、药水、实体、流体等数据
// ==========================================

let $Registries = Java.loadClass("net.minecraft.core.registries.Registries");
let SPLIT_THRESHOLD = 200 * 1024; // 200KB 阈值

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

                    let fullJson = JSON.stringify(data, null, 4);
                    let baseDir = 'kubejs/data';
                    if (!FilesJS.exists(baseDir)) FilesJS.createDirectory(baseDir);

                    if (fullJson.length > SPLIT_THRESHOLD) {
                        if (player) player.tell("§e[AI知识库] 数据量较大 (" + (fullJson.length / 1024).toFixed(1) + "KB)，正在执行模块化拆分导出...");
                        
                        let splitDir = baseDir + '/knowledge_base';
                        if (!FilesJS.exists(splitDir)) FilesJS.createDirectory(splitDir);

                        // 索引文件
                        let index = {
                            version: data.version,
                            timestamp: data.timestamp,
                            minecraft_version: data.minecraft_version,
                            mod_count: data.mod_count,
                            description: "由于数据超过 200KB，已拆分为多个模块文件以优化加载。",
                            modules: {}
                        };

                        // 模块列表
                        let modules = ['items', 'foods', 'effects', 'entities', 'fluids', 'blocks', 'biomes', 'enchantments', 'tags'];
                        modules.forEach(mod => {
                            let modFileName = `${mod}.json`;
                            let modPath = `${splitDir}/${modFileName}`;
                            FilesJS.writeFile(modPath, JSON.stringify(data[mod], null, 4));
                            index.modules[mod] = {
                                file: modFileName,
                                count: Array.isArray(data[mod]) ? data[mod].length : Object.keys(data[mod]).length
                            };
                        });

                        FilesJS.writeFile(`${splitDir}/index.json`, JSON.stringify(index, null, 4));

                        let msg = `§b[AI知识库] 拆分导出成功！\n§7索引文件: §e${splitDir}/index.json`;
                        if (player) player.tell(msg);
                        console.log(msg);
                    } else {
                        let fileName = `${baseDir}/knowledge_base.json`;
                        FilesJS.writeFile(fileName, fullJson);
                        let msg = `§b[AI知识库] 导出成功！文件已保存至: §e${fileName}`;
                        if (player) player.tell(msg);
                        console.log(msg);
                    }
                    
                    return 1;
                } catch (err) {
                    let errorMsg = `§c[AI知识库] 导出失败: ${err.message}`;
                    if (player) player.tell(errorMsg);
                    console.error(`[DumpKnowledge] 致命错误: ${err}`);
                    return 0;
                }
            })
    );
});
