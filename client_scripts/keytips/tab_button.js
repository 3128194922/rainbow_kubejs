// priority: 0
// ==========================================
// 界面帮助选项卡按钮
// Inventory Help Tab Button
// ==========================================
// 在生存模式背包 GUI 右上角的 Reliable-Advancements 进度选项卡左侧
// 挂载一个同款 28x32 选项卡按钮（复用 RA 的 tabs.png 选项卡贴图帧），
// 按钮图标为文本 "?"，点击切换 keytips 引导提示（见 keytips/invScreen.js）
// 的显示，再点击一次关闭。
//
// 位置自适应：扫描 screen.children() 查找 RA 挂载的
// AdvancementsScreenButton 实例，每 tick 读取其 getX()/getY() 实时跟随
// （RA 的按钮每帧通过位置 supplier 自行更新坐标）；找不到实例时按 RA
// 默认 TAB 布局退回计算（x = guiLeft + imageWidth - 28, y = guiTop - 28）。
//
// 类加载：$ImageButton / $ResourceLocation / $Minecraft 均已在
// client_scripts/CONST.js 声明（client_scripts 共享作用域，禁止重复声明）

// RA 进度选项卡按钮类名（运行时扫描用）
var KT_RA_BUTTON_CLASS = "com.evandev.reliable_advancements.gui.button.AdvancementsScreenButton"
// 选项卡尺寸（与 RA TAB 风格一致：28x32）
var KT_TAB_W = 28
var KT_TAB_H = 32
// RA 默认 TAB 布局常量（退回方案用）：imageWidth=176，选项卡 y 偏移 -28
var KT_FALLBACK_IMAGE_W = 176
var KT_FALLBACK_Y_OFFSET = 28
// 选项卡贴图：复用 RA 的 tabs.png（u=56 为 RA 同款选项卡帧）
// 帧偏移公式（AbstractWidget.renderTexture）：普通态=v，悬停态=v+vDiff
// tabs.png 的 v=32 为悬停帧（与原版 TabButton 悬停帧一致）
var KT_TAB_TEXTURE = new $ResourceLocation("reliable_advancements", "textures/gui/tabs.png")
var KT_TAB_U = 56
var KT_TAB_V = 0
var KT_TAB_HOVER_DIFF = 32
var KT_TAB_TEX_W = 256
var KT_TAB_TEX_H = 256

// ARGB 颜色（超过 0x7FFFFFFF 的字面量必须用有符号 32 位表示）
var KT_COLOR_HIGHLIGHT = -55296 // 0xFFFFF2A0 暖黄色（提示开启时）
var KT_COLOR_WHITE = 0xFFFFFF

// 屏幕类名判定（Rhino 的 instanceof 对原始 Java Screen 对象不可用，
// 改用类名比较；兼容 Quark 背包界面，与 ender_chest_button/main.js 同款）
var KT_INV_SCREEN_CLASS = "net.minecraft.client.gui.screens.inventory.InventoryScreen"
var KT_BACKPACK_SCREEN_CLASS = "org.violetmoon.quark.addons.oddities.client.screen.BackpackInventoryScreen"

function ktIsInvScreen(screen) {
    if (screen == null) return false
    var name = screen.getClass().getName()
    return name == KT_INV_SCREEN_CLASS || name == KT_BACKPACK_SCREEN_CLASS
}

// keytips 显示开关（keytips/invScreen.js 读取同一标志位渲染引导提示）
if (global.isEnabled === undefined) {
    global.isEnabled = false
}

// 选项卡实例与挂载状态跟踪
var ktTabInstance = null
var ktTabScreen = null
var ktPosMode = ""

// 在 screen.children 中查找 RA 的进度选项卡按钮实例
function ktFindRaButton(screen) {
    try {
        var children = screen.children()
        var n = children.size()
        for (var i = 0; i < n; i++) {
            var c = children.get(i)
            if (c != null && c.getClass().getName() == KT_RA_BUTTON_CLASS) {
                return c
            }
        }
    } catch (e) {
        // children 访问失败则走退回方案
    }
    return null
}

// 计算本选项卡的 GUI 坐标：RA 选项卡左侧（相邻，同宽 28）
function ktGetTabPos(screen) {
    var ra = ktFindRaButton(screen)
    if (ra != null) {
        if (ktPosMode != "ra") {
            ktPosMode = "ra"
            console.log("[帮助选项卡] 位置模式: 跟随进度选项卡实例")
        }
        return { x: ra.getX() - KT_TAB_W, y: ra.getY() }
    }
    if (ktPosMode != "default") {
        ktPosMode = "default"
        console.log("[帮助选项卡] 位置模式: 默认偏移（未找到进度选项卡实例）")
    }
    return {
        x: screen.getGuiLeft() + KT_FALLBACK_IMAGE_W - KT_TAB_W * 2,
        y: screen.getGuiTop() - KT_FALLBACK_Y_OFFSET
    }
}

