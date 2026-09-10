// priority: 1000
// ==========================================
// 🎯 CBC 炮击标定 —— 客户端渲染
// ==========================================
// 信标球标记实体（rainbow:cannon_target_marker）billboard 渲染：
// 与原版烈焰弹 ThrownItemRenderer 同款做法——模型旋转矩阵对齐相机朝向（含俯仰），
// 使 geo 平板模型贴图从任何角度观看都是正面（始终面朝玩家）。
// 由 startup_scripts/Registry/Registry_entity.js 的 .render(context) 回调调用，
// 依赖 client_scripts/CONST.js 中的 Minecraft 与 Axis 类。

/**
 * 信标球标记实体 billboard 渲染回调（仅客户端执行）
 * @param {ContextUtils.NLRenderContext} context EntityJS 渲染上下文（poseStack/entityYaw 等）
 */
global.cannonTargetMarkerBillboard = function (context) {
    try {
        let mc = Minecraft.getInstance()
        // 1. 模型旋转对齐相机朝向（四元数，含俯仰角）——贴图平面垂直于视线
        context.poseStack.mulPose(mc.gameRenderer.getMainCamera().rotation())
        // 2. 补偿实体自身 yaw：GeckoLib 随后会叠加 R_y(180°-yaw) 旋转，
        //    提前乘 R_y(yaw) 抵消后净旋转 = 相机朝向 × Y轴180°，与烈焰弹渲染矩阵一致
        context.poseStack.mulPose(Axis.YP.rotationDegrees(context.entityYaw))
    } catch (e) {
        console.log('[CannonTarget] 信标球billboard渲染异常: ' + e)
    }
}
