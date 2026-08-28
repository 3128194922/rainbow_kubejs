// priority: 0
// ==========================================
// 末影箱按钮
// Ender Chest Button
// ==========================================
// 在玩家生存模式背包 GUI (InventoryScreen) 的 Field-Guide 图鉴按钮左侧
// 挂载一个原生 ImageButton 组件，点击后发送网络包到服务端打开原版末影箱
// 服务端处理见 server_scripts/open_menu_button_server.js (open_menu == "enderchest")
//
// 实现方式（与 Field-Guide 的 InventoryScreenMixin 同款）：
// new ImageButton(...) + screen.addRenderableWidget()，点击/悬停/音效由原版 GUI 原生处理
// 按钮底使用原版 widgets.png 灰色按钮贴图（与配方书按钮同款）
//
// 位置自适应：直接读取 Field-Guide 挂在 Screen 上的图鉴按钮实例（mixin 字段
// fieldguide$guideButton）的 getX()/getY()，实时跟随其位置。
// Field-Guide 的 mixin 在每帧 render 时把按钮同步到配置位置（updateButtonPosition），
// 因此本方案对任何图鉴按钮配置改动即时生效，且无需读取配置文件
// （java.lang.System / java.nio.file 被 KubeJS 类过滤器拦截，读文件方案不可行）
//
// 按钮实例读不到时（如 showInventoryButton=false 导致图鉴按钮未创建），退回默认偏移
// （Field-Guide ClientConfig 默认值 inventoryButtonXOffset=126, YOffset=61）

// Field-Guide 图鉴按钮默认偏移（退回方案用）
const EC_GUIDE_DEFAULT_X = 126
const EC_GUIDE_DEFAULT_Y = 61
// 图鉴按钮尺寸 20x18，末影箱按钮放其左侧，留 2px 间距
// （右侧会与原版配方书按钮区域重叠，故选左侧）
const EC_BUTTON_OFFSET_X = -22 // -(20(按钮宽) + 2(间距))
// 末影箱按钮尺寸
const EC_BUTTON_W = 20
const EC_BUTTON_H = 18
// 末影箱物品图标 16x16，在按钮内居中的偏移
const EC_ICON_X = 2
const EC_ICON_Y = 1
// 按钮贴图：复制自 Field-Guide 的 fieldguide_inventory_button.png 并擦除书本图标
// （背景/边框/悬停高亮与图鉴按钮完全同款），末影箱图标由 renderGuiItem 叠加
// 20x36 = 两帧：v=0 普通态（灰底 C6C6C6），v=18 悬停态（蓝底 8892C9）
//
// 帧偏移公式（AbstractWidget.renderTexture，与 ImageButton 的 v/vDiff 语义一致）：
//   普通态 = v，悬停态 = v + vDiff，禁用态 = v + 2*vDiff
// 注意：v 指向普通帧！曾误用 widgets.png 的 v=46（实为禁用帧，深色蒙版的根因）
const EC_WIDGETS_TEXTURE = new $ResourceLocation("kubejs", "textures/gui/ender_chest_button.png")
const EC_WIDGETS_U = 0
const EC_WIDGETS_V = 0
const EC_WIDGETS_HOVER_DIFF = 18
const EC_WIDGETS_TEX_W = 20
const EC_WIDGETS_TEX_H = 36

// ARGB 颜色常量
// 注意：KubeJS Rhino 中超过 Integer.MAX_VALUE (0x7FFFFFFF) 的颜色字面量
// 会被当作无符号 double，无法转换为 java.lang.Integer，必须用有符号 32 位表示
// 0xFFFFF2A0 = 4294912000 - 4294967296 = -55296
var EC_COLOR_HIGHLIGHT = -55296  // 0xFFFFF2A0 暖黄色悬停文字

