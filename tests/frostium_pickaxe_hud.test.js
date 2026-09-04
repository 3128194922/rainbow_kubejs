const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.resolve(__dirname, '..', 'client_scripts', 'rainbow', 'frostium_pickaxe', 'main.js');
const script = fs.readFileSync(scriptPath, 'utf8');

function loadHudScript() {
    let handler = null;
    let sandbox = {
        ClientEvents: {
            tick: callback => {
                handler = callback;
            }
        },
        console: console
    };
    vm.runInNewContext(script, sandbox, { filename: scriptPath });
    return { handler: handler };
}

test('frostium pickaxe HUD displays the current mode above the hotbar', () => {
    let loaded = loadHudScript();
    let paints = [];
    let tag = {
        contains: () => true,
        getInt: () => 5
    };
    let player = {
        getItemInHand: () => ({ id: 'rainbow:frostium_pickaxe', nbt: tag }),
        paint: value => {
            paints.push(value);
        }
    };

    loaded.handler({ player: player });

    assert.equal(paints.length, 1);
    assert.equal(paints[0].frostium_mode_hud.text, '当前挖掘范围：5×5');
    assert.equal(paints[0].frostium_mode_hud.alignX, 'center');
    assert.equal(paints[0].frostium_mode_hud.alignY, 'bottom');
    assert.equal(paints[0].frostium_mode_hud.y, -32);
    assert.equal(paints[0].frostium_mode_hud.visible, true);
});

test('frostium pickaxe HUD hides when the player is not holding the pickaxe', () => {
    let loaded = loadHudScript();
    let paints = [];
    let player = {
        getItemInHand: () => ({ id: 'minecraft:diamond_pickaxe', nbt: null }),
        paint: value => {
            paints.push(value);
        }
    };

    loaded.handler({ player: player });

    assert.equal(paints.length, 1);
    assert.equal(paints[0].frostium_mode_hud.visible, false);
});
