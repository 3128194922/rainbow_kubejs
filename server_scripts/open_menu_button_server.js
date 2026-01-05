// Open Menu Button - server_scripts
/*
let $SimpleMenuProvider = Java.loadClass("net.minecraft.world.SimpleMenuProvider");
let $CraftingMenu = Java.loadClass("net.minecraft.world.inventory.CraftingMenu");
let $ChestMenu = Java.loadClass("net.minecraft.world.inventory.ChestMenu");
let $Optional = Java.loadClass("java.util.Optional");

NetworkEvents.dataReceived("server", (event) => {
    const { data, player, level } = event;

    if (data.open_menu == "enderchest") {
        player.openInventoryGUI(player.enderChestInventory, Component.translatable("container.enderchest"));
    }

    if (data.open_menu == "trashcan") {
        level.server.runCommandSilent(`/execute as ${player.getDisplayName().getString()} run dialog show hello_world`)
    }
});
*/