// 按钮实例与挂载状态跟踪
var ecButtonInstance = null  // 当前挂载的 ImageButton 实例
var ecButtonScreen = null    // 挂载时的 Screen 实例（实例变化时重建按钮）
// 位置跟踪模式（一次性诊断日志用）：'guide' = 跟随图鉴按钮实例，'default' = 固定默认偏移
var ecPosMode = ""

// 判断当前屏幕是否为生存模式背包 GUI
// 注意：event.screen / mc.screen 是原始 Java Screen 对象，
// KubeJS Rhino 的 instanceof 对其不可用（TypeError: Can't use 'instanceof' on a non-object），
// 改用类名比较（与 tobackroom.js 相同模式）
// 兼容 Quark 的 quark:backpack：玩家穿戴 Quark 背包时，背包界面会替换为
// org.violetmoon.quark.addons.oddities.client.screen.BackpackInventoryScreen（继承 InventoryScreen），
// Field-Guide 的 mixin 作用于 InventoryScreen，其按钮与字段在子类界面同样存在
var EC_INV_SCREEN_CLASS = "net.minecraft.client.gui.screens.inventory.InventoryScreen"
var EC_BACKPACK_SCREEN_CLASS = "org.violetmoon.quark.addons.oddities.client.screen.BackpackInventoryScreen"

function ecIsInvScreen(screen) {
    if (screen == null) return false
    var name = screen.getClass().getName()
    return name == EC_INV_SCREEN_CLASS || name == EC_BACKPACK_SCREEN_CLASS
}

// 判断坐标是否在按钮矩形范围内
function ecIsInButton(mx, my, x, y) {
    return mx >= x && mx < x + EC_BUTTON_W && my >= y && my < y + EC_BUTTON_H
}

// 计算末影箱按钮的 GUI 坐标
// 优先读取 Field-Guide 图鉴按钮实例的实际位置（完全自适应，跟随任何配置改动）；
// 读不到时退回默认偏移
function ecGetButtonPos(screen) {
    try {
        // Field-Guide InventoryScreenMixin 的 @Unique 字段（private，Rhino 可通过属性访问读取）
        var guide = screen["fieldguide$guideButton"]
        if (guide != null) {
            if (ecPosMode != "guide") {
                ecPosMode = "guide"
                console.log("[末影箱按钮] 位置模式: 跟随图鉴按钮实例")
            }
            return { x: guide.getX() + EC_BUTTON_OFFSET_X, y: guide.getY() }
        }
    } catch (e) {
        // 字段访问失败则走退回方案
    }
    if (ecPosMode != "default") {
        ecPosMode = "default"
        console.log("[末影箱按钮] 位置模式: 默认偏移 (" + EC_GUIDE_DEFAULT_X + ", " + EC_GUIDE_DEFAULT_Y + ")（未找到图鉴按钮实例）")
    }
    return { x: screen.getGuiLeft() + EC_GUIDE_DEFAULT_X + EC_BUTTON_OFFSET_X, y: screen.getGuiTop() + EC_GUIDE_DEFAULT_Y }
}

// 版本标记：用于确认脚本已重载
console.log("[末影箱按钮] 脚本已加载 v10（children 包含性检测，修复全屏切换后背景消失）")

