// priority: 0

/**
 * ==========================================
 * 🌡️ 温度获取工具脚本
 * 基于 Tide 和 Oreganized Mod 的源码分析实现
 * ==========================================
 */

/**
 * 获取 Tide Mod 的 Climate Gauge (气候计) 温度
 * 
 * 逻辑分析:
 * Tide 的 ClimateGaugeItem 通过 TideUtils.getTemperatureAt 获取原版生物群系气候温度 (Climate.Sampler)，
 * 然后通过 TideUtils.mcTempToRealTemp 将 MC 的抽象温度值转换为摄氏度。
 * 转换公式约为: 11 * (mcTemp - 0.23)^3 + 30 * mcTemp + 15
 * 
 * @param {Internal.ServerPlayer} player 玩家实体
 * @param {Internal.ServerLevel} level 服务器世界等级
 * @returns {string} 格式化后的温度字符串 (例如 "25.5")
 */
function getTideTemperature(player, level) {
    try {
        // 加载 TideUtils 类
        let TideUtils = Java.loadClass('com.li64.tide.util.TideUtils');
        
        // 获取玩家位置
        let pos = player.blockPosition();
        
        // 调用 TideUtils.getTemperatureAt(BlockPos pos, ServerLevel level)
        let temp = TideUtils.getTemperatureAt(pos, level);
        
        // 调用 TideUtils.mcTempToRealTemp(float mcTemp) 转换为摄氏度
        let celsius = TideUtils.mcTempToRealTemp(temp);
        
        // 保留一位小数 (参考 ClimateGaugeItem.getResult)
        let degrees = Math.round(celsius * 10) / 10.0;
        
        return degrees.toString();
    } catch (e) {
        console.error(`[TemperatureJS] 获取 Tide 温度失败: ${e}`);
        return "N/A";
    }
}

/**
 * 获取 Oreganized Mod 的 Thermometer (温度计) 热度等级
 * 
 * 逻辑分析:
 * Oreganized 的 ThermometerItem 使用 ambientMeasurement 方法计算环境热度等级 (0-8)。
 * 判定优先级:
 * 1. 脚下是岩浆标签方块 -> 8 (最高热)
 * 2. 脚下是火标签方块 -> 7
 * 3. 玩家着火 -> 5
 * 4. 玩家结冰 -> 0 (最冷)
 * 5. 否则根据生物群系基础温度计算: (Math.max(0, Math.min(2, temp) / 2) * 3) + weather
 *    (下雨时 weather=0, 否则 weather=1)
 * 
 * @param {Internal.Player} player 玩家实体
 * @returns {number} 热度等级 (0-8)
 */
function getOreganizedHeatLevel(player) {
    try {
        // 加载 ThermometerItem 类
        let ThermometerItem = Java.loadClass('galena.oreganized.content.item.ThermometerItem');
        
        // 调用静态方法 ambientMeasurement(Player player)
        return ThermometerItem.ambientMeasurement(player);
    } catch (e) {
        console.error(`[TemperatureJS] 获取 Oreganized 热度等级失败: ${e}`);
        return -1;
    }
}

// 将函数注册到全局对象，以便其他脚本调用
global.getTideTemperature = getTideTemperature;
global.getOreganizedHeatLevel = getOreganizedHeatLevel;

// 示例命令：/kubejs_temp_test
/*
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal("kubejs_temp_test")
            .executes(c => {
                let player = c.source.player;
                if (!player) return 0;

                let tideTemp = getTideTemperature(player, player.level);
                let oreHeat = getOreganizedHeatLevel(player);

                player.tell(Text.yellow(`Tide 温度 (摄氏度): ${tideTemp}°C`));
                player.tell(Text.red(`Oreganized 热度等级: ${oreHeat}`));

                return 1;
            })
    );
});
*/