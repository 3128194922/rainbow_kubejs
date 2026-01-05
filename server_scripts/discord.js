// priority: 1000
// ==========================================
// 杂项方块交互机制
// Miscellaneous Block Interaction Mechanics
// ==========================================
// 注意：此文件名为 'discord.js' 但内容与Discord无关
// Note: Filename is 'discord.js' but content is unrelated to Discord
//
// 包含功能：
// 1. 发射器发射末影珍珠骑乘逻辑
// 2. 机械动力扳手调整原版红石方块方向
// 3. Shift+右键调整音符盒音调
// 4. 随机方块放置工具 (已注释)
// 5. 虚空矿石(rainbow:void_ore) 连锁传送机制
// Included Features:
// 1. Dispenser ender pearl riding logic
// 2. Create Wrench adjusting vanilla redstone block direction
// 3. Shift+RightClick adjusting Note Block pitch
// 4. Random block placement tool (Commented out)
// 5. Void Ore (rainbow:void_ore) teleportation mechanism

//EntityEvents.spawned('ender_pearl', e => e.entity.owner.startRiding(e.entity))

let DispenserBlock = Java.loadClass("net.minecraft.world.level.block.DispenserBlock");
const facingMap = {
    'east': [1, 0, 0],
    'west': [-1, 0, 0],
    'south': [0, 0, 1],
    'north': [0, 0, -1],
    'up': [0, 1, 0],
    'down': [0, -1, 0]
};

// 注册发射器行为：发射末影珍珠时生成骑乘的伪装方块
DispenserBlock.registerBehavior(Item.of("minecraft:ender_pearl").item, (block, item) => {
    const { level } = block;
    const { x, y, z } = block.pos;
    const oldDispenser = level.getBlock([x, y, z]);
    const facing = oldDispenser.properties.get('facing');
    const facingData = facingMap[facing];

    item.count--;

    const ender_pearl = level.createEntity('ender_pearl');
    ender_pearl.setPosition(x + 0.5 + facingData[0] * 0.5, y + 0.5 + facingData[1] * 0.5, z + 0.5 + facingData[2] * 0.5);
    ender_pearl.setMotion(facingData[0], facingData[1], facingData[2]);
    ender_pearl.spawn();

    const newDispenser = level.createEntity('falling_block');
    newDispenser.mergeNbt({
        BlockState: {
            Name: 'minecraft:dispenser',
            Properties: { facing: facing }
        },
        TileEntityData: { Items: oldDispenser.entityData.Items }
    });
    newDispenser.copyPosition(ender_pearl);
    newDispenser.startRiding(ender_pearl);
    newDispenser.spawn();

    oldDispenser.setEntityData({ Items: '' });
    oldDispenser.set('air');
})
    // 扳手调整原版红石方块
    ; (() => {
        /** @type {{string:Internal.Direction_}} */
        const direction = {
            up: Direction.UP,
            down: Direction.DOWN,
            north: Direction.NORTH,
            south: Direction.SOUTH,
            east: Direction.EAST,
            west: Direction.WEST,
        }

        const whitelist = {
            'minecraft:piston': true,
            'minecraft:sticky_piston': true,
            'minecraft:repeater': true,
            'minecraft:comparator': true,
            'minecraft:dispenser': true,
            'minecraft:dropper': true,
            'minecraft:hopper': true,
            'minecraft:observer': true,
        }

        const forbiddenStates = {
            'minecraft:hopper': 'up',
        }

        BlockEvents.rightClicked((e) => {
            const { item, hand, facing, block, player } = e
            if (hand !== 'main_hand' || player.crouching) return
            if (item.id !== 'create:wrench') return
            if (block.id.startsWith('create:')) return
            if (!whitelist[block.id]) return
            if (block.properties === undefined) return
            const blockFacing = block.properties.facing
            if (blockFacing === undefined) return
            /** @type {Internal.Direction_} */
            const blockFacingDirection = direction[blockFacing]
            let newDirection
            /**
             * facing.axis is one of [x, y, z] without regard for the positive or
             * negative direction. We need to take into account the negative or positive
             * directive or this will rotate blocks the opposite way if we are facing
             * the opposite side of the block.
             */
            if (facing.axisDirection.step > 0) {
                newDirection = blockFacingDirection.getClockWise(facing.axis)
            } else {
                newDirection = blockFacingDirection.getCounterClockWise(facing.axis)
            }
            const newProperties = Object.assign({}, block.properties, {
                facing: newDirection,
            })
            if (forbiddenStates[block.id] === newDirection) return
            block.set(block.id, newProperties)
            player.swing()
            if (newDirection !== blockFacingDirection) {
                player.playNotifySound('create:wrench_rotate', 'players', 2, 1)
            }
            e.cancel()
        })
    })()

