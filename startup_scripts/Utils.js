// priority: 1000
// ==========================================
// 全局工具函数库
// Global Utility Functions
// ==========================================
// 包含各种通用的辅助函数，如材质获取、时间转换、按键映射等
// Contains various generic helper functions, such as material retrieval, time conversion, key mapping, etc.

/**
 * 返回 Minecraft 1.19.4 中 MaterialJS 支持的材质
 * @param {string} materialName - 材质名称
 * @returns {string} 对应的材质值
 */
function getMaterialJS(materialName) {
    let Materials = Object.freeze({
        GRASS: "grass",
        SPORE_BLOSSOM: "spore_blossom",
        DRIPSTONE: "dripstone",
        SLIME: "slime",
        BERRY_BUSH: "berry_bush",
        ICE: "ice",
        GILDED_BLACKSTONE: "gilded_blackstone",
        SMALL_AMETHYST_BUD: "small_amethyst_bud",
        AMETHYST_CLUSTER: "amethyst_cluster",
        MUD: "mud",
        AMETHYST: "amethyst",
        DRAGON_EGG: "dragon_egg",
        PACKED_MUD: "packed_mud",
        CROP: "crop",
        ANVIL: "anvil",
        DIRT: "dirt",
        NETHER_SPROUTS: "nether_sprouts",
        POWDER_SNOW: "powder_snow",
        AIR: "air",
        POINTED_DRIPSTONE: "pointed_dripstone",
        MUDDY_MANGROVE_ROOTS: "muddy_mangrove_roots",
        LAVA: "lava",
        CHAIN: "chain",
        SCULK_SENSOR: "sculk_sensor",
        LEAVES: "leaves",
        CLAY: "clay",
        NETHERRACK: "netherrack",
        MEDIUM_AMETHYST_BUD: "medium_amethyst_bud",
        BASALT: "basalt",
        PORTAL: "portal",
        MUD_BRICKS: "mud_bricks",
        SOUL_SOIL: "soul_soil",
        MANGROVE_ROOTS: "mangrove_roots",
        BIG_DRIPLEAF: "big_dripleaf",
        SCULK_CATALYST: "sculk_catalyst",
        BONE: "bone",
        VINE: "vine",
        WEB: "web",
        POLISHED_DEEPSLATE: "polished_deepslate",
        CORAL: "coral",
        WEEPING_VINES: "weeping_vines",
        PLANT: "plant",
        SCULK_SHRIEKER: "sculk_shrieker",
        LARGE_AMETHYST_BUD: "large_amethyst_bud",
        EXPLOSIVE: "explosive",
        COPPER: "copper",
        ROOTS: "roots",
        ANCIENT_DEBRIS: "ancient_debris",
        NETHERITE: "netherite",
        SNOW: "snow",
        MOSS_CARPET: "moss_carpet",
        SCULK_VEIN: "sculk_vein",
        STONE: "stone",
        SCULK: "sculk",
        GLOW_LICHEN: "glow_lichen",
        HANGING_ROOTS: "hanging_roots",
        CAKE: "cake",
        NETHER_WART: "nether_wart",
        FROGLIGHT: "froglight",
        HONEY: "honey",
        SMALL_DRIPLEAF: "small_dripleaf",
        KELP: "kelp",
        NETHER_ORE: "nether_ore",
        SAND: "sand",
        FROGSPAWN: "frogspawn",
        WATER: "water",
        GLASS: "glass",
        AZALEA_LEAVES: "azalea_leaves",
        TUFF: "tuff",
        METAL: "metal",
        ROOTED_DIRT: "rooted_dirt",
        SOUL_SAND: "soul_sand",
        MOSS: "moss",
        DEEPSLATE: "deepslate",
        CAVE_VINES: "cave_vines",
        TWISTING_VINES: "twisting_vines",
        DEEPSLATE_BRICKS: "deepslate_bricks",
        NYLIUM: "nylium",
        VEGETABLE: "vegetable",
        AZALEA: "azalea",
        SCAFFOLDING: "scaffolding",
        FLOWERING_AZALEA: "flowering_azalea",
        SPONGE: "sponge",
        LODESTONE: "lodestone",
        NETHER_BRICKS: "nether_bricks",
        LANTERN: "lantern",
        CANDLE: "candle",
        SEA_GRASS: "sea_grass",
        CALCITE: "calcite",
        WART_BLOCK: "wart_block",
        NETHER_GOLD_ORE: "nether_gold_ore",
        BAMBOO_SAPLING: "bamboo_sapling",
        WOOL: "wool",
        DEEPSLATE_TILES: "deepslate_tiles",
        BAMBOO: "bamboo",
        SHROOMLIGHT: "shroomlight",
        WOOD: "wood",
        HARD_CROP: "hard_crop"
    });

    // 查找对应的材质
    let materialKey = Object.keys(Materials).find(key =>
        Materials[key].toLowerCase() === materialName.toLowerCase()
    );

    if (materialKey) {
        return Materials[materialKey];
    } else {
        throw new Error(`Material '${materialName}' is not supported in MaterialJS for Minecraft 1.19.4`);
    }
}

