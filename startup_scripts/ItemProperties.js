ItemEvents.modelProperties(event => {
    event.register("rainbow:terasword", "powers", (itemStack, level, entity, seed) => {
        return itemStack.nbt.getDouble("power") >= 1.0 ? 1.0 : 0.0;
    });
    event.register("rainbow:baseball_bat", "poweroff", (itemStack, level, entity, seed) => {
        return itemStack.nbt.getDouble("poweroff") == 1.0 ? 1.0 : 0.0;
    });
});
