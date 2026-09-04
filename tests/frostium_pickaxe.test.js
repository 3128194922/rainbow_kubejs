const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const logicPath = path.resolve(
    __dirname,
    '..',
    'startup_scripts',
    'rainbow',
    'frostium_pickaxe',
    'logic.js'
);
const sandbox = { console: console };
const logicCode = fs.existsSync(logicPath) ? fs.readFileSync(logicPath, 'utf8') : '';
vm.runInNewContext(logicCode, sandbox, { filename: logicPath });

test('frostium pickaxe mode cycles through 1, 3, 5 and 7', () => {
    assert.equal(sandbox.getNextFrostiumMode(1), 3);
    assert.equal(sandbox.getNextFrostiumMode(3), 5);
    assert.equal(sandbox.getNextFrostiumMode(5), 7);
    assert.equal(sandbox.getNextFrostiumMode(7), 1);
    assert.equal(sandbox.getNextFrostiumMode(99), 1);
});

test('frostium pickaxe chooses the plane perpendicular to the view direction', () => {
    assert.equal(sandbox.getFrostiumPlane({ x: 0.1, y: -0.9, z: 0.2 }), 'y');
    assert.equal(sandbox.getFrostiumPlane({ x: 0.9, y: 0.1, z: 0.2 }), 'x');
    assert.equal(sandbox.getFrostiumPlane({ x: 0.1, y: 0.2, z: -0.9 }), 'z');
});

test('frostium pickaxe maps the clicked block face to its mining plane', () => {
    assert.equal(sandbox.getFrostiumPlaneFromFace('up'), 'y');
    assert.equal(sandbox.getFrostiumPlaneFromFace('down'), 'y');
    assert.equal(sandbox.getFrostiumPlaneFromFace('east'), 'x');
    assert.equal(sandbox.getFrostiumPlaneFromFace('west'), 'x');
    assert.equal(sandbox.getFrostiumPlaneFromFace('north'), 'z');
    assert.equal(sandbox.getFrostiumPlaneFromFace('south'), 'z');
    assert.equal(sandbox.getFrostiumPlaneFromFace('unknown'), null);
});

test('frostium pickaxe creates a square plane with the requested size', () => {
    let oneTargets = sandbox.getFrostiumTargets({ x: 10, y: 20, z: 30 }, 1, 'y');
    let targets = sandbox.getFrostiumTargets({ x: 10, y: 20, z: 30 }, 5, 'y');

    assert.equal(oneTargets.length, 1);
    assert.equal(targets.length, 25);
    assert.equal(targets.some(target => target.x === 10 && target.y === 20 && target.z === 30), true);
    assert.equal(targets.every(target => target.y === 20), true);
    assert.equal(Math.min(...targets.map(target => target.x)), 8);
    assert.equal(Math.max(...targets.map(target => target.x)), 12);
    assert.equal(Math.min(...targets.map(target => target.z)), 28);
    assert.equal(Math.max(...targets.map(target => target.z)), 32);
});

test('frostium pickaxe supports vertical mining planes', () => {
    let xPlane = sandbox.getFrostiumTargets({ x: 10, y: 20, z: 30 }, 3, 'x');
    let zPlane = sandbox.getFrostiumTargets({ x: 10, y: 20, z: 30 }, 7, 'z');

    assert.equal(xPlane.length, 9);
    assert.equal(xPlane.every(target => target.x === 10), true);
    assert.equal(zPlane.length, 49);
    assert.equal(zPlane.every(target => target.z === 30), true);
});

