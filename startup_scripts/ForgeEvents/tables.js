// ForgeEvents 固定 ID 分发表：事件触发时直接按 ID 查表，避免逐项比较。

const FORGE_EFFECT_EXPIRED_CODES = {
    "effect.rainbow.off_work_time": 1,
    "effect.rainbow.void": 2,
    "effect.rainbow.short_buff": 3
};

const FORGE_EFFECT_ADDED_CODES = {
    "effect.rainbow.void": 1
};

const FORGE_HAZMAT_EFFECT_CODES = {
    "effect.minecraft.poison": true,
    "effect.alexscaves.irradiated": true,
    "effect.minecraft.wither": true
};

const FORGE_EFFECT_REMOVED_CODES = {
    "effect.rainbow.void": 1,
    "effect.species.bloodlust": 2
};

const FORGE_VOID_TRANSMUTE_RECIPES = {
    "rainbow:raw_voidore": "createutilities:void_steel_ingot",
    "minecraft:dragon_breath": "rainbow:ender_air"
};

const FORGE_ATTACK_WEAPON_CODES = {
    "rainbow:terasword": 1,
    "rainbow:baseball_power": 2,
    "rainbow:duel": 3
};

const FORGE_ATTACK_CURIO_CODES = {
    "rainbow:ender_glove": 1,
    "rainbow:living_gauntlet": 2,
    "rainbow:libra": 3,
    "rainbow:gold_glove": 4,
    "rainbow:wandering_gummy_pack": 5
};

// 根目录 startup 脚本通过 global 读取这些表，遵守项目跨目录调用规范。
global.FORGE_EFFECT_EXPIRED_CODES = FORGE_EFFECT_EXPIRED_CODES;
global.FORGE_EFFECT_ADDED_CODES = FORGE_EFFECT_ADDED_CODES;
global.FORGE_HAZMAT_EFFECT_CODES = FORGE_HAZMAT_EFFECT_CODES;
global.FORGE_EFFECT_REMOVED_CODES = FORGE_EFFECT_REMOVED_CODES;
global.FORGE_VOID_TRANSMUTE_RECIPES = FORGE_VOID_TRANSMUTE_RECIPES;
global.FORGE_ATTACK_WEAPON_CODES = FORGE_ATTACK_WEAPON_CODES;
global.FORGE_ATTACK_CURIO_CODES = FORGE_ATTACK_CURIO_CODES;
