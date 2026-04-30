// priority: 10000

// 实体基因片段配置：实体ID -> 基因位点数组
const ENTITY_GENE_SEGMENTS = {
    "minecraft:bee": ["A", "B", "C", "D"]
};

// 实体突变概率配置：实体ID -> 概率
// 例如 0.05 = 5%
const ENTITY_MUTATION_CHANCE = {
    "minecraft:bee": 0.05
};

// 实体基因矩阵配置：实体ID -> { rows, cols }
// 约束：rows * cols 必须等于该实体基因位点数量
const ENTITY_GENE_MATRIX_SHAPES = {
    "minecraft:bee": { rows: 2, cols: 2 },
    // 示例：若你后续接入大象并给 8 个基因位点，可用 2x4
    "minecraft:elephant": { rows: 2, cols: 4 }
};

// 默认字母位点(A-Z)对应属性键（显性时启用）
// 说明：这是“混合映射”的默认层，可被实体覆盖。
const DEFAULT_GENE_ATTRIBUTE_MAP = {
    A: "attributeslib:armor_pierce",
    B: "attributeslib:armor_shred",
    C: "attributeslib:arrow_damage",
    D: "attributeslib:arrow_velocity",
    E: "attributeslib:cold_damage",
    F: "attributeslib:creative_flight",
    G: "attributeslib:crit_chance",
    H: "attributeslib:crit_damage",
    I: "attributeslib:current_hp_damage",
    J: "attributeslib:dodge_chance",
    K: "attributeslib:draw_speed",
    L: "attributeslib:elytra_flight",
    M: "attributeslib:experience_gained",
    N: "attributeslib:fire_damage",
    O: "attributeslib:ghost_health",
    P: "attributeslib:healing_received",
    Q: "attributeslib:life_steal",
    R: "attributeslib:mining_speed",
    S: "attributeslib:overheal",
    T: "attributeslib:prot_pierce",
    U: "attributeslib:prot_shred",
    V: "caverns_and_chasms:experience_boost",
    W: "caverns_and_chasms:lifesteal",
    X: "caverns_and_chasms:magic_damage",
    Y: "caverns_and_chasms:magic_protection",
    Z: "caverns_and_chasms:slowness_infliction"
};

// 实体映射覆盖：实体ID -> { 字母位点 -> 属性键 }
const ENTITY_GENE_ATTRIBUTE_OVERRIDES = {
    "minecraft:bee": {
        A: "kubejs:bee_mining",
        B: "kubejs:bee_appetite",
        C: "kubejs:bee_pollination",
        D: "kubejs:bee_sting_power"
    }
};

// 统一存储键名
const GENE_NBT_KEY = "entity_gene";
const KOWLOON_POWER_NBT_KEY = "kowloon_power";
const KOWLOON_POWER_ITEM_ID = "kubejs:kowloon_power";

/**
 * 生成指定范围内的随机整数（含边界）。
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（包含）
 * @returns {number}
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 根据实体ID获取基因位点数组。
 * @param {string} entityId 实体ID
 * @returns {string[]|null}
 */
function getGeneSegments(entityId) {
    let segments = ENTITY_GENE_SEGMENTS[entityId];
    if (!segments || segments.length === 0) return null;
    return segments.slice();
}

/**
 * 获取实体的突变概率；若未配置则返回0（不突变）。
 * @param {string} entityId 实体ID
 * @returns {number}
 */
function getMutationChance(entityId) {
    let chance = Number(ENTITY_MUTATION_CHANCE[entityId]);
    if (isNaN(chance)) return 0;
    return Math.max(0, Math.min(1, chance));
}

/**
 * 获取实体对应的矩阵形状配置。
 * @param {string} entityId 实体ID
 * @returns {{rows:number, cols:number}|null}
 */
function getEntityMatrixShape(entityId) {
    let shape = ENTITY_GENE_MATRIX_SHAPES[entityId];
    if (!shape) return null;
    let rows = Number(shape.rows);
    let cols = Number(shape.cols);
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) return null;
    return { rows: rows, cols: cols };
}

/**
 * 获取实体最终属性映射（默认映射 + 实体覆盖）。
 * @param {string} entityId 实体ID
 * @returns {Object<string, string>}
 */
