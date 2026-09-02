// priority: 0
// ==========================================
// 物品栏界面引导提示
// Inventory Screen Tutorial Hints
// ==========================================
// 在物品栏界面绘制指向特定槽位（饰品、属性、时装）的引导线和文本
// Draws guide lines and text pointing to specific slots (Curios, Attributes, Fashion) in the inventory screen

// Color 统一由 client_scripts/CONST.js 提供。

function RGBA(r, g, b, a) {
  return new Color(r / 255, g / 255, b / 255, a / 100).getRGB()
}

// 屏幕判定：Rhino 的 instanceof 对原始 Java Screen 对象不可用
// （TypeError: Can't use 'instanceof' on a non-object），改用类名比较
// （与 ender_chest_button/main.js 相同模式；兼容 Quark 背包界面）
var HINT_INV_SCREEN_CLASS = "net.minecraft.client.gui.screens.inventory.InventoryScreen"
var HINT_BACKPACK_SCREEN_CLASS = "org.violetmoon.quark.addons.oddities.client.screen.BackpackInventoryScreen"

function isHintScreen(screen) {
  if (screen == null) return false
  var name = screen.getClass().getName()
  return name == HINT_INV_SCREEN_CLASS || name == HINT_BACKPACK_SCREEN_CLASS
}

// =========================
// 🔥 模块化提示管理器（方向 + 偏移 + 正确连接线 + 总开关）
// =========================
var TutorialHints = {
  list: [
    {
      id: "curios_slot",
      x: 25, y: 7, w: 16, h: 16,
      text: "饰品栏",
      color: [255, 2, 0, 100],
      dir: "left",
      offsetX: 0,
      offsetY: 0
    },
    {
      id: "attribute_slot",
      x: 60, y: 7, w: 16, h: 16,
      text: "属性栏",
      color: [2, 200, 255, 100],
      dir: "right",
      offsetX: 0,
      offsetY: 0
    },
    {
      id: "fashion_slot",
      x: 60, y: 62, w: 16, h: 16,
      text: "时装栏",
      color: [200, 90, 200, 100],
      dir: "left",
      offsetX: -100,
      offsetY: 0
    }
  ],

  renderHint: function(event, h) {
    event.poseStack.pushPose()
    event.poseStack.translate(event.screen.getGuiLeft(), event.screen.getGuiTop(), 0)

    var color = RGBA(h.color[0], h.color[1], h.color[2], h.color[3])

    // 高亮框
    event.guiGraphics.renderOutline(h.x, h.y, h.w, h.h, color)

    // 物品框中心
    var cx = h.x + h.w / 2
    var cy = h.y
    var lineY = cy - 10

    // 竖线
    event.vLine(event.poseStack, cx, cy, lineY, color)

    // 文本尺寸
    var tw = Client.font.width(h.text)

    // 文本基准
    var tx = (h.dir === "left") ? (cx - tw) : cx
    var ty = lineY - 10

    // 偏移
    tx += h.offsetX || 0
    ty += h.offsetY || 0

    // 绘制文本
    event.drawString(h.text, tx, ty, color)

    // 横线（竖线 -> 文本中点）
    var textCenterX = tx + tw / 2
    event.hLine(Math.min(cx, textCenterX), Math.max(cx, textCenterX), lineY, color)

    event.poseStack.popPose()
  },

  render: function(event) {
    if (!global.isEnabled) return  // ⭐ 全局开关判断（由 keytips/tab_button.js 切换）
    if (!isHintScreen(event.screen)) return

    var GSW = event.screen.width
    var GSH = event.screen.height

    // 半透明遮罩
    event.poseStack.translate(0, 0, -1)
    event.fill(0, 0, GSW, GSH, RGBA(0, 0, 0, 40))
    event.poseStack.translate(0, 0, 1)

    for (var i = 0; i < this.list.length; i++) {
      this.renderHint(event, this.list[i])
    }
  }
}

// 注册渲染
RenderJSEvents.onScreenPostRender(event => {
  try {
    TutorialHints.render(event)
  } catch (e) {
    console.log("[界面引导提示] 渲染出现问题：")
    console.log(e)
  }
})
