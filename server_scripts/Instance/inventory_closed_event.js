// priority: 90
// ==========================================
// 🏰 副本实例与悬赏系统脚本
// ==========================================

// 配置文件
const MaxRange = 10000
const MinRange = 1000

// 副本怪物波次配置
const dungeonMobs = {
    rainbow1: {
        1: [{ type: 'minecraft:zombie', count: 3 ,nbt:''}, { type: 'minecraft:zombie', count: 2,nbt:''}],
        2: [{ type: 'minecraft:zombie', count: 4,nbt:''}, { type: 'minecraft:zombie', count: 6,nbt:''}],
        3: [{ type: 'minecraft:zombie', count: 15,nbt:''}]
    },
    rainbow2: {
        1: [{ type: 'monsterexpansion:skrythe', count: 1 ,nbt:''}]
    },
    rainbow3: {
        1: [{ type: 'monsterexpansion:rhyza', count: 1 ,nbt:''}]
    },
    rainbow4: {
        1: [{ type: 'monsterexpansion:leivekilth', count: 1 ,nbt:''}]
    },
    rainbow5: {
        1: [{ type: 'monsterexpansion:rakoth', count: 1 ,nbt:''}]
    },
}

// 副本基础配置
const dungeonConfig = {
    rainbow1: {
        time: 2,// 波次时间限制或者波次检测间隔 单位是秒
        totalWaves: 3,
    },
    rainbow2: {
        time: 2,
        totalWaves: 1,
    },
    rainbow3: {
        time: 2,
        totalWaves: 1,
    },
    rainbow4: {
        time: 2,
        totalWaves: 1,
    },
    rainbow5: {
        time: 2,
        totalWaves: 1,
    },
}

/**
 * 悬赏领取系统：为悬赏任务生成随机副本坐标
 * @param {Internal.ServerPlayer} player 玩家
 */
function BountyItemEvent(player) {
    let inventory = player.inventory;
    let x = null, y = null, z = null;

    for (let i = 0; i < inventory.getContainerSize(); i++) {
        let item = inventory.getItem(i);
        if (item.isEmpty()) continue;
        if (item.id != "bountiful:bounty") continue;

        let nbt = item.nbt;
        if (!nbt) continue;

        let bountyDataRaw = nbt.get("bountiful:bounty_data");
        if (!bountyDataRaw) continue;

        let bountyDataStr = bountyDataRaw.toString();
        if (bountyDataStr.startsWith("'") && bountyDataStr.endsWith("'")) {
            bountyDataStr = bountyDataStr.slice(1, -1);
        }

        let bountyData = JSON.parse(bountyDataStr);
        let objectives = bountyData.objectives || [];

        // 如果已经绑定了实例坐标则跳过
        if (nbt.contains("instance")) continue;

        for (let obj of objectives) {
            let content = obj.content || "";
            // 匹配特定任务类型 (instance_passX)
            let match = content.match(/instance_pass(\d+)/); // 匹配 instance_passX
            if (match) {
                // 提取副本ID
                let passId = parseInt(match[1], 10);

                // 创建一个新的 instance 节点，随机生成坐标
                let instance = {};

                const distance = MinRange + Math.random() * (MaxRange - MinRange);
                const PI = 3.141592653589793;
                const angle = Math.random() * PI * 2;

                x = Math.round(player.x + Math.cos(angle) * distance);
                y = player.y;
                z = Math.round(player.z + Math.sin(angle) * distance);

                instance.type = "instance";
                instance.x = x;
                instance.y = y;
                instance.z = z;
                instance.id = passId; // 写入 id

                nbt.put("instance", instance);
                break;
            }
        }
    }

    if (z !== null) {
        player.tell(`§b[悬赏系统] §a已生成对应的地图路标点:X: ${x}, Y: ~, Z: ${z}`);
    }
}

/**
 * 启动副本逻辑
 * @param {Internal.ItemClickedEventJS} event 
 */
