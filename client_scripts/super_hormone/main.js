// priority: 0
// ==========================================
// 超级激素 - 客户端：仅把持续时间转交给 StealthAPI
// Super Hormone (Client) - bridge to StealthAPI
// ==========================================
// [2026-11-25] 黄边渲染已迁移到 StealthAPI（com.stealthapi.client.StealthOverlay）。
// 本脚本只负责接收服务端 Skillwheel.js 推送的 duration，并调用 mod 接口；
// 黄边颜色、透明度、厚度、淡入淡出、与潜行黑边互斥全部由 StealthAPI 处理。
// ==========================================

// 网络通道名，与服务端 Skillwheel.js 必须一致
const SUPER_HORMONE_SYNC_CHANNEL = "super_hormone_sync";

// StealthAPI 缺失时只记录一次，避免每 tick 刷日志
let stealthApiMissingLogged = false;

NetworkEvents.dataReceived(SUPER_HORMONE_SYNC_CHANNEL, event => {
    let data = event.data;
    if (data === null || data === undefined) return;

    let duration = data.getInt("duration");
    if (!duration || duration <= 0) return;

    if (StealthOverlay === null) {
        if (!stealthApiMissingLogged) {
            stealthApiMissingLogged = true;
            console.log("[super_hormone] 未找到 StealthAPI，黄边无法渲染");
        }
        return;
    }

    try {
        // 只传持续时间；mod 内部负责淡入、到期淡出和与黑边的互斥
        StealthOverlay.showSuperHormone(duration);
    } catch (err) {
        console.log(`[super_hormone] 调用 StealthAPI.showSuperHormone 失败: ${err}`);
    }
});

/*
// ==========================================
// [OLD 2026-11-25] 以下为迁移前的 KubeJS 黄边实现，仅作回滚参考。
// 注意：StealthAPI 已改为 showSuperHormone(duration) 接口，旧代码不能直接取消注释恢复。
// ==========================================
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
let superHormoneTargetAlpha = 0;
let superHormoneAlpha = 0;
let endTick = 0;
let clientTickCounter = 0;

// 初始化全局标志位（供 stealth_system 读取优先级）
if (global.superHormoneActive === undefined) {
    global.superHormoneActive = false;
}

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

        let mc = Minecraft.getInstance();
        let window = mc.getWindow();
        let width = window.getGuiScaledWidth();
        let height = window.getGuiScaledHeight();

        // 黄边厚度
        let edgeSize = Math.max(SUPER_HORMONE_EDGE_MIN, Math.min(width, height) * SUPER_HORMONE_EDGE_RATIO);

        // 当前不透明度（0~255）
        let alphaNow = Math.round(SUPER_HORMONE_MAX_ALPHA * superHormoneAlpha);
        let edgeColor = superHormoneArgColor(alphaNow);
        let clearColor = 0x00000000;

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
*/