/**
* 输出所有生物受到伤害的伤害类型
*/

function DamageSorce() {
    //输出伤害类型
    ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {

        let source = event.source.getType();
        let entity = event.entity.getType()
        if (entity == "powerful_dummy:test_dummy")
            console.log("伤害类型：");
        console.log(source);
        console.log("实体ID：");
        console.log(entity);
    })
}

const Tiers = Java.loadClass("net.minecraft.world.item.Tiers")

/**
 * 根据材质名称返回对应的挖掘等级
 * @param {string} tier - 材质名称（全大写，如 "DIAMOND"）
 * @returns {number} 对应的挖掘等级
 */
function JSTier(tier) {
    switch (tier) {
        case "DIAMOND":
            return Tiers.DIAMOND;
        case "GOLD":
            return Tiers.GOLD;
        case "IRON":
            return Tiers.IRON;
        case "NETHERITE":
            return Tiers.NETHERITE;
        case "STONE":
            return Tiers.STONE;
        case "WOOD":
            return Tiers.WOOD;
        default:
            throw new Error(`未知的材质类型: ${tier}`);
    }
}

/**
 * 根据中文工具类型或品质返回对应的 Minecraft 标签
 * @param {string} input 中文输入（如"剑"、"石"、"钻石"等）
 * @returns {string|null} 对应的 Minecraft 标签，若无匹配则返回 null
 */
function getMinecraftToolTag(input) {
    // 工具类型映射
    let toolTypeMap = {
        "剑": "minecraft:mineable/sword",
        "镐": "minecraft:mineable/pickaxe",
        "斧": "minecraft:mineable/axe",
        "锹": "minecraft:mineable/shovel",
        "锄": "minecraft:mineable/hoe"
    };

    // 工具品质映射
    let toolTierMap = {
        "木": "minecraft:needs_wooden_tool",
        "石": "minecraft:needs_stone_tool",
        "铁": "minecraft:needs_iron_tool",
        "金": "minecraft:needs_golden_tool",
        "钻石": "minecraft:needs_diamond_tool",
        "下界合金": "forge:needs_netherite_tool"
    };

    // 优先检查工具类型
    if (toolTypeMap[input]) {
        return toolTypeMap[input];
    }

    // 然后检查工具品质
    if (toolTierMap[input]) {
        return toolTierMap[input];
    }

    // 无匹配时返回 null
    return null;
}


/**
 * 将秒转化为游戏内的tick
 * @param {Number} input 单位 秒
 * @returns {Number}
 */
function SecoundToTick(input) {
    return input * 20;
}

/**
 * 物品数字和变量数字的转变
 * @param {String} Item
 * @returns {String | Number} 
 */
function ItemToNumberF(Item) {
    let ItemToNumber = {
        'zero': 0,
        'one': 1,
        'two': 2,
        'three': 3,
        'four': 4,
        'five': 5,
        'six': 6,
        'seven': 7,
        'eight': 8,
        'nine': 9,
        'plus': '+',
        'minus': '-',
        'multiply': '*',
        'divide': '/',
        'missingno': "§knull"
    }

    return ItemToNumber[Item]
}

/**
 * 获取GLFW标准按键值
 * @param {string} keyName - GLFW_KEY_开头的按键名称（不区分大小写）
 * @returns {number|null} 返回对应的键值，未找到返回null
 */
