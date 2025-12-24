// priority: 1000
global.WhileFoodList = []

/**
* 监听饰品栏添加效果
*/
let CuriosApi = Java.loadClass("top.theillusivec4.curios.api.CuriosApi")

/**
* 在实体饰品栏中寻找饰品
* @param {Internal.Item} stack 饰品
* @param {Internal.LivingEntity_} entity 实体
*/
function hasCurios(entity, stack) {
    return CuriosApi.getCuriosHelper().findEquippedCurio(stack, entity).isPresent()
}

/**
* 输出所有食物列表
*/

function FoodList() {
    Ingredient.all.itemIds.forEach(itemId => {
        if (Item.of(itemId).item.foodProperties)
            console.log(Item.of(itemId).item.foodProperties.getNutrition().toString() + "#" + itemId)
    })
}

/**
* 输出所有武器列表
*/

function WeaponList() {
    Ingredient.all.itemIds.forEach(itemId => {
        if (Item.of(itemId).item.attackDamage)
            console.log(Item.of(itemId).item.id)
    })
}


/**
* 返回末影箱里复合条件的食物数量
* @param {Internal.PlayerEnderChestContainer} enderChest 饰品
*/

function getEndChestFoods(enderChest) {
    const number = 0;
    for (let i = 0; i < 27; i++) {
        if (!enderChest.getItem(i).isEmpty()) {
            if (global.WhileFoodList.includes(enderChest.getItem(i).id)) {
                number++;
            }
        }
    }
    return number;
}

/**
* 刷怪蛋ID转实体ID
* @param {String[]} entityList 饰品
*/
function removeSpawnEggSuffix(entityList) {
    return entityList.map(entity => {
        const parts = entity.split('_spawn_egg');
        return parts[0];
    });
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
    const value = Math.random() * (max - min) + min;
    return value;
}



/**
 * 物品数字和变量数字的转变
 * @param {String} Item
 * @returns {String | Number} 
 */
function ItemToNumberF(Item) {
    const ItemToNumber = {
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
        'missingno': "none"
    }

    return ItemToNumber[Item]
}

/**
 * 数字和符号转物品名称
 * @param {String | Number} num 
 * @returns {String}
 */
function NumberToItem(num) {
    const NumberToItemMap = {
        0: 'zero',
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight',
        9: 'nine',
        '+': 'plus',
        '-': 'minus',
        '*': 'multiply',
        '/': 'divide',
        'none': 'missingno'
    };

    return NumberToItemMap[num];
}

/**
 * 字符数字运算
 * @param {String} Num1
 * @param {String} Operaror
 * @param {String} Num2
 * @returns {Number} 
 */
function StringNumerOperaror(Num1, Operaror, Num2) {
    const num1 = ItemToNumberF(Num1);
    const num2 = ItemToNumberF(Num2);
    const op = ItemToNumberF(Operaror);

    switch (op) {
        case "+": return num1 + num2;
        case "-": return num1 - num2;
        case "*": return num1 * num2;
        case "/": return num2 === 0 ? NaN : num1 / num2; // 处理除零错误
        default: return NaN; // 无效运算符
    }
}

/**
 * 数字逻辑验证函数
 * @param {Number} Num
 * @returns {boolean} 
 */
function NumberisOk(Num) {
    return Num >= 0 && Num <= 9 && Number.isInteger(Num) && !isNaN(Num);
}

/**
 * 获取GLFW标准按键值
 * @param {string} keyName - GLFW_KEY_开头的按键名称（不区分大小写）
 * @returns {number|null} 返回对应的键值，未找到返回null
 */
