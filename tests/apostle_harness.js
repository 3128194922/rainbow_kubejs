// 同时供 Node 与整合包 Rhino 使用；只模拟外部世界接口，执行实际使徒脚本。
const global = {};
const apostleTestLogs = [];
const console = { log: message => apostleTestLogs.push(String(message)) };
const apostleTestBuilders = {};
const apostleTestAttributes = [];
const apostleTestAttributeEvents = [];
const StartupEvents = { registry: (name, callback) => callback({ create: id => {
    let builder = { callbacks: {}, controllers: {} };
    let setters = ['mobCategory', 'sized', 'clientTrackingRange', 'updateInterval', 'modelResource', 'textureResource', 'animationResource', 'renderScale', 'textureLocation'];
    setters.forEach(key => { builder[key] = () => builder; });
    ['eggItem', 'item', 'canHitEntity', 'tick', 'onHitEntity', 'onHitBlock'].forEach(key => {
        builder[key] = callback => { builder.callbacks[key] = callback; return builder; };
    });
    builder.addAnimationController = (name, ticks, callback) => {
        builder.controllers[name] = { callback: callback, ticks: ticks }; return builder;
    };
    builder.addTriggerableAnimationController = (name, ticks, animation, trigger, loop) => {
        builder.controllers[name] = { animation: animation, trigger: trigger, loop: loop, ticks: ticks }; return builder;
    };
    apostleTestBuilders[id] = builder;
    return builder;
} }) };
const EntityJSEvents = { createAttributes: callback => apostleTestAttributeEvents.push(callback) };
const ResourceLocation = function (id) { this.id = id; };
const ForgeRegistries = { ENTITY_TYPES: { getValue: id => id.id, getKey: type => type } };
const Player = function () {};
const Monster = function () {};
function apostleTestTag() {
    let values = {};
    return {
        getLong: key => values[key] || 0, putLong: (key, value) => { values[key] = value; },
        getDouble: key => values[key] || 0, putDouble: (key, value) => { values[key] = value; }
    };
}
function apostleTestAssert(value, message) {
    if (!value) throw new Error(message + '\nLogs: ' + apostleTestLogs.join('\n'));
}
