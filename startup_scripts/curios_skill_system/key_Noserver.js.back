// priority: 2000
// ==========================================
// 饰品技能按键注册
// Curios Skill Key Registration
// ==========================================
// 注册用于触发饰品技能的快捷键
// Registers key bindings for triggering curios skills

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