const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const tablesPath = path.resolve(__dirname, '..', 'startup_scripts', 'ForgeEvents', 'tables.js');
const tablesCode = fs.readFileSync(tablesPath, 'utf8');
const tablesSandbox = {};
tablesSandbox.global = tablesSandbox;
vm.runInNewContext(tablesCode + '\nthis.__tables = { expired: FORGE_EFFECT_EXPIRED_CODES, added: FORGE_EFFECT_ADDED_CODES, removed: FORGE_EFFECT_REMOVED_CODES, transmute: FORGE_VOID_TRANSMUTE_RECIPES, weapons: FORGE_ATTACK_WEAPON_CODES, curios: FORGE_ATTACK_CURIO_CODES };', tablesSandbox, { filename: tablesPath });

test('effect tables map fixed IDs to handlers without branch scanning', () => {
    assert.equal(tablesSandbox.__tables.expired['effect.rainbow.off_work_time'], 1);
    assert.equal(tablesSandbox.__tables.expired['effect.rainbow.void'], 2);
    assert.equal(tablesSandbox.__tables.expired['effect.rainbow.short_buff'], 3);
    assert.equal(tablesSandbox.__tables.added['effect.rainbow.void'], 1);
    assert.equal(tablesSandbox.__tables.removed['effect.species.bloodlust'], 2);
});

test('void transmute recipes are defined once and look up by input ID', () => {
    assert.equal(tablesSandbox.__tables.transmute['rainbow:raw_voidore'], 'createutilities:void_steel_ingot');
    assert.equal(tablesSandbox.__tables.transmute['minecraft:dragon_breath'], 'rainbow:ender_air');
});

test('attack item tables map weapon and curio IDs to stable handler codes', () => {
    assert.equal(tablesSandbox.__tables.weapons['rainbow:terasword'], 1);
    assert.equal(tablesSandbox.__tables.weapons['rainbow:baseball_power'], 2);
    assert.equal(tablesSandbox.__tables.weapons['rainbow:duel'], 3);
    assert.equal(tablesSandbox.__tables.curios['rainbow:ender_glove'], 1);
    assert.equal(tablesSandbox.__tables.curios['rainbow:wandering_gummy_pack'], 5);
});