function getGlfwKeyValue(keyName) {
    // 移除可能的前缀并转为大写
    const normalizedKeyName = keyName.replace(/^GLFW_KEY_/i, '').toUpperCase();

    // GLFW键值映射表
    const keyMap = {
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
 * boat转化（精确匹配版）
 * @param {string} boatId 
 * @returns {string} 
 */
function BoatToChestBoat(boatId) {
    // 定义boat和chest_boat的对应关系
    const boat = [
        'minecraft:boat',
        'blueprint:boat',
        'quark:quark_boat'
    ];

    const chest_boat = [
        'minecraft:chest_boat',
        'blueprint:chest_boat',
        'quark:quark_chest_boat'
    ];

    return chest_boat[boat.indexOf(boatId)];
}


/**
 * 矿车实体右键对应关系
 * @param {string} ItemStack 
 * @returns {string} 
 */
function McTo(ItemStack) {
    const items = ['minecraft:hopper', 'minecraft:tnt', 'minecraft:furnace', 'oreganized:shrapnel_bomb']
    const entitys = ['minecraft:hopper_minecart', 'minecraft:tnt_minecart', 'minecraft:furnace_minecart', 'oreganized:shrapnel_bomb_minecart']
    const furnaces = ['quark:deepslate_furnace', 'quark:blackstone_furnace']
    if (items.indexOf(ItemStack) == -1 && furnaces.indexOf(ItemStack) == -1) return null;
    if (furnaces.indexOf(ItemStack) != -1) {
        return 'minecraft:furnace_minecart';
    }
    else return entitys[items.indexOf(ItemStack)]
}


/**
 * 实体转化黑名单
 * @param {string} ItemStack 
 * @returns {boolean} 
 */
function BoatidOK(ItemStack) {
    const entitys = ['minecraft:chest_minecart', 'minecraft:hopper_minecart', 'minecraft:tnt_minecart', 'minecraft:furnace_minecart', 'oreganized:shrapnel_bomb_minecart', 'minecraft:chest_boat', 'blueprint:chest_boat', 'quark:quark_chest_boat']
    return entitys.indexOf(ItemStack) == -1 ? true : false;
}

/**
 * 返回对应槽位物品列表
 * @param {Internal.Player} player 
 * @param {string} slot
 * @returns {ItemList: [{}]}
 */
function getCuriosItemList(player, slot) {
    let curio = player.nbt.ForgeCaps['curios:inventory']["Curios"].find(function (curio) {
        return curio["Identifier"] === slot;
    })
    return curio ? curio.StacksHandler.Stacks.Items : [];
}


/**
 * 返回是否有此物品在player的slot上，及物品数量，对应槽位号(该对应槽位的第几个)，对应槽位数量
 * @param {Internal.Player} player 
 * @param {string} slot
 * @param {string} id 
 * @returns {{hasItem: boolean, count: number, SlotNum: number, SlotSize: number}}
 */
function CuriosPlayer(player, slot, id) {
    let result = {
        hasItem: false,
        count: 0,
        SlotNum: 0,
        SlotSize: 0
    };

    let ItemList = getCuriosItemList(player, slot)
    result.SlotSize = player.nbt.ForgeCaps['curios:inventory']["Curios"].find(function (curio) {
        return curio["Identifier"] === slot;
    }).StacksHandler.Cosmetics.Size
    ItemList.forEach(item => {
        if (item.id === id) {
            result.hasItem = true;
            result.count += item.Count;
            result.SlotNum = item.Slot;
        }
    })
    return result;
}

//以下思路来源于群友落秋与curios源码
//对饰品栏插槽的直接控制
let $CuriosApi = Java.loadClass("top.theillusivec4.curios.api.CuriosApi")
/**
 * 
 * @param {"shrink"|"grow"|"getfor"|"setfor"|"unlock"|"lock"} method 
 * @param {string} slot 
 * @param {Internal.Player} player 
 * @param {Number} amount 
 * @returns 
 */
function CuriosSlotMethod(method, slot, player, amount) {
    switch (method) {
        case "shrink":  //减去对应玩家相应数量的对应插槽
            $CuriosApi.getSlotHelper().shrinkSlotType(slot, amount, player)
            break;
        case "grow":  //添加对应玩家相应数量的对应插槽
            $CuriosApi.getSlotHelper().growSlotType(slot, amount, player)
            break;
        case "getfor":  //获取对应玩家对应插槽的数量
            console.log($CuriosApi.getSlotHelper().getSlotsForType(player, slot))
            return $CuriosApi.getSlotHelper().getSlotsForType(player, slot)
        case "setfor":  //设置对应玩家对应插槽的数量
            $CuriosApi.getSlotHelper().setSlotsForType(slot, player, amount)
            break;
        case "unlock":  //解锁对应玩家对应插槽
            $CuriosApi.getSlotHelper().unlockSlotType(slot, player)
            break;
        case "lock":   //锁定对应玩家对应插槽
            $CuriosApi.getSlotHelper().lockSlotType(slot, player)
            break;
    }
}

/**
 * 将秒转化为游戏内的tick
 * @param {Number} input 单位 秒
 * @returns {Number}
 */
function SecoundToTick(input) {
    return input * 20;
}


// 将朝向反向，让防御面朝外
function reverseDirection(dir) {
    let reverse = {
        "down": "up",
        "up": "down",
        "north": "south",
        "south": "north",
        "west": "east",
        "east": "west"
    };
    return reverse[dir];
}

function getRandomInt(min, max) {
    min = Math.ceil(min);  // 确保最小值为整数
    max = Math.floor(max); // 确保最大值为整数
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let Player = Java.loadClass('net.minecraft.world.entity.player.Player')
/**
 * 
 * @param {Player} player 
 * @returns {boolean}
 */
function PlayerLookAtMoon(player) {
    const { yaw, pitch, level } = player
    //const renderDistance = Client.options.renderDistance().get()
    //服务器代码
    const renderDistance = 10

    //check
    if (!level.overworld || level.isDay() || player.rayTrace(16 * renderDistance + 8).block != null) {
        return false
    }

    //Moon Pitch
    const tempPitch = (((level.getSunAngle(0) - 1.62) * -90) / 1.57) - 2.825
    const add = level.dayTime() > 18000 ? Math.abs(tempPitch * 2 + 180) : 0
    const moonPitch = tempPitch + add

    if (Math.abs(moonPitch - pitch) > 2.825) {
        return false
    }
    //MoonYaw is the formula provided by @Rad
    //There is still some degree of error.
    //If anyone can provide a more accurate formula, I would be very grateful.
    const temp = (Math.abs(18000 - level.getDayTime())) / 5000;
    const step = temp ** 2 - 27.49 * temp + 117.54;
    const absYaw = Math.abs(yaw)

    if ((level.getDayTime() < 18000 && yaw > 0) || (level.getDayTime() > 18000 && yaw < 0)) {
        return false
    }

    if (!(absYaw > 85 - step && absYaw < 95 + step)) {
        return false
    }

    player.tell('你捕获到了月亮')
    return true
}

/**
 * Makes one entity face another entity by setting its yaw and pitch.
 *
 * @param {Entity} looking - The entity that will face the other entity.
 * @param {Entity} looked_at - The entity to be faced.
 */
function faceEntity(looking, looked_at) {
    looking.lookAt("eyes", new Vec3d(looked_at.x, looked_at.y+looked_at.eyeHeight-0.25, looked_at.z));
}

function repeatFacing(caster, target, durationTicks) {
    // if target is null or undefined, get the nearest player
    if (!target) {
        target = caster.level.getNearestPlayer(caster, 100)
    }
    faceEntity(caster, target);
    let count = 0;
    Utils.server.scheduleInTicks(1, e => {
        if (count <= durationTicks) {
            faceEntity(caster, target);
            count++;
            e.repeating = true;
        } else {
            e.repeating = false;
        }
    });
}

// 工具函数
function retagItem(event, item, newTags) {
    // 统一处理：如果传进来的是单个物品，转成数组
    let items = Array.isArray(item) ? item : [item]
    let tags = Array.isArray(newTags) ? newTags : [newTags]

    items.forEach(it => {
        // 移除该物品的所有 tag
        event.removeAllTagsFrom(it)

        // 给它加上新的 tag
        tags.forEach(tag => {
            event.add(tag, it)
        })
    })
}

let ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation");
let Registries = Java.loadClass("net.minecraft.core.registries.Registries");

/**
 * 检测某个坐标是否在指定结构中
 * @param {BlockPos} pos - 检测位置
 * @param {Level} level - 世界对象
 * @param {string[]} structures - 结构ID列表
 * @returns {string|null} - 返回检测到的结构ID，没有则为 null
 */
function isInsideStructure(pos, level, structures) {
    for (let sid of structures) {
        let holder = level.registryAccess()
            .registryOrThrow(Registries.STRUCTURE)
            .getOptional(new ResourceLocation(sid));

        if (holder.isPresent()) {
            let structAccess = level.structureManager().getStructureWithPieceAt(pos, holder.get());
            if (structAccess.isValid()) {
                return sid; // 找到了就返回结构ID
            }
        }
    }
    return null;
}

/**
 * 获取玩家所有 Curios 饰品 ID
 * @param {Internal.ServerPlayer} player
 * @returns {string[]} 物品 ID 数组
 */
function listCurios(player) {
    if (player == null) return [];
    let curios = player.curiosInventory;
    if (curios == null) return [];

    let all = [];

    for (let slot of curios.curios.values()) {
        for (let stack of slot.getStacks().getAllItems()) {
            if (!stack.isEmpty()) {
                all.push(stack.getId().toString());
            }
        }
    }

    return all;
}

/**
 * 获取玩家所有 Curios 饰品的冷却状态
 * @param {Internal.ServerPlayer} player
 * @returns {number[]} 冷却状态数组 (1 = 不在CD, 0 = 在CD)
 */
function listCuriosCooldown(player) {
    if (player == null) return [];
    let curios = player.curiosInventory;
    if (curios == null) return [];

    let result = [];

    for (let slot of curios.curios.values()) {
        for (let stack of slot.getStacks().getAllItems()) {
            if (!stack.isEmpty()) {
                let id = stack.getId().toString();
                // 这里要确认 cooldown 检查方式是否正确
                let notOnCd = !player.cooldowns.isOnCooldown(id);
                result.push(notOnCd ? 1 : 0);
            } else {
                // 空槽位强制 push 0
                result.push(0);
            }
        }
    }

    return result;
}

const ResourceKey = Java.loadClass("net.minecraft.resources.ResourceKey");
/**
 * 获取所有生物群系 ID
 * @param {Server} server
 * @returns {string[]} 所有群系的 ID 列表
 */
function getAllBiomeIDs(server) {
    const access = server.registryAccess();
    const biomeRegistry = access.registryOrThrow(Registries.BIOME);

    let result = [];
    biomeRegistry.keySet().forEach(id => {
        result.push(id.toString());
    });
    return result;
}

/**
 * 获取所有结构 ID
 * @param {Server} server
 * @returns {string[]} 所有结构的 ID 列表
 */
function getAllStructureIDs(server) {
    const access = server.registryAccess();
    const structureRegistry = access.registryOrThrow(
        ResourceKey.createRegistryKey("worldgen/structure")
    );

    let result = [];
    structureRegistry.keySet().forEach(id => {
        result.push(id.toString());
    });
    return result;
}


/**
 * 获取指定类型饰品栏所有饰品
 * @param {Internal.ServerPlayer} player - 玩家对象
 * @param {string} slotType - 饰品槽类型 (如 "ring", "belt", "charm")
 * @returns {ItemStackJS[]} 该类型槽位上的所有饰品物品
 */
function getCuriosItems(player, slotType) {
    let curios = player.getCuriosInventory();
    if (!curios) return null;

    let handler = curios.getCurios().get(slotType);
    if (!handler) return null;

    let stacks = handler.getStacks();
    let size = stacks.getSlots();
    let result = [];

    for (let i = 0; i < size; i++) {
        let stack = stacks.getStackInSlot(i);
        if (!stack.isEmpty()) {
            result.push(stack);
        }
    }
    return result.length > 0 ? result : null;  // 如果没有饰品，返回 null
}

/**
 * 获取指定类型饰品栏中的第一个饰品
 * @param {Internal.ServerPlayer} player
 * @param {string} slotType
 * @returns {ItemStackJS | null}
 */
function getCuriosItemBySlot(player, slotType) {
    let curios = player.getCuriosInventory()
    if (!curios) return null

    let handler = curios.getCurios().get(slotType)
    if (!handler) return null

    let stacks = handler.getStacks()
    let size = stacks.getSlots()

    for (let i = 0; i < size; i++) {
        let stack = stacks.getStackInSlot(i)
        if (!stack.isEmpty()) {
            return stack
        }
    }
    return null
}


function listTagToJSArray(listTag) {
    let arr = [];
    for (let i = 0; i < listTag.size(); i++) {
        let tag = listTag.get(i);
        arr.push(Number(tag.getAsInt())); // 转成 JS number
    }
    return arr; // 这里得到的就是原生 JS Array
}

/**
 * 将 IntArrayTag 转为普通 JS 数字数组
 * @param {IntArrayTag} nbtArray
 * @returns {number[]}
 */
function intArrayTagToNumbers(nbtArray) {
    let result = [];
    if (!nbtArray) return result;

    for (let i = 0; i < nbtArray.size(); i++) {
        let intTag = nbtArray.get(i);
        if (intTag != null && typeof intTag.getAsInt === "function") {
            result.push(intTag.getAsInt()); // 取出 IntTag 的数字
        } else {
            result.push(Number(intTag)); // 兜底处理
        }
    }

    return result;
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

// 递归把 NBT 转换成 JS 对象
function nbtToJs(nbt) {
    if (nbt === null) return null;

    // 如果是基础类型
    if (typeof nbt === "string" || typeof nbt === "number" || typeof nbt === "boolean") {
        return nbt;
    }

    // ListTag
    if (nbt.toArray !== undefined) {
        let arr = [];
        let javaArr = nbt.toArray();
        for (let i = 0; i < javaArr.length; i++) {
            arr.push(nbtToJs(javaArr[i]));
        }
        return arr;
    }

    // CompoundTag
    if (nbt.getAllKeys !== undefined) {
        let obj = {};
        let keys = nbt.getAllKeys();
        let it = keys.iterator();
        while (it.hasNext()) {
            let key = it.next();
            obj[key] = nbtToJs(nbt.get(key));
        }
        return obj;
    }

    // 其它情况直接返回 toString()
    return String(nbt);
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal("getblock")
            .executes(ctx => {
                let player = ctx.source.playerOrException;

                // ======= 1️⃣ 射线检测 =======
                let hit = player.rayTrace(5, true);
                if (!hit || !hit.block) {
                    player.tell("§c❌ 你没有指向任何方块！");
                    return 0;
                }

                let block = hit.block;
                let blockId = block.id ?? "未知方块";
                let pos = block.pos;

                player.tell(`§6📦 方块: §e${blockId}`);
                player.tell(`§7坐标: §f${pos.x}, ${pos.y}, ${pos.z}`);

                // ======= 2️⃣ 方块状态属性 =======
                let props = block.properties;
                if (props && Object.keys(props).length > 0) {
                    player.tell("§a方块状态属性：");
                    for (let [key, val] of Object.entries(props)) {
                        player.tell(`  §7${key}: §f${val}`);
                    }
                } else {
                    player.tell("§7该方块没有状态属性。");
                }

                // ======= 3️⃣ 方块实体 NBT =======
                let blockEntity = block.getEntity();
                if (blockEntity) {
                    try {
                        let nbt = blockEntity.saveWithFullMetadata();
                        let nbtJson = nbt.toString();
                        player.tell(nbtJson)
                        player.tell("§b🧩 方块实体 NBT 数据已输出到控制台。");
                        console.log(`[GetBlock NBT] ${blockId} @ (${pos.x},${pos.y},${pos.z})`);
                        console.log(nbtJson);
                    } catch (e) {
                        console.error(`[GetBlock Error] 无法获取方块实体 NBT: ${e}`);
                        player.tell("§c⚠ 获取 NBT 失败。");
                    }
                } else {
                    player.tell("§7该方块没有方块实体 (无NBT)。");
                }

                return 1;
            })
    );  

    event.register(
        Commands.literal("getplayer")
            .executes(ctx => {
                const player = ctx.source.playerOrException;
                const nbt = player.getNbt();
                const jsNbt = nbtToJs(nbt);
                console.log(JSON.stringify(jsNbt, null, 2));
                player.tell("§a你的 NBT 数据已以 JSON 格式输出到控制台。");
                return 1;
            })
    );
    
});

// ============================================
// 🌬️ Backtank 工具封装（Create气罐管理）
// ============================================
const BacktankUtil = Java.loadClass("com.simibubi.create.content.equipment.armor.BacktankUtil");
const ArrayList = Java.loadClass("java.util.ArrayList");

global.backtankUtils = {

    /**
     * 获取实体身上所有仍有气的气罐 ItemStack
     * @param {LivingEntity} entity 
     * @returns {ItemStack[]}
     */
    getAllWithAir(entity) {
        return BacktankUtil.getAllWithAir(entity);
    },

    /**
     * 检查气罐是否还有气体
     * @param {ItemStack} stack 
     * @returns {boolean}
     */
    hasAirRemaining(stack) {
        return BacktankUtil.hasAirRemaining(stack);
    },

    /**
     * 获取气罐当前气量
     * @param {ItemStack} stack 
     * @returns {number}
     */
    getAir(stack) {
        return BacktankUtil.getAir(stack);
    },

    /**
     * 获取气罐最大气量（考虑附魔）
     * @param {ItemStack} stack 
     * @returns {number}
     */
    getMaxAir(stack) {
        return BacktankUtil.maxAir(stack);
    },

    /**
     * 消耗指定气量
     * @param {LivingEntity} entity 
     * @param {ItemStack} stack 
     * @param {number} amount 
     */
    consumeAir(entity, stack, amount) {
        BacktankUtil.consumeAir(entity, stack, amount);
    },

    /**
     * 尝试为伤害吸收消耗气体（返回是否成功）
     * @param {LivingEntity} entity 
     * @param {number} usesPerTank 
     * @returns {boolean}
     */
    tryAbsorbDamage(entity, usesPerTank) {
        return BacktankUtil.canAbsorbDamage(entity, usesPerTank);
    },

    /**
     * 获取所有气罐当前气体百分比平均值
     * @param {LivingEntity} entity
     * @returns {number} 0~1
     */
    getAverageAirRatio(entity) {
        const tanks = BacktankUtil.getAllWithAir(entity);
        if (tanks.isEmpty()) return 0;
        let total = 0;
        let max = 0;
        for (let i = 0; i < tanks.size(); i++) {
            let t = tanks.get(i);
            total += BacktankUtil.getAir(t);
            max += BacktankUtil.maxAir(t);
        }
        return total / max;
    },

    /**
     * 快速获取玩家当前的第一个有效气罐
     * @param {LivingEntity} entity
     * @returns {ItemStack | null}
     */
    getFirstTank(entity) {
        const list = BacktankUtil.getAllWithAir(entity);
        return list.isEmpty() ? null : list.get(0);
    },

    /**
     * 直接设置气罐气量（手动修改 NBT）
     * @param {ItemStack} stack 
     * @param {number} value 
     */
    setAir(stack, value) {
        const tag = stack.getOrCreateTag();
        const max = BacktankUtil.maxAir(stack);
        tag.putFloat("Air", Math.min(value, max));
        stack.setTag(tag);
    },
};
// ============================================
// ✨ MobEnchant 工具封装（Enchant With Mob 管理）
// ============================================

const MobEnchantUtilsClass = Java.loadClass("baguchan.enchantwithmob.utils.MobEnchantUtils");
const MobEnchants = Java.loadClass("baguchan.enchantwithmob.registry.MobEnchants");
const RandomSource = Java.loadClass("net.minecraft.util.RandomSource");

global.mobEnchantUtils = {

    // -------------------
    // 基础检测与获取
    // -------------------

    /**
     * 检查物品是否具有 Mob 附魔
     * @param {ItemStack} stack 目标物品
     * @returns {boolean} 是否有 Mob 附魔
     */
    hasMobEnchant(stack) {
        return MobEnchantUtilsClass.hasMobEnchant(stack);
    },

    /**
     * 获取物品上的全部 Mob 附魔
     * @param {ItemStack} stack 目标物品
     * @returns {java.util.Map<Holder<MobEnchant>, Integer>} 附魔及等级映射
     */
    getEnchantments(stack) {
        return MobEnchantUtilsClass.getEnchantments(stack);
    },

    /**
     * 获取物品上指定 MobEnchant 的等级
     * @param {ItemStack} stack 目标物品
     * @param {MobEnchant} mobEnchant 附魔对象
     * @returns {number} 附魔等级
     */
    getEnchantLevel(stack, mobEnchant) {
        const enchants = MobEnchantUtilsClass.getEnchantments(stack);
        return enchants.containsKey(mobEnchant) ? enchants.get(mobEnchant) : 0;
    },

    /**
     * 根据字符串 ID 获取 MobEnchant 对象
     * @param {string} id 附魔 ID
     * @returns {MobEnchant | null} MobEnchant 对象
     */
    getEnchantFromString(id) {
        return MobEnchantUtilsClass.getEnchantFromString(id);
    },

    /**
     * 从 NBT 获取 MobEnchant
     * @param {CompoundTag} tag NBT 标签
     * @returns {MobEnchant | null} MobEnchant 对象
     */
    getEnchantFromNBT(tag) {
        return MobEnchantUtilsClass.getEnchantFromNBT(tag);
    },

    /**
     * 从 NBT 获取附魔等级
     * @param {CompoundTag} tag NBT 标签
     * @returns {number} 附魔等级
     */
    getEnchantLevelFromNBT(tag) {
        return MobEnchantUtilsClass.getEnchantLevelFromNBT(tag);
    },

    // -------------------
    // 物品附魔
    // -------------------

    /**
     * 为物品添加指定 Mob 附魔
     * @param {ItemStack} stack 目标物品
     * @param {MobEnchant} mobEnchant 附魔对象
     * @param {number} level 附魔等级
     */
    addEnchant(stack, mobEnchant, level) {
        MobEnchantUtilsClass.addMobEnchantToItemStack(stack, mobEnchant, level);
    },

    /**
     * 随机为物品添加 Mob 附魔
     * @param {ItemStack} stack 目标物品
     * @param {number} [level=10] 附魔强度
     * @param {boolean} [allowRare=true] 是否允许稀有附魔
     * @param {boolean} [allowCurse=false] 是否允许诅咒附魔
     * @returns {ItemStack} 修改后的物品
     */
    addRandomEnchant(stack, level, allowRare, allowCurse) {
        if (!stack || stack.isEmpty()) return stack;
        const random = RandomSource.create();
        MobEnchantUtilsClass.addRandomEnchantmentToItemStack(random, stack, level, allowRare, allowCurse);
        return stack;
    },

    // -------------------
    // 实体附魔
    // -------------------

    /**
     * 判断实体是否拥有指定 MobEnchant
     * @param {LivingEntity} entity 目标实体
     * @param {MobEnchant} mobEnchant 附魔对象
     * @returns {boolean} 是否拥有
     */
    hasEntityEnchant(entity, mobEnchant) {
        if (!entity || !entity.isLiving()) return false;
        const cap = entity.getCapability(Java.loadClass("baguchan.enchantwithmob.api.IEnchantCap").class);
        if (!cap) return false;
        return MobEnchantUtilsClass.findMobEnchantFromHandler(cap.getEnchantCap().getMobEnchants(), mobEnchant);
    },

    /**
     * 给实体添加 MobEnchant
     * @param {LivingEntity} entity 目标实体
     * @param {MobEnchant} mobEnchant 附魔对象
     * @param {number} level 附魔等级
     * @param {boolean} [ancient=false] 是否为远古附魔
     */
    addEnchantToEntity(entity, mobEnchant, level, ancient) {
        const IEnchantCap = Java.loadClass("baguchan.enchantwithmob.api.IEnchantCap");
        const cap = entity.getCapability(IEnchantCap.class);
        if (!cap) return;
        const MobEnchantmentData = Java.loadClass("baguchan.enchantwithmob.utils.MobEnchantmentData");
        const data = new MobEnchantmentData(mobEnchant, level);
        MobEnchantUtilsClass.addEnchantmentToEntity(entity, cap, data, ancient);
    },

    /**
     * 将物品附魔应用到实体
     * @param {ItemStack} stack 附魔物品
     * @param {LivingEntity} entity 目标实体
     * @param {LivingEntity} user 使用者实体
     * @param {IEnchantCap} capability 附魔能力对象
     * @returns {boolean} 是否成功
     */
    addItemMobEnchantToEntity(stack, entity, user, capability) {
        return MobEnchantUtilsClass.addItemMobEnchantToEntity(stack, entity, user, capability);
    },

    /**
     * 将不稳定附魔物品应用到实体
     * @param {ItemStack} stack 附魔物品
     * @param {LivingEntity} entity 目标实体
     * @param {LivingEntity} owner 拥有者
     * @param {IEnchantCap} capability 附魔能力对象
     * @returns {boolean} 是否成功
     */
    addUnstableItemMobEnchantToEntity(stack, entity, owner, capability) {
        return MobEnchantUtilsClass.addUnstableItemMobEnchantToEntity(stack, entity, owner, capability);
    },

    /**
     * 移除实体所有 Mob 附魔
     * @param {LivingEntity} entity 目标实体
     */
    clearEntityEnchants(entity) {
        const IEnchantCap = Java.loadClass("baguchan.enchantwithmob.api.IEnchantCap");
        const cap = entity.getCapability(IEnchantCap.class);
        if (!cap) return;
        MobEnchantUtilsClass.removeMobEnchantToEntity(entity, cap);
    },

    /**
     * 获取实体的附魔经验总值
     * @param {LivingEntity} entity 目标实体
     * @returns {number} 总经验值
     */
    getEntityEnchantExp(entity) {
        const IEnchantCap = Java.loadClass("baguchan.enchantwithmob.api.IEnchantCap");
        const cap = entity.getCapability(IEnchantCap.class);
        if (!cap) return 0;
        return MobEnchantUtilsClass.getExperienceFromMob(cap);
    },

    /**
     * 给实体添加随机 Mob 附魔
     * @param {LivingEntity} entity 目标实体
     * @param {IEnchantCap} capability 附魔能力对象
     * @param {RandomSource} random 随机对象
     * @param {number} level 附魔等级
     * @param {boolean} [ancient=false] 是否为远古附魔
     * @param {TagKey<MobEnchant>} [tag=null] 附魔标签
     * @returns {boolean} 是否成功
     */
    addRandomEnchantmentToEntity(entity, capability, random, level, ancient, tag) {
        if (tag) {
            return MobEnchantUtilsClass.addRandomEnchantmentToEntity(entity, capability, random, level, ancient, tag);
        }
        return MobEnchantUtilsClass.addRandomEnchantmentToEntity(entity, capability, random, level, ancient);
    },

    /**
     * 给实体添加不稳定随机 Mob 附魔
     * @param {LivingEntity} entity 目标实体
     * @param {LivingEntity} owner 拥有者
     * @param {IEnchantCap} capability 附魔能力对象
     * @param {RandomSource} random 随机对象
     * @param {number} level 附魔等级
     * @param {TagKey<MobEnchant>} [tag=null] 附魔标签
     * @returns {boolean} 是否成功
     */
    addUnstableRandomEnchantmentToEntity(entity, owner, capability, random, level, tag) {
        if (tag) {
            return MobEnchantUtilsClass.addUnstableRandomEnchantmentToEntity(entity, owner, capability, random, level, tag);
        }
        return MobEnchantUtilsClass.addUnstableRandomEnchantmentToEntity(entity, owner, capability, random, level);
    },

    // -------------------
    // 工具方法
    // -------------------

    /**
     * 当实体存在指定附魔时执行回调
     * @param {LivingEntity} entity 目标实体
     * @param {MobEnchant} mobEnchant 附魔对象
     * @param {Function} runnable 回调函数
     */
    executeIfPresent(entity, mobEnchant, runnable) {
        if (entity != null && entity instanceof Java.loadClass("baguchan.enchantwithmob.api.IEnchantCap")) {
            const cap = entity;
            if (MobEnchantUtilsClass.findMobEnchantFromHandler(cap.getEnchantCap().getMobEnchants(), mobEnchant)) {
                runnable();
            }
        }
    },

    /**
     * 获取最终伤害值（附魔影响后的）
     * @param {ServerLevel} level 世界
     * @param {Entity} entity 目标实体
     * @param {DamageSource} damageSource 伤害来源
     * @param {number} damage 原始伤害
     * @returns {number} 修改后的伤害
     */
    modifyDamage(level, entity, damageSource, damage) {
        return MobEnchantUtilsClass.modifyDamage(level, entity, damageSource, damage);
    },

    /**
     * 获取伤害防护值
     * @param {ServerLevel} level 世界
     * @param {LivingEntity} entity 目标实体
     * @param {DamageSource} damageSource 伤害来源
     * @returns {number} 防护值
     */
    getDamageProtection(level, entity, damageSource) {
        return MobEnchantUtilsClass.getDamageProtection(level, entity, damageSource);
    }
};
