const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const contextPath = path.resolve(__dirname, '..', 'startup_scripts', 'ForgeEvents', 'context.js');
const contextCode = fs.readFileSync(contextPath, 'utf8');
const sandbox = { console: console };
vm.runInNewContext(contextCode, sandbox, { filename: contextPath });

const createDamageContext = sandbox.createDamageContext;
const createAttackContext = sandbox.createAttackContext;
const getContextCurioStack = sandbox.getContextCurioStack;
const hasContextCurio = sandbox.hasContextCurio;
const isForgeDamageType = sandbox.isForgeDamageType;

test('createDamageContext caches normalized damage data', () => {
    let getTypeCalls = 0;
    let attacker = { isPlayer: () => true, isLiving: () => true };
    let victim = { isPlayer: () => false };
    let source = {
        actual: attacker,
        getType: () => {
            getTypeCalls++;
            return 'arrow';
        }
    };

    let context = createDamageContext({ entity: victim, source: source });

    assert.equal(context.damageType, 'arrow');
    assert.equal(context.victimIsPlayer, false);
    assert.equal(context.attackerIsPlayer, true);
    assert.equal(context.attackerIsLiving, true);
    assert.equal(context.isRangeDamage, true);
    assert.equal(context.isThrownDamage, false);
    assert.equal(context.isMagicDamage, false);
    assert.equal(context.isExplosionDamage, false);
    assert.equal(getTypeCalls, 1);
});

test('getContextCurioStack builds one index for repeated lookups in one event', () => {
    let stack = {
        isEmpty: () => false,
        getId: () => 'rainbow:the_wafer'
    };
    let scanCalls = 0;
    let player = {
        isPlayer: () => true,
        curiosInventory: {
            curios: {
                values: () => [{
                    getStacks: () => ({
                        getAllItems: () => {
                            scanCalls++;
                            return [stack];
                        }
                    })
                }]
            }
        }
    };
    let context = { victim: player };

    assert.equal(getContextCurioStack(context, 'victim', 'rainbow:the_wafer'), stack);
    assert.equal(getContextCurioStack(context, 'victim', 'rainbow:the_wafer'), stack);
    assert.equal(getContextCurioStack(context, 'victim', 'rainbow:chaos_core'), null);
    assert.equal(scanCalls, 1);
});

test('createAttackContext caches hand stacks for an attack event', () => {
    let mainCalls = 0;
    let offCalls = 0;
    let entity = {
        getItemInHand: hand => {
            if (hand === 'main_hand') mainCalls++;
            if (hand === 'off_hand') offCalls++;
            return { id: hand };
        }
    };
    let context = createAttackContext({
        getEntity: () => entity,
        getTarget: () => ({ id: 'target' })
    });

    assert.equal(context.attacker, entity);
    assert.equal(context.target.id, 'target');
    assert.equal(context.mainHand.id, 'main_hand');
    assert.equal(context.offHand.id, 'off_hand');
    assert.equal(mainCalls, 1);
    assert.equal(offCalls, 1);
});

test('hasContextCurio uses the event-local index', () => {
    let player = {
        isPlayer: () => true,
        curiosInventory: {
            curios: {
                values: () => [{
                    getStacks: () => ({
                        getAllItems: () => [{
                            isEmpty: () => false,
                            getId: () => 'rainbow:short_core'
                        }]
                    })
                }]
            }
        }
    };
    let context = { attacker: player };

    assert.equal(hasContextCurio(context, 'attacker', player, 'rainbow:short_core'), true);
    assert.equal(hasContextCurio(context, 'attacker', player, 'rainbow:missing'), false);
});

test('isForgeDamageType matches a group without scanning an array', () => {
    assert.equal(isForgeDamageType('inFire', 'fire'), true);
    assert.equal(isForgeDamageType('arrow', 'range'), true);
    assert.equal(isForgeDamageType('magic', 'range'), false);
    assert.equal(isForgeDamageType('unknown', 'range'), false);
});
