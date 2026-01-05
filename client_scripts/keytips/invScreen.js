// priority: 0
// ==========================================
// 物品栏界面引导提示
// Inventory Screen Tutorial Hints
// ==========================================
// 在物品栏界面绘制指向特定槽位（饰品、属性、时装）的引导线和文本
// Draws guide lines and text pointing to specific slots (Curios, Attributes, Fashion) in the inventory screen

let $ScreenEvent$Init$Post = Java.loadClass("net.minecraftforge.client.event.ScreenEvent$Init$Post")
let $Button = Java.loadClass("net.minecraft.client.gui.components.Button")
let $InventoryScreen = Java.loadClass("net.minecraft.client.gui.screens.inventory.InventoryScreen")
let $Color = Java.loadClass("java.awt.Color")

function RGBA(r, g, b, a) {
  return new $Color(r / 255, g / 255, b / 255, a / 100).getRGB()
}

// =========================
// 🔥 模块化提示管理器（方向 + 偏移 + 正确连接线 + 总开关）
// =========================
var TutorialHints = {

  enabled: true,  // ⭐ 全局开关，false 不渲染任何提示

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
    event.poseStack.translate(event.screen.guiLeft, event.screen.guiTop, 0)

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
    if (!this.enabled) return  // ⭐ 全局开关判断
    if (!(event.screen instanceof $InventoryScreen)) return

    var GSW = Client.window.guiScaledWidth
    var GSH = Client.window.guiScaledHeight

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
  TutorialHints.render(event)
})