// shift右键调整音符盒音调
BlockEvents.rightClicked('minecraft:note_block', (e) => {
    const { player, block, level } = e
    if (!player.isCrouching()) return

    // Set the block note to the previous note
    const bp = block.properties
    const newNote = (parseInt(bp.getOrDefault('note', 0), 10) + 24) % 25
    const instrument = bp.getOrDefault('instrument', 'harp')
    block.set(block.getId(), {
        instrument: new String(instrument),
        note: new String(newNote),
        powered: new String(bp.getOrDefault('powered', false)),
    })

    // Helper to play sounds to players nearby
    const playSound = (sound, volume, pitch) => {
        block.getPlayersInRadius(5).forEach((p) => {
            Utils.server.runCommandSilent(
                `playsound ${sound} block ${p.displayName.string} ${block.x} ` +
                `${block.y} ${block.z} ${volume} ${pitch}`
            )
        })
    }

    // Display the note particle like how the normal right click event
    const soundEvent = `block.note_block.${instrument}`
    const pitch = Math.pow(2, (newNote - 12) / 12)
    playSound(soundEvent, 2, pitch)
    const particlePos = block.pos.getCenter().add(0, 0.7, 0)
    level.spawnParticles(
        'minecraft:note',
        true, // overrideLimiter
        particlePos.x(), // x
        particlePos.y(), // y
        particlePos.z(), // z
        newNote / 24, // vx, used as pitch when count is 0
        0, // vy, unused
        0, // vz, unused
        0, // count, must be 0 for pitch argument to work
        1 // speed, must be 1 for pitch argument to work
    )

    // Cancel the default sound event
    e.cancel()
})
//随机方块工具https://discord.com/channels/303440391124942858/1414062742368813067
/*BlockEvents.rightClicked(event =>{
    if (event.hand != "MAIN_HAND") return;
    if (event.player.mainHandItem.id != "minecraft:stick") return;

    if (event.block.up.id != "minecraft:air") return;

    const hotbarBlocks = []

    for (let i=0; i < 10; i++){
        if (event.player.getInventory().getStackInSlot(i).isBlock()){
            hotbarBlocks.push(i)
        }
    }

    const randomSlot = hotbarBlocks[Math.floor(Math.random() * hotbarBlocks.length)]
    const itemStack = event.player.getInventory().getStackInSlot(randomSlot)
    const {x, y, z} = event.block.up

    event.block.up.set(itemStack.id)
    event.server.runCommandSilent(`playsound minecraft:block.decorated_pot.place block @a ${x} ${y} ${z} 4 1`)
    event.server.runCommandSilent(`particle minecraft:block ${itemStack.id} ${x} ${y+0.3} ${z} 0.3 0.3 0.3 0.1 60`)

    if (!event.player.isCreative()) itemStack.count--
})*/

// 传送矿机制：挖掘虚空矿石时有几率传送到附近的同类矿石
// Teleport Ore: Chance to teleport to nearby void ore when mined
// https://discord.com/channels/303440391124942858/1411918182222139523
BlockEvents.broken(event => {
    if (event.player.isCreative()) return // Annoying creative script
    
    let block = event.block
    if (block.id !== "rainbow:void_ore") return // Wrong block

    let chance = 0.8
    if (Math.random() >= chance) return // Chance to not teleport

    let dx = 3, dy = 2, dz = 3
    let candidates = []
    let level = event.level
    // 搜索附近的可替换矿石
    for (let x = block.x - dx; x <= block.x + dx; x++) {
        for (let y = block.y - dy; y <= block.y + dy; y++) {
            for (let z = block.z - dz; z <= block.z + dz; z++) {
                if (x !== block.x || y !== block.y || z !== block.z) {
                    let target = level.getBlock(x, y, z)
                    if (target.hasTag('rainbow:void_ore_replaceable')) {
                        candidates.push(target)
                    }
                }
            }
        }
    }

    if (candidates.length == 0) return // Nowhere to escape

    // 随机选择一个目标位置进行传送
    let newBlock = candidates[Math.floor(Math.random() * candidates.length)]
    newBlock.set(block.id)
    block.set("minecraft:air")

    // 播放音效和粒子
    level.playSound(null, block.pos, 'entity.enderman.teleport', "blocks")
    level.spawnParticles('minecraft:portal', true, block.x + 0.5, block.y + 0.5, block.z + 0.5, 0.5, 0.5, 0.5, 50, 0.05)
    level.spawnParticles('minecraft:portal', true, newBlock.x + 0.5, newBlock.y + 0.5, newBlock.z + 0.5, 0.5, 0.5, 0.5, 50, 0.05)

    event.cancel()
})