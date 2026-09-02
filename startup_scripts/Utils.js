// priority: 1000
// ==========================================
// 全局工具函数库
// Global Utility Functions
// ==========================================
// 包含各种通用的辅助函数，如材质获取、时间转换、按键映射等
// Contains various generic helper functions, such as material retrieval, time conversion, key mapping, etc.

/**
 * tick 间隔判定：实体年龄是否为 interval 的整数倍（即每 interval tick 触发一次）
 * 用法：if (!everyTicks(player, 20)) return; 或 if (everyTicks(player, 5)) { ... }
 * @param {Entity} entity - 任意实体（player / mob / entity）
 * @param {number} interval - 间隔 tick 数（20 = 1秒）
 * @returns {boolean} 本 tick 是否为触发点
 */
function everyTicks(entity, interval) {
    return entity.age % interval === 0;
}

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
    // 输出伤害类型
    ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {
        let entityType = event.entity.getType();

        if (1) {
            let source = event.source;
            let damageType = source.getType();
            let immediate = source.immediate;
            let actual = source.actual;
            let victim = event.entity;

            console.log("========== 伤害测试监控 ==========");
            console.log(`[受击目标] ID: ${entityType}`);
            console.log(`[受击目标] UUID: ${victim.uuid}`);
            console.log(`[受击目标] NBT: ${victim.nbt}`);
            console.log(`[伤害类型] ${damageType}`);
            
            if (immediate) {
                console.log(`[直接来源] 类型: ${immediate.getType()} | 名称: ${immediate.getName().getString()}`);
                console.log(`[直接来源] NBT: ${JSON.stringify(immediate.nbt)}`);
            } else {
                console.log(`[直接来源] 无`);
            }

            if (actual) {
                console.log(`[致因来源] 类型: ${actual.getType()} | 名称: ${actual.getName().getString()}`);
                console.log(`[致因来源] NBT: ${JSON.stringify(actual.nbt)}`);
            } else {
                console.log(`[致因来源] 无`);
                console.log(`[致因来源] 无`);
            }
            console.log("==================================");
        }
    })
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
 * 返回指定范围内的随机数
 * @param {number} min - 最小值（含）
 * @param {number} max - 最大值（含）
 * @returns {number} 随机数
 */
