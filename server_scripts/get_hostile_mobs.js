ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    const ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries");
    const MobCategory = Java.loadClass("net.minecraft.world.entity.MobCategory");

    event.register(
        Commands.literal("gethostilemobs")
            .requires(s => s.hasPermission(2))
            .executes(ctx => {
                const source = ctx.source;
                let hostileMobs = [];
                
                try {
                    let entityTypes = ForgeRegistries.ENTITY_TYPES.getValues();
                    
                    for (let type of entityTypes) {
                        if (type.getCategory() == MobCategory.MONSTER) {
                             let key = ForgeRegistries.ENTITY_TYPES.getKey(type);
                             if (key) {
                                 // 获取生物的显示名称
                                 let name = type.getDescription().getString();
                                 hostileMobs.push({
                                     id: key.toString(),
                                     name: name
                                 });
                             }
                        }
                    }
                    
                    // 按ID排序
                    hostileMobs.sort((a, b) => a.id.localeCompare(b.id));

                    source.sendSuccess(Component.string(`§a共找到 ${hostileMobs.length} 种敌对生物 (Category: MONSTER):`), false);
                    
                    hostileMobs.forEach(mob => {
                        source.sendSuccess(Component.string(`§e- ${mob.name} (${mob.id})`), false);
                        console.info(`Hostile Mob: ${mob.name} (${mob.id})`);
                    });

                } catch (e) {
                    source.sendFailure(Component.string(`§c命令执行出错: ${e}`));
                    console.error("Error in gethostilemobs command:", e);
                }

                return 1;
            })
    );
});
