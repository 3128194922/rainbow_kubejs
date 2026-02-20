// priority: 0
// ==========================================
// 弓箭蓄力进度条渲染
// Bow Charge Progress Bar Rendering
// ==========================================
// 在屏幕中央下方渲染弓箭蓄力进度条
// Renders a bow charge progress bar at the bottom center of the screen
let bowProgress = 0;

// 接收服务端发送的弓箭蓄力进度
NetworkEvents.dataReceived("bow_progress", event => {
    bowProgress = event.data.progress || 0;
});

// 颜色插值工具函数
function lerpColor(color1, color2, t) {
    let r1 = (color1 >> 16) & 0xFF;
    let g1 = (color1 >> 8) & 0xFF;
    let b1 = color1 & 0xFF;

    let r2 = (color2 >> 16) & 0xFF;
    let g2 = (color2 >> 8) & 0xFF;
    let b2 = color2 & 0xFF;

    let r = Math.floor(r1 + (r2 - r1) * t);
    let g = Math.floor(g1 + (g2 - g1) * t);
    let b = Math.floor(b1 + (b2 - b1) * t);

    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

ClientEvents.tick(event => {
    let player = event.player;
    if (!player) return;

    let window = $Minecraft.getInstance().getWindow();
    let width = window.getGuiScaledWidth();
    let height = window.getGuiScaledHeight();

    let paints = {};

    // 进度条大小
    let barW = 25;
    let barH = 2;

    // 居中 + 靠下
    let barX = width / 2 - barW / 2;
    let barY = height / 2 + 20; // 相对于准心下方 20px

    // 背景（灰色）
    paints["bow_bar_bg"] = {
        type: "rectangle",
        x: barX,
        y: barY,
        w: barW,
        h: barH,
        color: "#555555",
        draw: "always",
        alignX: "left",
        alignY: "top",
        visible: bowProgress > 0
    };

    // 计算渐变颜色
    let color;
    if (bowProgress <= 50) {
        // 红 (#FF0000) → 黄 (#FFFF00)
        color = lerpColor(0xFF0000, 0xFFFF00, bowProgress / 50);
    } else {
        // 黄 (#FFFF00) → 绿 (#00FF00)
        color = lerpColor(0xFFFF00, 0x00FF00, (bowProgress - 50) / 50);
    }

    // 前景（渐变色）
    paints["bow_bar_fg"] = {
        type: "rectangle",
        x: barX,
        y: barY,
        w: (barW * bowProgress) / 100,
        h: barH,
        color: color,
        draw: "always",
        alignX: "left",
        alignY: "top",
        visible: bowProgress > 0
    };

    player.paint(paints);
});