function getGlfwKeyValue(keyName) {
    // 移除可能的前缀并转为大写
    let normalizedKeyName = keyName.replace(/^GLFW_KEY_/i, '').toUpperCase();

    // GLFW键值映射表
    let keyMap = {
        // 基本键 (32-162)
        'SPACE': 32,
        'APOSTROPHE': 39,
        'COMMA': 44,
        'MINUS': 45,
        'PERIOD': 46,
        'SLASH': 47,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52,
        '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
        'SEMICOLON': 59,
        'EQUAL': 61,
        'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69,
        'F': 70, 'G': 71, 'H': 72, 'I': 73, 'J': 74,
        'K': 75, 'L': 76, 'M': 77, 'N': 78, 'O': 79,
        'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84,
        'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90,
        'LEFT_BRACKET': 91,
        'BACKSLASH': 92,
        'RIGHT_BRACKET': 93,
        'GRAVE_ACCENT': 94,
        'WORLD_1': 161,
        'WORLD_2': 162,

        // 功能键 (256-348)
        'ESCAPE': 256,
        'ENTER': 257,
        'TAB': 258,
        'BACKSPACE': 259,
        'INSERT': 260,
        'DELETE': 261,
        'RIGHT': 262,
        'LEFT': 263,
        'DOWN': 264,
        'UP': 265,
        'PAGE_UP': 266,
        'PAGE_DOWN': 267,
        'HOME': 268,
        'END': 269,
        'CAPS_LOCK': 280,
        'SCROLL_LOCK': 281,
        'NUM_LOCK': 282,
        'PRINT_SCREEN': 283,
        'PAUSE': 284,
        'F1': 290, 'F2': 291, 'F3': 292, 'F4': 293, 'F5': 294,
        'F6': 295, 'F7': 296, 'F8': 297, 'F9': 298, 'F10': 299,
        'F11': 300, 'F12': 301, 'F13': 302, 'F14': 303, 'F15': 304,
        'F16': 305, 'F17': 306, 'F18': 307, 'F19': 308, 'F20': 309,
        'F21': 310, 'F22': 311, 'F23': 312, 'F24': 313, 'F25': 314,
        'KP_0': 320, 'KP_1': 321, 'KP_2': 322, 'KP_3': 323, 'KP_4': 324,
        'KP_5': 325, 'KP_6': 326, 'KP_7': 327, 'KP_8': 328, 'KP_9': 329,
        'KP_DECIMAL': 330,
        'KP_DIVIDE': 331,
        'KP_MULTIPLY': 332,
        'KP_SUBTRACT': 333,
        'KP_ADD': 334,
        'KP_ENTER': 335,
        'KP_EQUAL': 336,
        'LEFT_SHIFT': 340,
        'LEFT_CONTROL': 342,
        'LEFT_ALT': 343,
        'LEFT_SUPER': 344,
        'RIGHT_SHIFT': 345,
        'RIGHT_CONTROL': 346,
        'RIGHT_SUPER': 347,
        'MENU': 348
    };

    return keyMap[normalizedKeyName] !== undefined ? keyMap[normalizedKeyName] : null;
}

/**
 * 根据概率返回 true 或 false
 * @param {number} probability - 概率值（0 ≤ probability ≤ 1）
 * @returns {boolean} 
 */
function randomBool(probability) {
    return Math.random() < probability;
}


/**
* 监听饰品栏添加效果
*/

/*
function hasCurios(entity, stack) {
    return CuriosApi.getCuriosHelper().findEquippedCurio(stack, entity).isPresent()
}*/

/**
* 在实体饰品栏中寻找饰品
* 遍历所有饰品栏槽位和其中的物品
* @param {Internal.Item} stack 饰品
* @param {Internal.LivingEntity_} entity 实体
*/
function hasCurios(player, id) {
    // 检查玩家对象是否为空
    if (player == null) return false;
    // 获取饰品库存
    let curios = player.curiosInventory;
    if (curios == null) return false;

    // 遍历所有饰品槽位
    for (let slot of curios.curios.values()) {
        // 遍历槽位中的所有物品
        for (let stack of slot.getStacks().getAllItems()) {
            // 检查物品ID是否匹配
            if (stack.getId().toString() === id) {
                return true;
            }
        }
    }
    return false;
}

// 定义 UUID 工具
let UUID = Java.loadClass("java.util.UUID")

/**
 * @param {string} str UUID 字符串
 * @returns {java.util.UUID}
 */