// =========================
// 按钮挂载与管理（ClientEvents.tick 轮询）
// 1. 进入背包界面（Screen 实例变化）时创建 ImageButton 并 addRenderableWidget 挂载
// 2. 每 tick 检测按钮是否仍在 screen.children 中，不在则重新挂载同一实例：
//    全屏/窗口切换会触发 Screen.resize → repositionElements → rebuildWidgets
//    → clearWidgets + init，把本按钮清掉；但 gui 缩放尺寸可能恰好不变
//    （如小窗口正好是全屏分辨率的 1/2，auto 缩放从 2 变 4），宽高比较检测不可靠，
//    改用 children 包含性检测（覆盖一切组件清空场景，含 resize/rebuildWidgets）
// 3. 每 tick 用 setX/setY 跟随图鉴按钮位置（自适应；resize 后 Field-Guide 的
//    init 注入会重建其按钮，本按钮位置读取自动切换到新实例）
// =========================
ClientEvents.tick(event => {
    try {
        var mc = $Minecraft.getInstance()
        var screen = mc.screen
        // 仅在生存模式背包 GUI 中生效（创造模式是 CreativeModeInventoryScreen，不匹配）
        if (!ecIsInvScreen(screen)) {
            // 离开背包界面：Screen 关闭时其组件一起销毁，只需重置跟踪状态
            ecButtonInstance = null
            ecButtonScreen = null
            ecPosMode = "" // 重新进入时重置诊断日志
            return
        }

        // Screen 实例变化（重开背包）时创建新按钮
        if (ecButtonScreen != screen) {
            ecButtonScreen = screen

            var player = event.player // 闭包捕获，供点击回调使用
            var pos = ecGetButtonPos(screen)

            // 原生 ImageButton（public 构造函数，直接 new，参数与 Field-Guide 的调用同构）：
            // x, y, w, h, u, v, 悬停v位移, 贴图, 贴图宽, 贴图高, onPress 回调
            ecButtonInstance = new $ImageButton(
                pos.x, pos.y, EC_BUTTON_W, EC_BUTTON_H,
                EC_WIDGETS_U, EC_WIDGETS_V, EC_WIDGETS_HOVER_DIFF,
                EC_WIDGETS_TEXTURE, EC_WIDGETS_TEX_W, EC_WIDGETS_TEX_H,
                function (btn) {
                    console.log("[末影箱按钮] 点击末影箱按钮，发送打开请求")
                    player.sendData("server", { open_menu: "enderchest" })
                }
            )
            screen.addRenderableWidget(ecButtonInstance)
            console.log("[末影箱按钮] 按钮已挂载: pos=(" + pos.x + ", " + pos.y + ") screen=" + screen.getClass().getSimpleName())
        } else if (ecButtonInstance != null && screen.children().indexOf(ecButtonInstance) < 0) {
            // 按钮被 resize/init 清空（如全屏切换），同一实例重新挂载
            screen.addRenderableWidget(ecButtonInstance)
            console.log("[末影箱按钮] 检测到组件被清空（resize/init），已重新挂载")
        }

        // 每 tick 更新按钮位置（跟随图鉴按钮自适应位置）
        if (ecButtonInstance != null) {
            var pos = ecGetButtonPos(screen)
            // Field-Guide mixin 同款更新方式（setX/setY）
            ecButtonInstance.setX(pos.x)
            ecButtonInstance.setY(pos.y)
        }
    } catch (e) {
        console.log("[末影箱按钮] 按钮管理出现问题：")
        console.log(e)
    }
})

// =========================
// 渲染叠加：在 ImageButton 上绘制末影箱物品图标与悬停文字
// ImageButton 自带灰色按钮底/悬停态/点击音效，这里叠加居中的末影箱图标
// 悬停文字用 renderjs 事件的 drawShadowString 绘制
// =========================
RenderJSEvents.onScreenPostRender(event => {
    try {
        var screen = event.screen
        if (!ecIsInvScreen(screen)) return
        if (ecButtonInstance == null) return

        var pos = ecGetButtonPos(screen)
        event.renderGuiItem(Item.of("minecraft:ender_chest"), pos.x + EC_ICON_X, pos.y + EC_ICON_Y)

        // 悬停时在按钮下方绘制文字提示
        var hovered = ecIsInButton(event.getMouseX(), event.getMouseY(), pos.x, pos.y)
        if (hovered) {
            event.drawShadowString(Component.literal("末影箱"), pos.x, pos.y + EC_BUTTON_H + 2, EC_COLOR_HIGHLIGHT)
        }
    } catch (e) {
        console.log("[末影箱按钮] 图标渲染出现问题：")
        console.log(e)
    }
})
