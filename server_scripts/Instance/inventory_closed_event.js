// priority: 90
//配置文件
const MaxRange = 10000
const MinRange = 1000
const dungeonMobs = {
    rainbow1: {
        1: [{ type: 'minecraft:zombie', count: 3 ,nbt:''}, { type: 'minecraft:zombie', count: 2,nbt:''}],
        2: [{ type: 'minecraft:zombie', count: 4,nbt:''}, { type: 'minecraft:zombie', count: 6,nbt:''}],
        3: [{ type: 'minecraft:zombie', count: 15,nbt:''}]
    }}
const dungeonConfig = {
    rainbow1: {
        time: 2,//波次时间限制或者波次检测间隔 单位是秒
        totalWaves: 3,
    }}
/**
 * 悬赏领取系统
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

        if (nbt.contains("instance")) continue;

        for (let obj of objectives) {
            let content = obj.content || "";
            let match = content.match(/instance_pass(\d+)/); // 匹配 instance_passX
            if (match) {
                // 提取 X 值
                let passId = parseInt(match[1], 10);

                // 创建一个新的 instance 节点
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

/*限定时间内击杀所有 怪物清理有bug
function BossEvent(event) {
    let level = event.getLevel();
    let player = event.getPlayer();
    let item = event.getItem();
    let instance = item.nbt.get("instance");

    let dungeonId = `rainbow${instance.getInt("id")}`;
    let config = dungeonConfig[dungeonId];
    if (!config) {
        player.tell("§c[副本系统] 无效的副本配置！");
        return;
    }

    let totalWaves = config.totalWaves;
    let waveTime = config.time; // 秒

    player.tell(`§6[副本系统] §f副本 ${dungeonId} 开始！共 ${totalWaves} 波！`);

    let currentWave = 1;
    let aliveMobs = [];

    function spawnWave(wave) {
        let mobs = dungeonMobs[dungeonId][wave];
        if (!mobs) return;

        player.tell(`§e[副本系统] §f第 ${wave} 波怪物来袭！（限时 ${waveTime} 秒）`);

        aliveMobs = [];

        for (let group of mobs) {
            for (let i = 0; i < group.count; i++) {
                let entity = level.createEntity(group.type);
                let dx = (Math.random() - 0.5) * 10;
                let dz = (Math.random() - 0.5) * 10;
                entity.setPos(player.x + dx, player.y, player.z + dz);
                entity.persistentData.dungeonId = dungeonId; // 标记所属副本
                entity.persistentData.dungeonWave = wave;
                entity.spawn();
                aliveMobs.push(entity);
            }
        }
    }

    // 清理副本怪物
    function clearDungeonMobs() {
        level.getEntities().forEach(e => {
            if (e.persistentData.dungeonId === dungeonId) {
                e.kill();
            }
        });
    }

    // 检查当前波是否在时限内完成
    function checkWaveComplete(wave, onSuccess, onFail) {
        let ticksPassed = 0;
        function loop() {
            Utils.server.scheduleInTicks(20, () => {
                ticksPassed += 20;
                aliveMobs = aliveMobs.filter(e => e && e.isAlive());

                if (aliveMobs.length === 0) {
                    player.tell(`§a[副本系统] 第 ${wave} 波完成！`);
                    onSuccess();
                } else if (ticksPassed >= waveTime * 20) {
                    player.tell(`§c[副本系统] 第 ${wave} 波未在 ${waveTime} 秒内完成，副本失败！`);
                    clearDungeonMobs(); // 失败时清理怪物
                    onFail();
                } else {
                    loop();
                }
            });
        }
        loop();
    }

    function scheduleNextWave(wave) {
        if (wave > totalWaves) {
            player.tell("§a[副本系统] 副本结束！恭喜完成所有波次！");
            player.give(`rainbow:instance_pass${instance.getInt("id")}`);
            return;
        }

        spawnWave(wave);

        checkWaveComplete(
            wave,
            () => { // 成功
                scheduleNextWave(wave + 1);
            },
            () => { // 失败
                player.tell("§4[副本系统] 副本挑战失败，奖励已取消！");
            }
        );
    }

    // 启动第一波
    scheduleNextWave(currentWave);
}*/

/**
 * 启动副本
 * @param {Internal.ItemClickedEventJS} event 
 */
function BossEvent(event) {
    let level = event.getLevel();
    let player = event.getPlayer();
    let item = event.getItem();
    let instance = item.nbt.get("instance");

    let dungeonId = `rainbow${instance.getInt("id")}`;
    let config = dungeonConfig[dungeonId];
    if (!config) {
        player.tell("§c[副本系统] 无效的副本配置！");
        return;
    }

    let totalWaves = config.totalWaves;
    let WavesTime = config.time;

    player.tell(`§6[副本系统] §f副本 ${dungeonId} 开始！共 ${totalWaves} 波！`);

    let currentWave = 1;
    let aliveMobs = []; // 当前波的怪物引用

    function spawnWave(wave) {
        let mobs = dungeonMobs[dungeonId][wave];
        if (!mobs) return;

        player.tell(`§e[副本系统] §f第 ${wave} 波怪物来袭！`);

        aliveMobs = []; // 重置活跃怪物列表

        for (let group of mobs) {
            for (let i = 0; i < group.count; i++) {
                let entity = level.createEntity(group.type);
                let dx = (Math.random() - 0.5) * 10;
                let dz = (Math.random() - 0.5) * 10;
                entity.setPos(player.x + dx, player.y, player.z + dz);

                // 标记归属副本与波次
                entity.persistentData.dungeonWave = wave;
                entity.setNbt(group.nbt)
                entity.spawn();
                aliveMobs.push(entity);
            }
        }
    }

    // 检查当前波是否完成
    function checkWaveComplete(wave, callback) {
        Utils.server.scheduleInTicks(20 * WavesTime, () => {
            aliveMobs = aliveMobs.filter(e => e && e.isAlive());

            if (aliveMobs.length === 0) {
                player.tell(`§a[副本系统] 第 ${wave} 波完成！`);
                callback(); // 进入下一波
            } else {
                checkWaveComplete(wave, callback); // 继续等待
            }
        });
    }

    // 调度下一波
    function scheduleNextWave(wave) {
        if (wave > totalWaves) {
            // 等待最后一波清理完
            checkWaveComplete(totalWaves, () => {
                player.tell("§a[副本系统] 副本结束！恭喜完成所有波次！");
                player.give(`rainbow:instance_pass${instance.getInt("id")}`);
            });
            return;
        }

        currentWave = wave;
        spawnWave(wave);

        // 怪物死光才进入下一波
        checkWaveComplete(wave, () => {
            scheduleNextWave(wave + 1);
        });
    }

    // 启动第一波
    spawnWave(currentWave);
    checkWaveComplete(currentWave, () => {
        scheduleNextWave(currentWave + 1);
    });
}


// 副本启动
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

    // 平面距离（忽略Y）
    let dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= 50) {
        player.tell(`§a[副本系统] 即将启动`);
        BossEvent(event);
    } else {
        player.tell(`§c[副本系统] 你不在副本范围内！ 距离: ${dist.toFixed(1)} 格`);
        //player.server.runCommandSilent(`/give @p filled_map{map:1, Decorations:[{id:"marker", type:26b, x:${x}, z:${z}, rot:180.0f}], display:{Name:'{"text":"藏宝图"}'}}`)
    }
});