function BossEvent(event) {
    let level = event.getLevel();
    let player = event.getPlayer();
    let item = event.getItem();
    let nbt = item.nbt;
    let instance = nbt.get("instance");

    // 1. 解析所有副本目标ID
    let dungeonIds = [];
    
    // 尝试从 bounty_data 解析所有目标
    let bountyDataRaw = nbt.get("bountiful:bounty_data");
    if (bountyDataRaw) {
         let bountyDataStr = bountyDataRaw.toString();
         if (bountyDataStr.startsWith("'") && bountyDataStr.endsWith("'")) {
             bountyDataStr = bountyDataStr.slice(1, -1);
         }
         try {
             let bountyData = JSON.parse(bountyDataStr);
             let objectives = bountyData.objectives || [];
             for (let obj of objectives) {
                 let content = obj.content || "";
                 let match = content.match(/instance_pass(\d+)/);
                 if (match) {
                     dungeonIds.push(parseInt(match[1], 10));
                 }
             }
         } catch (e) {
             console.error("Error parsing bounty data in BossEvent: " + e);
         }
    }
    
    // 如果解析失败或为空，回退到 instance.id (旧逻辑兼容)
    if (dungeonIds.length === 0 && instance.contains("id")) {
        dungeonIds.push(instance.getInt("id"));
    }
    
    if (dungeonIds.length === 0) {
        player.tell("§c[副本系统] 未找到有效的副本目标！");
        return;
    }

    player.tell(`§6[副本系统] §f准备启动 ${dungeonIds.length} 个悬赏任务...`);

    // 2. 顺序执行副本
    let currentDungeonIndex = 0;

    function runNextDungeon() {
        if (currentDungeonIndex >= dungeonIds.length) {
            player.tell("§a[副本系统] 所有悬赏波次已全部完成！");
            return;
        }

        let id = dungeonIds[currentDungeonIndex];
        let dungeonId = `rainbow${id}`;
        let config = dungeonConfig[dungeonId];

        if (!config) {
            player.tell(`§c[副本系统] 副本配置缺失: ${dungeonId}`);
            currentDungeonIndex++;
            runNextDungeon();
            return;
        }

        let totalWaves = config.totalWaves;
        let WavesTime = config.time;

        player.tell(Text.of("§6[副本系统] §f副本 ").append(Text.translate('item.rainbow.instance_pass' + id)).append(" 开始！共 " + totalWaves + " 波！"));

        let currentWave = 1;
        let aliveMobs = []; // 当前波的怪物引用

        // 生成波次怪物
        function spawnWave(wave) {
            let mobs = dungeonMobs[dungeonId][wave];
            if (!mobs) {
                 player.tell(`§c[副本系统] 缺少第 ${wave} 波怪物配置，跳过。`);
                 return;
            }

            player.tell(Text.of("§e[副本系统] §f").append(Text.translate('item.rainbow.instance_pass' + id)).append(" - 第 " + wave + " 波怪物来袭！"));

            aliveMobs = []; // 重置活跃怪物列表

            for (let group of mobs) {
                for (let i = 0; i < group.count; i++) {
                    let entity = level.createEntity(group.type);
                    // 稍微分散一点生成
                    let dx = (Math.random() - 0.5) * 10;
                    let dz = (Math.random() - 0.5) * 10;
                    entity.setPos(player.x + dx, player.y, player.z + dz);

                    // 标记归属副本与波次
                    entity.persistentData.dungeonWave = wave;
                    if(group.nbt) entity.setNbt(group.nbt);
                    entity.spawn();
                    aliveMobs.push(entity);
                }
            }
        }

        // 检查当前波是否完成 (所有怪物被击杀)
        function checkWaveComplete(wave) {
            Utils.server.scheduleInTicks(20 * WavesTime, () => {
                // 过滤掉已死亡的实体
                aliveMobs = aliveMobs.filter(e => e && e.isAlive());

                if (aliveMobs.length === 0) {
                    player.tell(Text.of("§a[副本系统] ").append(Text.translate('item.rainbow.instance_pass' + id)).append(" - 第 " + wave + " 波完成！"));
                    
                    if (wave < totalWaves) {
                        spawnWave(wave + 1);
                        checkWaveComplete(wave + 1);
                    } else {
                        // 当前副本完成
                        player.tell(Text.of("§a[副本系统] 副本 ").append(Text.translate('item.rainbow.instance_pass' + id)).append(" 完成！"));
                        player.give(`rainbow:instance_pass${id}`);
                        
                        // 稍微延迟一下进入下一个副本，体验更好
                        Utils.server.scheduleInTicks(40, () => {
                            currentDungeonIndex++;
                            runNextDungeon();
                        });
                    }
                } else {
                    checkWaveComplete(wave); // 继续等待
                }
            });
        }

        // 启动第一波
        spawnWave(currentWave);
        checkWaveComplete(currentWave);
    }

    // 开始执行第一个副本
    runNextDungeon();
}


// 副本启动：右键悬赏物品
ItemEvents.rightClicked(event => {
    let item = event.getItem();
    let hand = event.getHand();
    let player = event.getPlayer();

    if (item.id != "bountiful:bounty") return;
    if (hand.toString() != "MAIN_HAND") return;

    let nbt = item.nbt;
    if (!nbt) return;

    let instance = nbt.get("instance");
    if (!instance || instance.type != "instance") {
        player.tell("§c[副本系统] 这个悬赏没有生成坐标！");
        return;
    }

    let x = instance.x;
    let z = instance.z;

    let dx = player.x - x;
    let dz = player.z - z;

    // 计算平面距离（忽略Y）
    let dist = Math.sqrt(dx * dx + dz * dz);

    // 只有在距离目标点 50 格内才能启动副本
    if (dist <= 50) {
        player.tell(`§a[副本系统] 即将启动`);
        BossEvent(event);
    } else {
        player.tell(`§c[副本系统] 你不在副本范围内！ 距离: ${dist.toFixed(1)} 格`);
        //player.server.runCommandSilent(`/give @p filled_map{map:1, Decorations:[{id:"marker", type:26b, x:${x}, z:${z}, rot:180.0f}], display:{Name:'{"text":"藏宝图"}'}}`)
    }
});
