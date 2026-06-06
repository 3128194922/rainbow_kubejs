// 监听实体受伤事件
EntityEvents.hurt(event => {
    const { entity, source } = event;

    if (source.player) {
        let uuid = entity.UUID;
        let luck = source.player.getAttribute("minecraft:generic.luck").getValue();
        let isInfernium = randomBool(0.5);

        if (luck < 0 && isInfernium) {
            entity.server.runCommandSilent(`/dyeing paint add static ${uuid} 80FF0000`)
            entity.modifyAttribute("generic.max_health","hungry",100,"addition")
        }

    }

});