// priority: 2000
const $KeyMappingRegistry = Java.loadClass("dev.architectury.registry.client.keymappings.KeyMappingRegistry");
const $KeyMapping = Java.loadClass("net.minecraft.client.KeyMapping");
const $GLFWkey = Java.loadClass("org.lwjgl.glfw.GLFW");

ClientEvents.init(() => {
  global.regKeyCharm = new $KeyMapping(
    "key.rainbow.charmkey", //按键的组名
    $GLFWkey.GLFW_KEY_V,
    "key.keybinding.rainbow.charmkey" //按键的名字
  );
  $KeyMappingRegistry.register(global.regKeyCharm);
});