function getEntityAttributeMap(entityId) {
    let merged = {};
    Object.keys(DEFAULT_GENE_ATTRIBUTE_MAP).forEach(key => {
        merged[key] = DEFAULT_GENE_ATTRIBUTE_MAP[key];
    });
    let overrideMap = ENTITY_GENE_ATTRIBUTE_OVERRIDES[entityId];
    if (overrideMap && typeof overrideMap === "object") {
        Object.keys(overrideMap).forEach(key => {
            merged[key] = overrideMap[key];
        });
    }
    return merged;
}

/**
 * 生成单个位点的两位基因值（00~99）。
 * @returns {number}
 */
function randomGeneValue() {
    // 两位基因值：00~99
    return randomInt(0, 99);
}

/**
 * 根据数值奇偶判断位点显隐性：奇数=显，偶数=隐。
 * @param {number} value 基因位点数值
 * @returns {"显"|"隐"}
 */
function geneTrait(value) {
    // 奇数=显性，偶数=隐性
    return value % 2 === 1 ? "显" : "隐";
}

/**
 * 生成指定位点集合的基础随机基因。
 * @param {string[]} segments 基因位点数组
 * @returns {Object<string, number>}
 */
function generateBaseGene(segments) {
    let values = {};
    segments.forEach(key => {
        values[key] = randomGeneValue();
    });
    return values;
}

/**
 * 在位点总数中无重复随机抽取指定数量的下标。
 * @param {number} total 总位点数
 * @param {number} count 需要抽取的位点数
 * @returns {number[]}
 */
function pickPositions(total, count) {
    let pool = [];
    for (let i = 0; i < total; i++) pool.push(i);

    let result = [];
    let need = Math.max(0, Math.min(total, count));
    for (let i = 0; i < need; i++) {
        let picked = pool.splice(randomInt(0, pool.length - 1), 1)[0];
        result.push(picked);
    }
    return result;
}

/**
 * 将位点数值拼接成字符串（每位补足2位）。
 * @param {Object<string, number>} values 基因位点数值
 * @param {string[]} segments 基因位点数组
 * @returns {string}
 */
function valuesToSeed(values, segments) {
    return segments.map(key => String(values[key]).padStart(2, "0")).join("");
}

/**
 * 将位点转换为可读显隐文本（例如：A隐 B显 C隐 D显）。
 * @param {Object<string, number>} values 基因位点数值
 * @param {string[]} segments 基因位点数组
 * @returns {string}
 */
function valuesToTraitText(values, segments) {
    return segments.map(key => `${key}${geneTrait(values[key])}`).join(" ");
}

/**
 * 校验并标准化存档中的基因数据，失败返回 null。
 * @param {any} raw 原始 JSON 对象
 * @param {string[]} segments 基因位点数组
 * @returns {{values:Object<string,number>,seed:string}|null}
 */
function normalizeGeneData(raw, segments) {
    // 兼容旧数据：如果缺失或格式不对，返回 null，让调用方重新初始化
    if (!raw || typeof raw !== "object") return null;
    if (!raw.values || typeof raw.values !== "object") return null;

    let result = {};
    for (let i = 0; i < segments.length; i++) {
        let key = segments[i];
        let value = Number(raw.values[key]);
        if (isNaN(value)) return null;
        value = Math.max(0, Math.min(99, Math.floor(value)));
        result[key] = value;
    }
    return {
        values: result,
        seed: valuesToSeed(result, segments)
    };
}

/**
 * 将基因数据写入实体 PersistentData。
 * @param {Internal.Entity} entity 实体
 * @param {Object<string, number>} values 位点数值
 * @param {string[]} segments 基因位点数组
 */
function saveEntityGene(entity, values, segments) {
    let payload = {
        seed: valuesToSeed(values, segments),
        segments: segments,
        values: values
    };
    entity.getPersistentData().putString(GENE_NBT_KEY, JSON.stringify(payload));
}

/**
 * 读取实体基因；若不存在或格式异常则自动初始化并保存。
 * @param {Internal.Entity} entity 实体
 * @param {string} entityId 实体ID
 * @param {string[]} segments 基因位点数组
 * @returns {{values:Object<string,number>,created:boolean}}
 */