test('frostium pickaxe right click switches the stored mode', () => {
    let handlers = {};
    let statusMessages = [];
    let tag = {
        contains: () => true,
        getInt: key => tag[key] || 3,
        putInt: (key, value) => {
            tag[key] = value;
        }
    };
    let item = {
        id: 'rainbow:frostium_pickaxe',
        nbt: tag,
        getOrCreateTag: () => tag,
    };
    let player = {
        level: { isClientSide: () => false },
        isShiftKeyDown: () => true,
        tell: () => {},
        setStatusMessage: message => {
            statusMessages.push(message);
        }
    };
    let event = {
        getEntity: () => player,
        getItemStack: () => item,
        getHand: () => 'MAIN_HAND',
        setCancellationResult: () => {},
        setCanceled: () => {}
    };
    let eventSandbox = {
        console: console,
        ForgeEvents: {
            onEvent: (name, handler) => {
                handlers[name] = handler;
            }
        },
        InteractionHand: { MAIN_HAND: 'MAIN_HAND' },
        InteractionResult: { SUCCESS: 'SUCCESS' },
        BlockPos: function (x, y, z) {
            this.getY = () => y;
            this.getX = () => x;
            this.getZ = () => z;
        }
    };
    vm.runInNewContext(logicCode + '\n' + fs.readFileSync(path.resolve(__dirname, '..', 'startup_scripts', 'rainbow', 'frostium_pickaxe', 'main.js'), 'utf8'), eventSandbox);

    handlers['net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickItem'](event);
    handlers['net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickItem'](event);
    assert.equal(tag.FrostiumMiningMode, 7);
    assert.equal(statusMessages.length, 2);
    assert.equal(statusMessages[1], '§b始冰镐挖掘范围：§f7×7');
});

test('frostium pickaxe break handler destroys every block in the selected plane', () => {
    let handlers = {};
    let destroyed = [];
    let eventSandbox = {
        console: console,
        ForgeEvents: {
            onEvent: (name, handler) => {
                handlers[name] = handler;
            }
        },
        InteractionHand: { MAIN_HAND: 'MAIN_HAND' },
        InteractionResult: { SUCCESS: 'SUCCESS' },
        BlockPos: function (x, y, z) {
            this.getY = () => y;
            this.getX = () => x;
            this.getZ = () => z;
        }
    };
    vm.runInNewContext(logicCode + '\n' + fs.readFileSync(path.resolve(__dirname, '..', 'startup_scripts', 'rainbow', 'frostium_pickaxe', 'main.js'), 'utf8'), eventSandbox);

    let tag = { contains: () => true, getInt: () => 7 };
    let item = { id: 'rainbow:frostium_pickaxe', nbt: tag };
    let persistentData = {
        active: false,
        getBoolean: () => persistentData.active,
        putBoolean: (key, value) => {
            persistentData.active = value;
        }
    };
    let player = {
        level: {},
        persistentData: persistentData,
        isPlayer: () => true,
        getItemInHand: () => item,
        rayTrace: () => ({ facing: { getName: () => 'east' } }),
        getViewVector: () => ({ x: () => 0, y: () => 1, z: () => 0 }),
        gameMode: { destroyBlock: position => destroyed.push(position) }
    };
    let level = {
        isClientSide: () => false,
        getMinBuildHeight: () => -64,
        getMaxBuildHeight: () => 320,
        getBlock: () => ({ hasTag: () => true }),
        getBlockState: () => ({ getDestroySpeed: () => 1 })
    };
    let event = {
        getLevel: () => level,
        getPlayer: () => player,
        getPos: () => ({ getX: () => 10, getY: () => 20, getZ: () => 30 }),
        isCanceled: () => false,
        setCanceled: value => {
            event.canceled = value;
        }
    };

    handlers['net.minecraftforge.event.level.BlockEvent$BreakEvent'](event);
    assert.equal(event.canceled, true);
    assert.equal(destroyed.length, 49);
    assert.equal(destroyed.every(position => position.getX() === 10), true);
    assert.equal(persistentData.active, false);
});

