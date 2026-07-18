// priority: 15000
// ==========================================
// 版本检测配置
// 在此添加需要检测的模组及期望版本号
// ==========================================

/**
 * 模组版本检测列表
 * @type {Array<{modId: string, expectedVersion: string, warningText: string}>}
 * - modId: 模组 ID（如 "entityjs"）
 * - expectedVersion: 期望版本号（如 "0.6.6"）
 * - warningText: 版本不匹配时对玩家的警告文本
 */
global._VERSION_CHECKS = [
    {
        modId: 'entityjs',
        expectedVersion: '0.6.6-1.20.1',
        warningText: '依赖 EntityJS 版本不匹配: 当前 §e{current}§r，期望 §a{expected}§r。精英怪系统将无法正常工作！'
    }
]