function loadOrInitEntityGene(entity, entityId, segments) {
    let data = entity.getPersistentData();
    let rawText = data.contains(GENE_NBT_KEY) ? data.getString(GENE_NBT_KEY) : null;

    if (!rawText) {
        let values = generateBaseGene(segments);
        saveEntityGene(entity, values, segments);
        return { values: values, created: true };
    }

    try {
        let raw = JSON.parse(rawText);
        let normalized = normalizeGeneData(raw, segments);
        if (normalized) return { values: normalized.values, created: false };
    } catch (err) {
        // 无法解析旧数据，走重新初始化
    }

    let values = generateBaseGene(segments);
    saveEntityGene(entity, values, segments);
    return { values: values, created: true };
}

/**
 * 执行一次遗传：父母各抽“位点数量/2”个位点，重叠位点按和的奇偶决定子嗣显隐。
 * 非重叠位点直接继承，未覆盖位点保留随机初始化结果。
 * @param {Object<string, number>} parentAValues 父本基因
 * @param {Object<string, number>} parentBValues 母本基因
 * @param {string[]} segments 基因位点数组
 * @returns {{childValues:Object<string,number>,parentAPicks:string[],parentBPicks:string[]}}
 */
function inheritEntityGene(parentAValues, parentBValues, segments) {
    let childValues = generateBaseGene(segments); // 未覆盖位点保留随机初始化结果
    let pickCount = Math.max(1, Math.floor(segments.length / 2));
    let parentAPicks = pickPositions(segments.length, pickCount);
    let parentBPicks = pickPositions(segments.length, pickCount);

    // 先处理父母“各自独占”的位点：直接继承各自数值
    parentAPicks.forEach(index => {
        if (parentBPicks.indexOf(index) === -1) {
            let key = segments[index];
            childValues[key] = parentAValues[key];
        }
    });
    parentBPicks.forEach(index => {
        if (parentAPicks.indexOf(index) === -1) {
            let key = segments[index];
            childValues[key] = parentBValues[key];
        }
    });

    // 处理父母“重叠”位点：按位加算，再由奇偶决定显隐
    parentAPicks.forEach(index => {
        if (parentBPicks.indexOf(index) !== -1) {
            let key = segments[index];
            let sum = parentAValues[key] + parentBValues[key];
            let traitOdd = sum % 2 === 1;

            // 你设定的核心规则是“看奇偶判显隐”，这里保留加算后的奇偶性，
            // 并随机一个同奇偶的两位数作为子嗣该位具体数值。
            let base = randomGeneValue();
            if (base % 2 !== (traitOdd ? 1 : 0)) {
                base = (base + 1) % 100;
            }
            childValues[key] = base;
        }
    });

    return {
        childValues: childValues,
        parentAPicks: parentAPicks.map(i => segments[i]),
        parentBPicks: parentBPicks.map(i => segments[i])
    };
}

/**
 * 对子嗣基因做一次突变：随机位点，随机 +/- (0~9)，并限制到 00~99。
 * @param {Object<string, number>} values 子嗣基因（原地修改）
 * @param {string[]} segments 基因位点数组
 * @returns {{key:string,delta:number,value:number}} 突变明细
 */
function mutateEntityGene(values, segments) {
    // 触发突变：随机一个位点，随机 +/- (0~9)
    let mutationIndex = randomInt(0, segments.length - 1);
    let key = segments[mutationIndex];
    let delta = randomInt(0, 9);
    let sign = Math.random() < 0.5 ? -1 : 1;
    let next = values[key] + sign * delta;
    next = Math.max(0, Math.min(99, next));
    values[key] = next;
    return { key: key, delta: sign * delta, value: next };
}

/**
 * 将位点值转为显隐位（显=1，隐=0），顺序与 segments 一致。
 * @param {Object<string, number>} values 位点数值
 * @param {string[]} segments 基因位点数组
 * @returns {number[]}
 */
function geneValuesToTraitBits(values, segments) {
    return segments.map(key => (values[key] % 2 === 1 ? 1 : 0));
}

/**
 * 将一维数组按 rows * cols 重排为矩阵。
 * @param {number[]} flat 一维数组
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @returns {number[][]}
 */
function flatToMatrix(flat, rows, cols) {
    let matrix = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push(flat[r * cols + c]);
        }
        matrix.push(row);
    }
    return matrix;
}

