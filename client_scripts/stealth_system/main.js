// priority: 0
// ==========================================
// 潜行系统 - 客户端：潜行黑边视角渲染
// Stealth System (Client) - stealth vignette overlay
// ==========================================
// 根据服务端同步的 isStealth（纯 KubeJS 维护，未被索敌 = true）决定黑边。
// 此状态由 startup_scripts/stealth_system 监听 LivingChangeTargetEvent
// 即时置 false、由 server_scripts/stealth_system 每 20 tick 兜底扫描恢复 true，
// 并经 server_scripts/stealth_system 推送至此。
// 仅当 isStealth 为 true 且玩家【按住潜行键(Shift)】时才在屏幕四周叠加黑色
// 渐变黑边，模拟潜行视角；被怪物索敌发现或松开潜行键时黑边平滑淡出。
//
// 渲染方式：KubeJS Painter（player.paint）的 gradient 对象，参考 Dyeing 项目
// ScreenOverlayRenderer 的全屏覆盖思路（按 alpha 叠加在游戏画面之上）。
// ==========================================

// 全局常量
const STEALTH_SYNC_CHANNEL = "stealth_sync"; // 网络通道名，与服务端一致

// 边缘黑色最大不透明度（0~255，150 ≈ 59%）
const STEALTH_MAX_ALPHA = 150;

// 黑边厚度：占屏幕短边的比例（0.16 ≈ 16%）
const STEALTH_EDGE_RATIO = 0.16;

// 黑边最小像素（适配小窗口 / 低分辨率）
const STEALTH_EDGE_MIN = 24;

// 淡入 / 淡出速度（每 tick 向目标值靠拢的比例，0.15 ≈ 0.6s 完成过渡）
const STEALTH_FADE_SPEED = 0.15;

// 局域变量：当前渲染透明度与目标透明度（0 = 无黑边，1 = 完全黑边）
let stealthTargetAlpha = 0;
let stealthAlpha = 0;
let lastReceivedState = null;

// 接收服务端推送的隐匿状态（值变化时才记录并输出日志）
NetworkEvents.dataReceived(STEALTH_SYNC_CHANNEL, event => {
    let data = event.data;
    if (data === null || data === undefined) return;
    let state = data.isStealth ? 1 : 0;
    if (lastReceivedState !== state) {
        lastReceivedState = state;
        stealthTargetAlpha = state;
        console.log(`[stealth_system] 收到 isStealth=${data.isStealth}`);
    }
});

// 生成黑色 ARGB 颜色值（alpha 0~255，RGB 恒为 0）
function stealthArgColor(alpha) {
    return ((alpha & 0xFF) << 24) | 0x000000;
}

// 每 tick：平滑过渡 + 用 Painter 绘制四边渐变黑边
ClientEvents.tick(event => {
    let player = event.player;
    if (player === null || player === undefined) return;

    try {
        // 目标透明度：仅当 isStealth 为 true 且按住潜行键(Shift)时才显示黑边
        let effectiveTarget = (lastReceivedState === 1 && player.isShiftKeyDown()) ? 1 : 0;
        if (stealthTargetAlpha !== effectiveTarget) {
            stealthTargetAlpha = effectiveTarget;
        }

        // 平滑过渡到目标状态（渐入 / 渐出）
        if (stealthAlpha < stealthTargetAlpha) {
            stealthAlpha = Math.min(stealthTargetAlpha, stealthAlpha + STEALTH_FADE_SPEED);
        } else if (stealthAlpha > stealthTargetAlpha) {
            stealthAlpha = Math.max(stealthTargetAlpha, stealthAlpha - STEALTH_FADE_SPEED);
        }

        let mc = $Minecraft.getInstance();
        let window = mc.getWindow();
        let width = window.getGuiScaledWidth();
        let height = window.getGuiScaledHeight();

        // 黑边厚度
        let edgeSize = Math.max(STEALTH_EDGE_MIN, Math.min(width, height) * STEALTH_EDGE_RATIO);

        // 当前不透明度（0~255）
        let alphaNow = Math.round(STEALTH_MAX_ALPHA * stealthAlpha);
        let edgeColor = stealthArgColor(alphaNow); // 边缘侧：黑色带透明度
        let clearColor = 0x00000000;               // 内侧：完全透明

        // 四边渐变矩形：屏幕边缘为黑，向屏幕中心渐变为透明
        // top    : 上边不透明 -> 下方透明
        // bottom : 下边不透明 -> 上方透明
        // left   : 左边不透明 -> 右方透明
        // right  : 右边不透明 -> 左方透明
        let paints = {
            "stealth_top": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: 0, y: 0, w: width, h: edgeSize,
                colorTL: edgeColor, colorTR: edgeColor, colorBL: clearColor, colorBR: clearColor
            },
            "stealth_bottom": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: 0, y: height - edgeSize, w: width, h: edgeSize,
                colorTL: clearColor, colorTR: clearColor, colorBL: edgeColor, colorBR: edgeColor
            },
            "stealth_left": {
                type: "gradient",
                draw: "ingame",
                alignX: "start",
                alignY: "start",
                x: 0, y: 0, w: edgeSize, h: height,
                colorTL: edgeColor, colorTR: clearColor, colorBL: edgeColor, colorBR: clearColor
            },
            "stealth_right": {
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
        console.log(`[stealth_system] 渲染潜行视角失败: ${err}`);
    }
});