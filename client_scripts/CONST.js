// priority: 10000
// 第一阶段规范整理：客户端所有 Java 类集中加载，类变量不使用 $ 前缀。
const Minecraft = Java.loadClass("net.minecraft.client.Minecraft");
const CameraType = Java.loadClass('net.minecraft.client.CameraType')
const Entitys = Java.loadClass('net.minecraft.world.entity.Entity')
const RenderType = Java.loadClass('net.minecraft.client.renderer.RenderType')
const CombatRoll = Java.tryLoadClass('net.combatroll.CombatRoll')
const CombatRollAttributes = Java.tryLoadClass('net.combatroll.api.EntityAttributes_CombatRoll')
// 末影箱按钮 (ender_chest_button) 使用的类
// 注意：$ImageButton 不能命名为 $Button，keytips/invScreen.js 已声明 let $Button（共享作用域会冲突）
// 禁止加载 java.lang.System / java.nio.file.* 等类：
// KubeJS 2001 默认类过滤器拦截整个 java.lang(白名单除外)/java.io/java.nio 包（BuiltinKubeJSPlugin.registerClasses），
// 且放行列表只能由 mod jar 的 kubejs.classfilter.txt 提供，脚本无法读取配置文件
const ImageButton = Java.loadClass("net.minecraft.client.gui.components.ImageButton")
const ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation")
const MobEffectUtil = Java.loadClass('net.minecraft.world.effect.MobEffectUtil')
const LivingEntity = Java.loadClass('net.minecraft.world.entity.LivingEntity')
const GLFW = Java.loadClass('org.lwjgl.glfw.GLFW')
const Color = Java.loadClass("java.awt.Color")
const ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries")
