// ==========================================
// 获取属性命令
// Get Attributes Command
// ==========================================
// 注册 /getattributes 命令，列出所有注册的属性及其翻译
// Registers /getattributes command to list all registered attributes with translations

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries");

    event.register(
        Commands.literal("getattributes")
            .requires(s => s.hasPermission(2))
            .executes(ctx => {
                const source = ctx.source;
                let attributesList = [];
                
                try {
                    // 获取所有注册的属性
                    // Get all registered attributes
                    let attributes = ForgeRegistries.ATTRIBUTES.getValues();
                    
                    for (let attr of attributes) {
                        let key = ForgeRegistries.ATTRIBUTES.getKey(attr);
                        if (key) {
                            // 获取属性的翻译键
                            // Get attribute translation key
                            let descriptionId = attr.getDescriptionId();
                            attributesList.push({
                                id: key.toString(),
                                translationKey: descriptionId
                            });
                        }
                    }
                    
                    // 按ID排序
                    attributesList.sort((a, b) => a.id.localeCompare(b.id));

                    source.sendSuccess(Component.string(`§a共找到 ${attributesList.length} 种属性:`), false);
                    
                    attributesList.forEach(attr => {
                        // 使用 Component.translatable 显示本地化名称
                        // Use Component.translatable to show localized name
                        let message = Component.literal("§e- ")
                            .append(Component.translatable(attr.translationKey))
                            .append(Component.literal(` (§7${attr.id}§e)`));
                            
                        source.sendSuccess(message, false);
                        
                        // 控制台输出 (Console output)
                        // 尝试解析翻译文本，如果服务端未加载语言文件可能显示为键名或英文
                        let translatedName = Component.translatable(attr.translationKey).getString();
                        console.info(`Attribute: ${translatedName} | ID: ${attr.id} | Key: ${attr.translationKey}`);
                    });

                    console.info(`Listed ${attributesList.length} attributes.`);

                } catch (e) {
                    source.sendFailure(Component.string(`§c命令执行出错: ${e}`));
                    console.error("Error in getattributes command:", e);
                }

                return 1;
            })
    );
});
