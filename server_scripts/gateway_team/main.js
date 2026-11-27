// priority: 0
// ============================================================
// 传送门编队：GatewaysToEternity 生成的怪物自动加入 MineTeam 隐藏队伍
// 事件来源：GatewaysJS 的 GatewaysEvents.waveEntitySpawned（服务端事件）
// 队伍是隐藏队伍：玩家不可加入、不出现在选队界面，支持十六进制颜色；
// 同队怪物之间按 MineTeam 规则互不攻击（目标选择与友伤均按队伍名比较）。
// ============================================================

const GATEWAY_TEAM_ID = 'gateway'
const GATEWAY_TEAM_COLOR = '#8B5CF6'
const GATEWAY_TEAM_NAME = '传送门军团'

// 隐藏队伍保存在当前世界的记分板上；切换/重载世界后需要重新创建。
let gatewayTeamReady = false
// 缺少 MineTeam 时只提示一次，避免每个波次刷屏。
let gatewayTeamDisabled = false

// 创建隐藏队伍（幂等）。返回是否可用，失败只记日志，不阻断传送门生成。
function gatewayTeamEnsure(server) {
    if (gatewayTeamReady) return true
    if (gatewayTeamDisabled) return false
    if (server == null) return false
    if (MineTeamAPI == null) {
        gatewayTeamDisabled = true
        console.log('[传送门编队] 未找到 MineTeamAPI，跳过编队')
        return false
    }
    try {
        MineTeamAPI.createHiddenTeam(server, GATEWAY_TEAM_ID, GATEWAY_TEAM_COLOR, GATEWAY_TEAM_NAME)
        gatewayTeamReady = true
        return true
    } catch (error) {
        console.log('[传送门编队] 创建隐藏队伍失败: ' + error)
        return false
    }
}

// 把传送门生成的怪物写入隐藏队伍。返回是否编队成功。
function gatewayTeamJoin(server, entity) {
    if (entity == null) return false
    if (!gatewayTeamEnsure(server)) return false
    try {
        if (MineTeamAPI.assignHiddenTeam(entity, GATEWAY_TEAM_ID)) return true
        console.log('[传送门编队] 怪物未能加入队伍: ' + entity)
    } catch (error) {
        console.log('[传送门编队] 怪物编队异常: ' + error)
    }
    return false
}

// 事件在实体加入世界之前触发；此时实体已持有服务端 level，可直接写能力数据与记分板。
// 实体随后加入世界时，MineTeam 的 EntityJoinLevelEvent 会从记分板读回同一队伍，不会清成白队。
GatewaysEvents.waveEntitySpawned(event => {
    try {
        let server = null
        if (event.entity != null) server = event.entity.serverLevel
        gatewayTeamJoin(server, event.waveEntity)
    } catch (error) {
        console.log('[传送门编队] 处理传送门生成事件失败: ' + error)
    }
})

// 服务端就绪时先建好队伍，避免首个波次生成时再创建。
ServerEvents.loaded(event => {
    gatewayTeamReady = false
    gatewayTeamEnsure(event.server)
})

// 世界卸载后记分板失效，下次加载时重新创建。
ServerEvents.unloaded(event => {
    gatewayTeamReady = false
})