test('frostium pickaxe skips non-pickaxe-tagged and unbreakable blocks in the plane', () => {
    let handlers = {};
    let destroyed = [];
    let eventSandbox = {
        console: console,
        ForgeEvents: {
            onEvent: (name, handler) => {
                handlers[name] = handler;
            }
        },
        InteractionHand: { MAIN_HAND: 'MAIN_HAND' },
        InteractionResult: { SUCCESS: 'SUCCESS' },
        BlockPos: function (x, y, z) {
            this.getY = () => y;
            this.getX = () => x;
            this.getZ = () => z;
        }
    };
    vm.runInNewContext(logicCode + '\n' + fs.readFileSync(path.resolve(__dirname, '..', 'startup_scripts', 'rainbow', 'frostium_pickaxe', 'main.js'), 'utf8'), eventSandbox);

    let tag = { contains: () => true, getInt: () => 7 };
    let item = { id: 'rainbow:frostium_pickaxe', nbt: tag };
    let persistentData = {
        active: false,
        getBoolean: () => persistentData.active,
        putBoolean: (key, value) => {
            persistentData.active = value;
        }
    };
    let player = {
        level: {},
        persistentData: persistentData,
        isPlayer: () => true,
        getItemInHand: () => item,
        rayTrace: () => ({ facing: { getName: () => 'east' } }),
        getViewVector: () => ({ x: () => 0, y: () => 1, z: () => 0 }),
        gameMode: { destroyBlock: position => destroyed.push(position) }
    };
    let level = {
        isClientSide: () => false,
        getMinBuildHeight: () => -64,
        getMaxBuildHeight: () => 320,
        getBlock: position => ({
            hasTag: () => position.getZ() != 27
        }),
        getBlockState: position => ({
            getDestroySpeed: () => position.getZ() == 29 ? -1 : 1
        })
    };
    let event = {
        getLevel: () => level,
        getPlayer: () => player,
        getPos: () => ({ getX: () => 10, getY: () => 20, getZ: () => 30 }),
        isCanceled: () => false,
        setCanceled: value => {
            event.canceled = value;
        }
    };

    handlers['net.minecraftforge.event.level.BlockEvent$BreakEvent'](event);
    assert.equal(event.canceled, true);
    assert.equal(destroyed.length, 35);
    assert.equal(persistentData.active, false);
});

test('frostium pickaxe leaves a non-pickaxe-tagged center block to vanilla mining', () => {
    let handlers = {};
    let destroyed = [];
    let eventSandbox = {
        console: console,
        ForgeEvents: {
            onEvent: (name, handler) => {
                handlers[name] = handler;
            }
        },
        InteractionHand: { MAIN_HAND: 'MAIN_HAND' },
        InteractionResult: { SUCCESS: 'SUCCESS' },
        BlockPos: function (x, y, z) {
            this.getY = () => y;
            this.getX = () => x;
            this.getZ = () => z;
        }
    };
    vm.runInNewContext(logicCode + '\n' + fs.readFileSync(path.resolve(__dirname, '..', 'startup_scripts', 'rainbow', 'frostium_pickaxe', 'main.js'), 'utf8'), eventSandbox);

    let item = { id: 'rainbow:frostium_pickaxe', nbt: { contains: () => false } };
    let player = {
        level: {},
        persistentData: null,
        isPlayer: () => true,
        getItemInHand: () => item,
        rayTrace: () => ({ facing: { getName: () => 'up' } }),
        getViewVector: () => ({ x: () => 0, y: () => 1, z: () => 0 }),
        gameMode: { destroyBlock: position => destroyed.push(position) }
    };
    let level = {
        isClientSide: () => false,
        getMinBuildHeight: () => -64,
        getMaxBuildHeight: () => 320,
        getBlock: () => ({ hasTag: () => false }),
        getBlockState: () => ({ getDestroySpeed: () => 1 })
    };
    let event = {
        getLevel: () => level,
        getPlayer: () => player,
        getPos: () => ({ getX: () => 10, getY: () => 20, getZ: () => 30 }),
        isCanceled: () => false,
        setCanceled: value => {
            event.canceled = value;
        }
    };

    handlers['net.minecraftforge.event.level.BlockEvent$BreakEvent'](event);
    assert.equal(event.canceled, undefined);
    assert.equal(destroyed.length, 0);
});