function toUUID(str) {
    return UUID.fromString(str)
}

let $SlotAttribute = Java.loadClass('top.theillusivec4.curios.api.SlotAttribute')

/**
 * @param {string} str ID
 * @returns {$SlotAttribute}
 */
function getSlotAttribute(str) {
    return $SlotAttribute.getOrCreate(str)
}

/**
 * 在实体饰品栏中寻找指定ID饰品并返回物品对象
 * @param {Internal.ServerPlayer} player - 玩家对象
 * @param {string} id - 物品ID（如 "minecraft:diamond"）
 * @returns {Internal.ItemStack|null} 找到的饰品物品对象，未找到返回 null
 */
function getCuriosItem(player, id) {
    if (player == null) return null;
    let curios = player.curiosInventory;
    if (curios == null) return null;

    for (let slot of curios.curios.values()) {
        for (let stack of slot.getStacks().getAllItems()) {
            if (stack.getId().toString() === id) {
                return stack;
            }
        }
    }
    return null;
}

// 通用的敌对判断函数
function isEnemy(player, entity) {
    if (!entity || !entity.isLiving() || !entity.isAlive()) return false;

    // 跳过自己
    if (entity == player) return false;

    // 跳过同队伍
    if (player.team && entity.team && player.team == entity.team) return false;

    // 跳过玩家的召唤物主人
    if (player.owner && entity.id == player.owner.id) return false;

    // 跳过同一主人召唤物（KubeJS persistentData 方式）
    if (entity.persistentData.OwnerName && entity.persistentData.OwnerName == player.getUuid().toString()) {
        return false;
    }

    // 跳过原版驯服实体的主人
    if (entity.owner && entity.owner.id == player.id) return false;

    return true; // 其余情况都是敌对目标
}

/**
 * 🔹 获取所有已注册快捷键信息
 * @returns {Array} 包含每个按键信息的对象数组
 */
global.getAllKeyMappings = () => {
  let keys = [];
  $KeyMapping.ALL.values().toArray().forEach(k => {
    try {
      keys.push({
        id: k.getName(), // 内部名称，如 key.attack
        name: k.getTranslatedKeyMessage().getString(), // 显示名称，如 "攻击"
        key: k.getKey().getDisplayName().getString(), // 当前绑定的键，如 "鼠标左键"
        category: k.getCategory() // 所属分类，如 "key.categories.movement"
      });
    } catch (e) {
      console.error("获取按键信息失败:", e);
    }
  });
  return keys;
};

/**
 * 🔹 获取指定内部名称的快捷键信息
 * @param {string} keyId - 按键ID，如 "key.attack" 或 "key.jump"
 * @returns {Object|null} 快捷键信息对象或 null
 */
global.getKeyMappingById = (keyId) => {
    // 获得 {String → KeyMapping} 的 Map
    const map = $KeyMapping.getAllKeyMappings();
    if (!map) return null;
  
    // 遍历 entrySet()，找到 keyId 对应项
    let iter = map.entrySet().iterator();
  
    while (iter.hasNext()) {
      let entry = iter.next();
      let id = entry.getKey();             // 例如 "key.attack"
      let km = entry.getValue();           // KeyMapping 实例
      let category = km.getCategory();     // 分类ID，例如 "key.categories.movement"

      if (id === keyId) {
        return {
          id: id,
          name: km.getTranslatedKeyMessage().getString(),  // 显示名称
          key: km.getKey().getDisplayName().getString(),   // 按键名称，如 "Mouse 1"
          category: km.getCategory(),                      // 分类ID
        };
      }
    }
  
    return null;
  };
  

/**
 * 🔹 按 Mod ID 模糊获取该 Mod 注册的所有快捷键
 * @param {string} modid - Mod ID 关键字，如 "create"、"minecraft"
 * @returns {Array} 该 Mod 的快捷键信息
 */
global.getKeysByMod = (modid) => {
  let result = [];
  $KeyMapping.ALL.values().toArray().forEach(k => {
    if (k.getName().toLowerCase().includes(modid.toLowerCase())) {
      result.push({
        id: k.getName(),
        name: k.getTranslatedKeyMessage().getString(),
        key: k.getKey().getDisplayName().getString(),
        category: k.getCategory()
      });
    }
  });
  return result;
};
DamageSorce()