/**
 * 校验并生成实体当前基因矩阵（由显隐位构成）。
 * @param {string} entityId 实体ID
 * @param {Object<string, number>} values 位点数值
 * @param {string[]} segments 基因位点数组
 * @returns {{ok:boolean,reason?:string,rows?:number,cols?:number,matrix?:number[][]}}
 */
function buildEntityTraitMatrix(entityId, values, segments) {
    let shape = getEntityMatrixShape(entityId);
    if (!shape) return { ok: false, reason: `未配置矩阵尺寸: ${entityId}` };
    if (shape.rows * shape.cols !== segments.length) {
        return { ok: false, reason: `矩阵尺寸与基因位点数不匹配: ${entityId}` };
    }
    let bits = geneValuesToTraitBits(values, segments);
    let matrix = flatToMatrix(bits, shape.rows, shape.cols);
    return {
        ok: true,
        rows: shape.rows,
        cols: shape.cols,
        matrix: matrix
    };
}

/**
 * 判断左右矩阵是否可做左乘（左列数=右行数）。
 * @param {number[][]} left 左矩阵
 * @param {number[][]} right 右矩阵
 * @returns {boolean}
 */
function canMultiplyMatrix(left, right) {
    if (!left || !right || left.length === 0 || right.length === 0) return false;
    let leftCols = left[0].length;
    let rightRows = right.length;
    return leftCols === rightRows;
}

/**
 * 执行标准矩阵乘法。
 * @param {number[][]} left 左矩阵
 * @param {number[][]} right 右矩阵
 * @returns {number[][]}
 */
function multiplyMatrix(left, right) {
    let rows = left.length;
    let cols = right[0].length;
    let inner = left[0].length;
    let result = [];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            let sum = 0;
            for (let k = 0; k < inner; k++) {
                sum += left[r][k] * right[k][c];
            }
            row.push(sum);
        }
        result.push(row);
    }
    return result;
}

/**
 * 将二维矩阵展平为一维数组（按行优先）。
 * @param {number[][]} matrix 二维矩阵
 * @returns {number[]}
 */
function matrixToFlat(matrix) {
    let flat = [];
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            flat.push(matrix[r][c]);
        }
    }
    return flat;
}

/**
 * 根据下标生成字母位点：0->A ... 25->Z，超过后使用 Z+数字。
 * @param {number} index 位点下标
 * @returns {string}
 */
function indexToGeneLetter(index) {
    if (index >= 0 && index < 26) {
        return String.fromCharCode(65 + index);
    }
    return `Z${index - 25}`;
}

/**
 * 将矩阵结果转换为字母位点显隐与属性激活结果。
 * @param {number[][]} resultMatrix 乘法结果矩阵
 * @param {Object<string, string>} attrMap 字母到属性映射
 * @returns {{traitByLetter:Object<string,string>,activeAttributes:string[]}}
 */
function resolveKowloonTraits(resultMatrix, attrMap) {
    let flat = matrixToFlat(resultMatrix);
    let traitByLetter = {};
    let activeAttributes = [];

    for (let i = 0; i < flat.length; i++) {
        let letter = indexToGeneLetter(i);
        let trait = geneTrait(flat[i]);
        traitByLetter[letter] = trait;
        if (trait === "显" && attrMap[letter]) {
            activeAttributes.push(attrMap[letter]);
        }
    }

    return {
        traitByLetter: traitByLetter,
        activeAttributes: activeAttributes
    };
}

/**
 * 执行“左乘固定”的九龙之力矩阵合成核心（纯函数）。
 * @param {string} leftEntityId 左矩阵实体ID
 * @param {Object<string, number>} leftValues 左实体基因值
 * @param {string[]} leftSegments 左实体位点
 * @param {string} rightEntityId 右矩阵实体ID
 * @param {Object<string, number>} rightValues 右实体基因值
 * @param {string[]} rightSegments 右实体位点
 * @returns {{ok:boolean,reason?:string,payload?:Object<string,any>}}
 */