// 判断坐标是否在选项卡矩形范围内
function ktIsInTab(mx, my, x, y) {
    return mx >= x && mx < x + KT_TAB_W && my >= y && my < y + KT_TAB_H
}

// 版本标记：用于确认脚本已重载
console.log("[帮助选项卡] 脚本已加载 v1")

// =========================
// 选项卡挂载与管理（ClientEvents.tick 轮询，与 ender_chest_button 同款）
// 1. 进入背包界面（Screen 实例变化）时创建 ImageButton 并 addRenderableWidget 挂载
// 2. 每 tick 检测按钮是否仍在 screen.children 中，不在则重新挂载同一实例：
//    全屏/窗口切换会触发 Screen.resize → rebuildWidgets → clearWidgets + init，
//    把本按钮清掉，children 包含性检测覆盖一切组件清空场景
// 3. 每 tick 用 setX/setY 跟随 RA 选项卡位置（自适应其任何配置改动）
// =========================
ClientEvents.tick(event => {
    try {
        var mc = $Minecraft.getInstance()
        var screen = mc.screen
        if (!ktIsInvScreen(screen)) {
            // 离开背包界面：Screen 关闭时其组件一起销毁，只需重置跟踪状态
            ktTabInstance = null
            ktTabScreen = null
            ktPosMode = ""
            return
        }

        if (ktTabScreen != screen) {
            ktTabScreen = screen
            var pos = ktGetTabPos(screen)

            // 原生 ImageButton（public 构造函数直接 new）：
            // x, y, w, h, u, v, 悬停v位移, 贴图, 贴图宽, 贴图高, onPress 回调
            ktTabInstance = new $ImageButton(
                pos.x, pos.y, KT_TAB_W, KT_TAB_H,
                KT_TAB_U, KT_TAB_V, KT_TAB_HOVER_DIFF,
                KT_TAB_TEXTURE, KT_TAB_TEX_W, KT_TAB_TEX_H,
                function (btn) {
                    global.isEnabled = !global.isEnabled
                    console.log("[帮助选项卡] 按键提示: " + (global.isEnabled ? "开启" : "关闭"))
                }
            )
            screen.addRenderableWidget(ktTabInstance)
            console.log("[帮助选项卡] 选项卡已挂载: pos=(" + pos.x + ", " + pos.y + ")")
        } else if (ktTabInstance != null && screen.children().indexOf(ktTabInstance) < 0) {
            // 按钮被 resize/init 清空（如全屏切换），同一实例重新挂载
            screen.addRenderableWidget(ktTabInstance)
            console.log("[帮助选项卡] 检测到组件被清空（resize/init），已重新挂载")
        }

        // 每 tick 更新选项卡位置（跟随 RA 选项卡自适应位置）
        if (ktTabInstance != null) {
            var pos = ktGetTabPos(screen)
            ktTabInstance.setX(pos.x)
            ktTabInstance.setY(pos.y)
        }
    } catch (e) {
        console.log("[帮助选项卡] 选项卡管理出现问题：")
        console.log(e)
    }
})

// =========================
// 渲染叠加："?" 图标与悬停文字
// ImageButton 自带选项卡底图/悬停帧/点击音效，这里叠加居中的 "?" 文本
// 提示开启时 "?" 变为暖黄色，悬停时在选项卡左侧绘制文字提示
// =========================
RenderJSEvents.onScreenPostRender(event => {
    try {
        var screen = event.screen
        if (!ktIsInvScreen(screen)) return
        if (ktTabInstance == null) return

        var pos = ktGetTabPos(screen)

        // "?" 居中（字体高约 9，纵向偏移 12 与 RA 图标行对齐）
        var tw = 6
        try { tw = Client.font.width("?") } catch (e2) { }
        var color = global.isEnabled ? KT_COLOR_HIGHLIGHT : KT_COLOR_WHITE
        event.drawShadowString(Component.literal("?"), pos.x + Math.floor((KT_TAB_W - tw) / 2), pos.y + 12, color)

        // 悬停时在选项卡左侧绘制文字提示
        if (ktIsInTab(event.getMouseX(), event.getMouseY(), pos.x, pos.y)) {
            var label = "界面提示"
            var lw = 44
            try { lw = Client.font.width(label) } catch (e2) { }
            event.drawShadowString(Component.literal(label), pos.x - lw - 4, pos.y + 12, KT_COLOR_HIGHLIGHT)
        }
    } catch (e) {
        console.log("[帮助选项卡] 图标渲染出现问题：")
        console.log(e)
    }
})
