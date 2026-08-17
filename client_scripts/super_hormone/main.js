// priority: 0
// ==========================================
// 超级激素 - 客户端：黄色视角边框渲染
// Super Hormone (Client) - yellow vignette overlay
// ==========================================
// 接收服务端 Skillwheel.js 中超级激素技能触发时推送的 duration（tick），
// 在屏幕四周叠加黄色渐变边框（与潜行黑边同构，颜色不同）。
//
// 兼容性：通过 global.superHormoneActive 标志位与 stealth_system 协作。
// 当超级激素激活时，stealth_system 会强制其黑边淡出，由本系统独占渲染；
// 超级激素结束后标志位清除，潜行黑边恢复正常。
// ==========================================

// 网络通道名，与服务端 Skillwheel.js 必须一致
const SUPER_HORMONE_SYNC_CHANNEL = "super_hormone_sync";

// 边缘黄色最大不透明度（0~255，180 ≈ 70%）
const SUPER_HORMONE_MAX_ALPHA = 180;

// 黄边厚度：占屏幕短边的比例（与潜行黑边一致，0.16 ≈ 16%）
const SUPER_HORMONE_EDGE_RATIO = 0.16;

// 黄边最小像素（适配小窗口 / 低分辨率）
const SUPER_HORMONE_EDGE_MIN = 24;

// 淡入 / 淡出速度（每 tick 向目标值靠拢的比例，0.15 ≈ 0.6s 完成过渡）
const SUPER_HORMONE_FADE_SPEED = 0.15;

// 黄色 RGB（金黄 255,224,0）
const SUPER_HORMONE_RGB = 0xFFE000;

// 局域变量
let superHormoneTargetAlpha = 0;   // 目标透明度（0~1）
let superHormoneAlpha = 0;          // 当前透明度（0~1）
let endTick = 0;                    // 效果结束的客户端 tick
let clientTickCounter = 0;          // 客户端 tick 计数器（用于到期判定）

// 初始化全局标志位（供 stealth_system 读取优先级）
if (global.superHormoneActive === undefined) {
    global.superHormoneActive = false;
}

// 接收服务端推送：收到时刷新 endTick 并启动淡入
NetworkEvents.dataReceived(SUPER_HORMONE_SYNC_CHANNEL, event => {
    let data = event.data;
    if (data === null || data === undefined) return;
    let duration = data.getInt("duration");
    if (!duration || duration <= 0) return;
    endTick = clientTickCounter + duration;
    superHormoneTargetAlpha = 1;
});

// 生成黄色 ARGB 颜色值（alpha 0~255，RGB 恒为金黄色）
function superHormoneArgColor(alpha) {
    return ((alpha & 0xFF) << 24) | SUPER_HORMONE_RGB;
}

// 每 tick：到期判定 + 平滑过渡 + 用 Painter 绘制四边渐变黄边
ClientEvents.tick(event => {
    let player = event.player;
    if (player === null || player === undefined) return;

    clientTickCounter++;

    try {
        // 到期检测：超过 endTick 后开始淡出
        if (clientTickCounter >= endTick) {
            superHormoneTargetAlpha = 0;
        }

        // 平滑过渡到目标状态（渐入 / 渐出）
        if (superHormoneAlpha < superHormoneTargetAlpha) {
            superHormoneAlpha = Math.min(superHormoneTargetAlpha, superHormoneAlpha + SUPER_HORMONE_FADE_SPEED);
        } else if (superHormoneAlpha > superHormoneTargetAlpha) {
            superHormoneAlpha = Math.max(superHormoneTargetAlpha, superHormoneAlpha - SUPER_HORMONE_FADE_SPEED);
        }

        // 更新全局标志位（alpha > 0.01 视为激活，供 stealth_system 判断优先级）
        global.superHormoneActive = superHormoneAlpha > 0.01;

        let mc = $Minecraft.getInstance();
        let window = mc.getWindow();
        let width = window.getGuiScaledWidth();
        let height = window.getGuiScaledHeight();

        // 黄边厚度
        let edgeSize = Math.max(SUPER_HORMONE_EDGE_MIN, Math.min(width, height) * SUPER_HORMONE_EDGE_RATIO);

        // 当前不透明度（0~255）
        let alphaNow = Math.round(SUPER_HORMONE_MAX_ALPHA * superHormoneAlpha);
        let edgeColor = superHormoneArgColor(alphaNow); // 边缘侧：黄色带透明度
        let clearColor = 0x00000000;                     // 内侧：完全透明

        // 四边渐变矩形：屏幕边缘为黄，向屏幕中心渐变为透明
        let paints = {
            "super_hormone_top": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: 0, y: 0, w: width, h: edgeSize,
                colorTL: edgeColor, colorTR: edgeColor, colorBL: clearColor, colorBR: clearColor
            },
            "super_hormone_bottom": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: 0, y: height - edgeSize, w: width, h: edgeSize,
                colorTL: clearColor, colorTR: clearColor, colorBL: edgeColor, colorBR: edgeColor
            },
            "super_hormone_left": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: 0, y: 0, w: edgeSize, h: height,
                colorTL: edgeColor, colorTR: clearColor, colorBL: edgeColor, colorBR: clearColor
            },
            "super_hormone_right": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: width - edgeSize, y: 0, w: edgeSize, h: height,
                colorTL: clearColor, colorTR: edgeColor, colorBL: clearColor, colorBR: edgeColor
            }
        };

        // 每 tick 重新绘制（alpha 为 0 时颜色全透明，不会残留旧画面）
        player.paint(paints);
    } catch (err) {
        console.log(`[super_hormone] 渲染黄色视角失败: ${err}`);
    }
});