function randomInRange(min, max) {
    let value = Math.random() * (max - min) + min;
    return value;
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
    // 非玩家实体没有 curios inventory
    if (!player.isPlayer()) return false;
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

/**
* 在实体饰品栏中寻找饰品并返回物品栈（用于读写饰品 NBT）
* 遍历所有饰品栏槽位和其中的物品
* @param {Internal.Player} player 玩家
* @param {String} id 饰品物品ID
* @returns {Internal.ItemStack|null} 饰品物品栈，未找到返回 null
*/
function getCuriosStackOnPlayer(player, id) {
    // 检查玩家对象是否为空
    if (player == null) return null;
    // 非玩家实体没有 curios inventory
    if (!player.isPlayer()) return null;
    // 获取饰品库存
    let curios = player.curiosInventory;
    if (curios == null) return null;

    // 遍历所有饰品槽位
    for (let slot of curios.curios.values()) {
        // 遍历槽位中的所有物品
        for (let stack of slot.getStacks().getAllItems()) {
            // 检查物品ID是否匹配
            if (!stack.isEmpty() && stack.getId().toString() === id) {
                return stack;
            }
        }
    }
    return null;
}

/**
 * @param {string} str UUID 字符串
 * @returns {java.util.UUID}
 */
function toUUID(str) {
    return UUID.fromString(str)
}

// SlotAttribute / KeyMapping / ForgeRegistries / ResourceLocation 统一由 startup_scripts/CONST.js 提供。

/**
 * @param {string} str ID
 * @returns {SlotAttribute}
 */
function getSlotAttribute(str) {
    return SlotAttribute.getOrCreate(str)
}

/**
 * 在实体饰品栏中寻找指定ID饰品并返回物品对象
 * @param {Internal.ServerPlayer} player - 玩家对象
 * @param {string} id - 物品ID（如 "minecraft:diamond"）
 * @returns {Internal.ItemStack|null} 找到的饰品物品对象，未找到返回 null
 */
function getCuriosItem(player, id) {
    if (player == null) return null;
    // 非玩家实体没有 curios inventory
    if (!player.isPlayer()) return null;
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
  KeyMapping.ALL.values().toArray().forEach(k => {
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
    const map = KeyMapping.getAllKeyMappings();
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
  KeyMapping.ALL.values().toArray().forEach(k => {
    if (k.getName().toLowerCase().includes(modid.toLowerCase())) {
      result.push({
        id: k.getName(),
        name: k.getTranslatedKeyMessage().getString(),
        key: k.getKey().getDisplayName().getString(),
        category: km.getCategory(),                      // 分类ID
      });
    }
  });
  return result;
};
//DamageSorce()

// ==========================================
// 物品冷却读取/恢复（原版 ItemCooldowns 无剩余时间公开接口）
// 生产环境运行时字段为 SRG 名（f_xxxxx_），Rhino 不重映射原生反射的字符串参数，
// 故按字段类型反射定位（名称无关，dev/生产通用），字段对象缓存避免重复查找：
//   ItemCooldowns 中唯一的 Map 字段  = 冷却表 Map<Item, CooldownInstance>
//   ItemCooldowns 中唯一的 int 字段  = tickCount（当前 tick）
//   CooldownInstance 的两个 int 字段 = startTime/endTime（按值区分：小者=起点）
// 写入端：不使用 addCooldown（其为替换语义，会把剩余值当作新的 100% 总时长，
// 导致客户端蒙版以剩余值为满格重新扫一遍）。改为「窗口前移」：将 CooldownInstance
// 的 startTime/endTime 同减 delta，窗口长度（=物品原有总时长）保持不变——
// 客户端蒙版进度 = (now-start)/(end-start) = 1 - 剩余/原有总时长，
// 减少冷却时蒙版瞬间向前跳 delta/总时长，且多次触发总时长基准不漂移。
// 服务端反射改写后经 player.sendData('kubejs_cd_shift') 通知客户端脚本对本地冷却
// 做同样前移（见 client_scripts/cooldown_mask_sync.js）。
// 冷却完全清空时走 removeCooldown 公开 API（原版自动发包，蒙版直接清空 = 进度拉满）。
// ==========================================
let _cdMapField = null;      // 反射缓存：ItemCooldowns 的 Map 字段
let _cdTickField = null;     // 反射缓存：ItemCooldowns 的 int 字段（tickCount）
let _cdInstFields = null;    // 反射缓存：CooldownInstance 的两个 int 字段
let _cdForgeRegistries = null;         // ForgeRegistries（注册表 ID <-> Item 互查，Forge API 无 SRG 之扰）
let _cdResourceLocationCls = null;     // net.minecraft.resources.ResourceLocation

// 初始化 ItemCooldowns 的反射字段缓存（沿父类链查找，服务端实际类型为 ServerItemCooldowns）
function _cdInitFields(cd) {
    if (_cdMapField) return true;
    try {
        // console.log('[冷却调试] 阶段1-开始反射定位字段, 实际类: ' + cd.getClass().getName());
        let mapF = null, tickF = null;
        let cls = cd.getClass();
        while (cls != null && (!mapF || !tickF)) {
            let fs = cls.getDeclaredFields();
            for (let i = 0; i < fs.length; i++) {
                let t = String(fs[i].getType().getName());
                if (t == 'java.util.Map' && !mapF) mapF = fs[i];
                else if (t == 'int' && !tickF) tickF = fs[i];
            }
            cls = cls.getSuperclass();
        }
        if (!mapF || !tickF) {
            // console.log('[冷却调试] 阶段1-失败: 未找到 Map/int 字段 (mapF=' + (mapF != null) + ', tickF=' + (tickF != null) + ')');
            return false;
        }
        mapF.setAccessible(true);
        tickF.setAccessible(true);
        _cdMapField = mapF;
        _cdTickField = tickF;
        // console.log('[冷却调试] 阶段1-成功: mapField=' + mapF.getName() + ', tickField=' + tickF.getName());
        return true;
    } catch (e) {
        console.error('[Utils] _cdInitFields 反射初始化失败: ' + e);
        return false;
    }
}

// 把各种物品形态（原版 ItemStack / KubeJS 包装 / 原版 Item）统一解析为原版 Item
function _toMcItem(stackOrItem) {
    try {
        if (stackOrItem == null) return null;
        if (typeof stackOrItem.getItem === 'function') return stackOrItem.getItem();
        if (stackOrItem.item !== undefined) return stackOrItem.item;
        return null;
    } catch (e) {
        return null;
    }
}

// 初始化 CooldownInstance 的两个 int 字段缓存（startTime/endTime，按值区分：小者=起点）
function _cdInitInstFields(inst) {
    if (_cdInstFields) return true;
    try {
        let ints = [];
        let fs = inst.getClass().getDeclaredFields();
        for (let i = 0; i < fs.length; i++) {
            if (String(fs[i].getType().getName()) == 'int') {
                fs[i].setAccessible(true);
                ints.push(fs[i]);
            }
        }
        if (ints.length < 2) return false;
        _cdInstFields = ints;
        return true;
    } catch (e) {
        console.error('[Utils] _cdInitInstFields 失败: ' + e);
        return false;
    }
}

// 经 ForgeRegistries 查询原版 Item 的注册表 ID（'modid:name'），失败返回 null
function _cdGetItemRegistryId(mcItem) {
    try {
        let key = ForgeRegistries.ITEMS.getKey(mcItem);
        return key ? String(key) : null;
    } catch (e) {
        return null;
    }
}

/**
 * 冷却窗口前移（保持总时长基准不变的核心写入函数）
 * 将 CooldownInstance 的 startTime/endTime 同减 delta：
 *   - 窗口长度（总时长）不变 → 蒙版/百分比始终以物品原有总时长为 100%
 *   - endTime 提前 delta → 实际剩余冷却正确减少 delta tick
 *   - 蒙版进度 = 1 - 剩余/总时长，瞬间向前跳 delta/总时长，不重置为满格
 * 写入方式：Field.setInt 直接改写字段（Java 反射规范允许写非 static 的 final
 * 实例字段，仅 static final 被禁止）。不能用构造器 newInstance 整替——
 * Rhino 把 JS 数字装箱成 Double，与 int 形参的 Integer 装箱不匹配，
 * newInstance(Object...) 无方法分派转换，会抛 argument type mismatch。
 * 直接改写不触发原版同步包，客户端蒙版同步由调用方经 sendData 通知客户端
 * 脚本执行同样前移。
 * @param {Internal.Player} player - 玩家（KubeJS 包装或原版实体均可）
 * @param {Item} mcItem - 原版 Item
 * @param {number} delta - 前移的 tick 数（>0）
 * @returns {boolean} 是否成功
 */
function _cdShiftInstance(player, mcItem, delta) {
    try {
        if (!player || !mcItem || !(delta > 0)) return false;
        let mcPlayer = player.minecraftEntity ? player.minecraftEntity : player;
        let cd = mcPlayer.getCooldowns();
        if (!cd || !_cdInitFields(cd)) return false;

        let inst = _cdMapField.get(cd).get(mcItem);
        if (!inst) return false;
        if (!_cdInitInstFields(inst)) return false;

        // 读原值 → 同减 delta → 写回（保持窗口长度不变）
        let t1 = _cdInstFields[0].getInt(inst);
        let t2 = _cdInstFields[1].getInt(inst);
        let start = Math.min(t1, t2);
        let end = Math.max(t1, t2);
        let ns = Math.floor(start - delta);
        let ne = Math.floor(end - delta);
        // CooldownInstance 字段顺序未知（SRG 名），按值对号入座：小值→起点字段，大值→终点字段
        if (t1 <= t2) {
            _cdInstFields[0].setInt(inst, ns);
            _cdInstFields[1].setInt(inst, ne);
        } else {
            _cdInstFields[0].setInt(inst, ne);
            _cdInstFields[1].setInt(inst, ns);
        }
        return true;
    } catch (e) {
        console.error('[Utils] _cdShiftInstance 失败: ' + e);
        return false;
    }
}

/**
 * 读取玩家某物品的冷却信息（tick）
 * @param {Internal.Player} player - 玩家（KubeJS 包装或原版实体均可）
 * @param {ItemStack|Item} stackOrItem - 物品堆或物品
 * @returns {object|null} {remaining:剩余tick, duration:总时长tick}；无冷却时 remaining=0；读取失败返回 null
 */
function getItemCooldownInfo(player, stackOrItem) {
    try {
        if (!player || !stackOrItem) {
            // console.log('[冷却调试] 阶段2-参数为空 (player=' + (player != null) + ', item=' + (stackOrItem != null) + ')');
            return null;
        }
        let mcItem = _toMcItem(stackOrItem);
        if (!mcItem) {
            // console.log('[冷却调试] 阶段2-物品解析失败: ' + stackOrItem);
            return null;
        }

        let mcPlayer = player.minecraftEntity ? player.minecraftEntity : player;
        let cd = mcPlayer.getCooldowns();
        if (!cd || !_cdInitFields(cd)) {
            // console.log('[冷却调试] 阶段2-获取冷却对象或反射初始化失败');
            return null;
        }

        let inst = _cdMapField.get(cd).get(mcItem);
        if (inst == null) {
            // console.log('[冷却调试] 阶段2-该物品无冷却记录: ' + mcItem);
            return { remaining: 0, duration: 0 };
        }

        if (!_cdInstFields && !_cdInitInstFields(inst)) {
            // console.log('[冷却调试] 阶段2-失败: CooldownInstance 字段初始化失败');
            return null;
        }

        let now = _cdTickField.getInt(cd);
        let t1 = _cdInstFields[0].getInt(inst);
        let t2 = _cdInstFields[1].getInt(inst);
        let end = Math.max(t1, t2);
        let remaining = end - now;
        let result = {
            remaining: remaining > 0 ? remaining : 0,
            duration: end - Math.min(t1, t2)
        };
        // console.log('[冷却调试] 阶段2-成功: item=' + mcItem + ', start=' + Math.min(t1, t2) + ', end=' + end + ', now=' + now + ', 剩余=' + result.remaining + 't, 总时长=' + result.duration + 't');
        return result;
    } catch (e) {
        console.error('[Utils] getItemCooldownInfo 读取失败: ' + e);
        return null;
    }
}

/**
 * 冷却恢复内部实现（写入走公开 API，客户端冷却遮罩自动同步）
 * @param {Internal.Player} player - 玩家
 * @param {ItemStack|Item} stackOrItem - 物品堆或物品
 * @param {number} ratio - 恢复比例（0.25 = 25%）
 * @param {string} basis - 折算基准：'remaining'=按当前剩余（默认），'duration'=按总时长
 * @returns {boolean} 该物品是否处于冷却且已被修改
 */
function _restoreCooldownImpl(player, stackOrItem, ratio, basis) {
    try {
        if (!player || !stackOrItem) return false;
        let mcItem = _toMcItem(stackOrItem);
        if (!mcItem) return false;

        let info = getItemCooldownInfo(player, stackOrItem);
        if (!info || info.remaining <= 0) {
            // console.log('[冷却调试] 阶段3-跳过(无冷却或读取失败): item=' + mcItem + ', info=' + JSON.stringify(info));
            return false;
        }
        if (basis == 'duration' && info.duration <= 0) return false;

        // 按剩余：新剩余 = 剩余 × (1 - ratio)，例：剩 100t、0.25 → 剩 75t
        // 按总时长：新剩余 = 剩余 - 总时长 × ratio，例：总 200t 剩 100t、0.25 → 剩 50t
        let newRemaining = (basis == 'duration')
            ? Math.ceil(info.remaining - info.duration * ratio)
            : Math.ceil(info.remaining * (1 - ratio));
        // console.log('[冷却调试] 阶段3-计算: item=' + mcItem + ', 剩余=' + info.remaining + 't, 基准=' + basis + ', 恢复比例=' + ratio + ', 新剩余=' + newRemaining + 't');

        if (newRemaining <= 0) {
            // 完全清空：走原版公开 API（自动发包，客户端蒙版瞬间清空 = 进度直接拉满）
            player.cooldowns.removeCooldown(mcItem);
            return true;
        }

        let delta = info.remaining - newRemaining; // 实际减少的 tick 数
        if (delta > 0) {
            // 窗口前移：总时长基准不变，蒙版进度 = 1 - 剩余/原有总时长，瞬间前跳不重置
            if (_cdShiftInstance(player, mcItem, delta)) {
                // 通知客户端对本地冷却做同样前移（蒙版同步通道）
                let itemId = null;
                try {
                    if (typeof stackOrItem.getId === 'function') itemId = String(stackOrItem.getId());
                } catch (ignored) {}
                if (!itemId) itemId = _cdGetItemRegistryId(mcItem);
                if (itemId) {
                    try {
                        player.sendData('kubejs_cd_shift', { id: itemId, d: delta });
                    } catch (ignored) {}
                }
            } else {
                // 反射失败兜底：退回替换语义（冷却数值正确，但蒙版会以剩余值为 100% 重置）
                player.cooldowns.addCooldown(mcItem, newRemaining);
            }
        }
        return true;
    } catch (e) {
        console.error('[Utils] _restoreCooldownImpl 失败: ' + e);
        return false;
    }
}

/**
 * 按当前剩余冷却的比例恢复物品冷却
 * 新剩余 = 当前剩余 × (1 - ratio)，收益随剩余递减，例：剩 40s、0.25 → 剩 30s
 * @param {number} ratio - 恢复比例（0.25 = 每次减少当前剩余冷却的 25%）
 */
function restoreCooldownByRemaining(player, stackOrItem, ratio) {
    return _restoreCooldownImpl(player, stackOrItem, ratio, 'remaining');
}

/**
 * 按总冷却时长的比例恢复物品冷却
 * 新剩余 = 当前剩余 - 总时长 × ratio，收益恒定，例：总 60s 剩 50s、0.25 → 剩 35s
 * @param {number} ratio - 恢复比例（0.25 = 每次减少总冷却时长的 25%）
 */
function restoreCooldownByDuration(player, stackOrItem, ratio) {
    return _restoreCooldownImpl(player, stackOrItem, ratio, 'duration');
}

// 兼容别名：默认按当前剩余折算（dice / sharingan 均使用此基准）
function restoreCooldownRatio(player, stackOrItem, ratio) {
    return restoreCooldownByRemaining(player, stackOrItem, ratio);
}

// 挂到 global 供 server_scripts / client_scripts 作用域跨作用域调用
// （global 在各脚本类型间共享，事件回调运行时 startup 已加载完毕）
global.getItemCooldownInfo = getItemCooldownInfo;
global.restoreCooldownRatio = restoreCooldownRatio;
global.restoreCooldownByRemaining = restoreCooldownByRemaining;
global.restoreCooldownByDuration = restoreCooldownByDuration;

// 按注册表 ID（'modid:name'）解析原版 Item（客户端蒙版同步用；
// startup_scripts 在客户端物理侧同样加载，global 跨脚本类型可见）
global.getItemById = function (id) {
    try {
        if (!id) return null;
        return ForgeRegistries.ITEMS.getValue(new ResourceLocation(String(id)));
    } catch (e) {
        return null;
    }
};

// 客户端：按物品 ID 前移本地冷却窗口（与 _cdShiftInstance 同逻辑，供网络事件回调调用）
global.shiftCooldownWindowById = function (player, itemId, delta) {
    let item = global.getItemById(itemId);
    if (!item) return false;
    return _cdShiftInstance(player, item, delta);
};