function synthesizeKowloonPower(leftEntityId, leftValues, leftSegments, rightEntityId, rightValues, rightSegments) {
    let leftBuilt = buildEntityTraitMatrix(leftEntityId, leftValues, leftSegments);
    if (!leftBuilt.ok) return { ok: false, reason: leftBuilt.reason };

    let rightBuilt = buildEntityTraitMatrix(rightEntityId, rightValues, rightSegments);
    if (!rightBuilt.ok) return { ok: false, reason: rightBuilt.reason };

    if (!canMultiplyMatrix(leftBuilt.matrix, rightBuilt.matrix)) {
        return {
            ok: false,
            reason: `矩阵不可左乘：左(${leftBuilt.rows}x${leftBuilt.cols}) 右(${rightBuilt.rows}x${rightBuilt.cols})`
        };
    }

    let resultMatrix = multiplyMatrix(leftBuilt.matrix, rightBuilt.matrix);
    let traitResolved = resolveKowloonTraits(resultMatrix, getEntityAttributeMap(leftEntityId));

    return {
        ok: true,
        payload: {
            left: {
                entityId: leftEntityId,
                rows: leftBuilt.rows,
                cols: leftBuilt.cols,
                matrix: leftBuilt.matrix
            },
            right: {
                entityId: rightEntityId,
                rows: rightBuilt.rows,
                cols: rightBuilt.cols,
                matrix: rightBuilt.matrix
            },
            result: {
                rows: resultMatrix.length,
                cols: resultMatrix[0].length,
                matrix: resultMatrix,
                traitByLetter: traitResolved.traitByLetter,
                activeAttributes: traitResolved.activeAttributes
            }
        }
    };
}

/**
 * 将九龙之力合成结果打包为物品 NBT 对象（纯函数）。
 * @param {Object<string, any>} payload 合成结果
 * @returns {Object<string, any>}
 */
function buildKowloonPowerItemNbt(payload) {
    let nbt = {};
    nbt[KOWLOON_POWER_NBT_KEY] = payload;
    return nbt;
}

/**
 * 由合成结果构建“九龙之力”物品（纯函数）。
 * @param {Object<string, any>} payload 合成结果
 * @returns {Internal.ItemStack}
 */
function createKowloonPowerItem(payload) {
    return Item.of(KOWLOON_POWER_ITEM_ID, buildKowloonPowerItemNbt(payload));
}

// 实体生成事件：配置内实体生成时自动初始化基因
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityJoinLevelEvent", event => {
    if (event.getLevel().isClientSide()) return;
    let entity = event.getEntity();
    let entityId = entity.getType().toString();
    let segments = getGeneSegments(entityId);
    if (!segments) return;

    let loaded = loadOrInitEntityGene(entity, entityId, segments);
    if (!loaded.created) return;

    console.log(
        `${entityId}（UUID: ${entity.uuid}）基因初始化：${valuesToSeed(loaded.values, segments)} -> ${valuesToTraitText(loaded.values, segments)}`
    );
});

// 实体繁殖事件：处理配置内实体繁殖时的基因遗传和基因突变
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.BabyEntitySpawnEvent", event => {
    let parentA = event.getParentA();
    let parentB = event.getParentB();
    let child = event.getChild();
    if (!parentA || !parentB || !child) return;

    let parentAId = parentA.getType().toString();
    let parentBId = parentB.getType().toString();
    let childId = child.getType().toString();
    if (parentAId !== parentBId || parentAId !== childId) return;

    let segments = getGeneSegments(childId);
    if (!segments) return;

    let parentAData = loadOrInitEntityGene(parentA, parentAId, segments);
    let parentBData = loadOrInitEntityGene(parentB, parentBId, segments);

    let inherited = inheritEntityGene(parentAData.values, parentBData.values, segments);
    let childValues = inherited.childValues;

    console.log(
        `${childId}繁殖继承：父抽[${inherited.parentAPicks.join(",")}], 母抽[${inherited.parentBPicks.join(",")}] -> ${valuesToTraitText(childValues, segments)}`
    );

    if (Math.random() < getMutationChance(childId)) {
        let mutation = mutateEntityGene(childValues, segments);
        console.log(
            `发生基因突变：位点${mutation.key}, 偏移${mutation.delta}, 新值${String(mutation.value).padStart(2, "0")}(${geneTrait(mutation.value)})`
        );
    }

    saveEntityGene(child, childValues, segments);
    console.log(`子嗣最终基因：${valuesToSeed(childValues, segments)} -> ${valuesToTraitText(childValues, segments)}`);
});
