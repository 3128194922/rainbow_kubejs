// priority: 100

// ==========================================
// 🧬 基因矩阵逻辑与配方
// ==========================================

//const Allele = Java.loadClass('snownee.fruits.bee.genetics.Allele');
/*
const NBT = Java.loadClass('net.minecraft.nbt.CompoundTag');
const ByteTag = Java.loadClass('net.minecraft.nbt.ByteTag');

function normalizeAscii(code) {
    if (code == null) return null;
    if (/^[0-9]+$/.test(code)) {
        const n = parseInt(code, 10);
        if (Number.isFinite(n) && n >= 0 && n <= 255) {
            return String.fromCharCode(n);
        }
    }
    return code === '0' ? null : code;
}

function getDisguisedKey(realName) {
    try {
        const allele = Allele.REGISTRY.get(realName);
        if (!allele) return realName;
        const code = '' + allele.codename;
        return normalizeAscii(code) || realName;
    } catch (e) {
        return realName;
    }
}

// 获取当前的基因键列表（已排序）
function getGeneKeys() {
    const realNames = ['RC', 'FC', 'FT1', 'FT2'];
    const keys = realNames.map(name => getDisguisedKey(name));
    return keys.sort();
}

// 工具函数：解析 NBT 到 2xN 矩阵和 keys
function parseGeneMatrix(nbt) {
    let matrix = [[0, 0, 0, 0], [0, 0, 0, 0]]
    let keys = getGeneKeys(); // 使用动态获取的 key 作为默认值

    if (!nbt) return { matrix: matrix, keys: keys }
    
    let geneData = null
    // 尝试获取 FFDisguisedGeneBytes
    if (nbt.get && typeof nbt.get === 'function') {
        if (nbt.contains('FFDisguisedGeneBytes')) {
             geneData = nbt.get('FFDisguisedGeneBytes')
        }
    } else if (nbt.FFDisguisedGeneBytes) {
        geneData = nbt.FFDisguisedGeneBytes
    }
    
    if (!geneData) return { matrix: matrix, keys: keys }

    let keyList = []
    if (geneData.getAllKeys) {
        let javaKeys = geneData.getAllKeys()
        let iter = javaKeys.iterator()
        while (iter.hasNext()) {
            keyList.push(iter.next())
        }
    } else {
        keyList = Object.keys(geneData)
    }
    
    if (keyList.length > 0) {
        keys = keyList.sort()
    }
    
    keys.forEach((key, colIndex) => {
        if (colIndex >= 4) return // 防止溢出
        let val = 0
        if (geneData.getByte) {
             val = geneData.getByte(key)
        } else if (geneData[key] !== undefined) {
             val = geneData[key]
        } else if (geneData.get) {
             let tag = geneData.get(key)
             val = (tag && tag.getAsByte) ? tag.getAsByte() : tag
        }
        
        val = Number(val)
        
        matrix[0][colIndex] = (val & 0xF0) >> 4 
        matrix[1][colIndex] = val & 0x0F        
    })
    
    return { matrix: matrix, keys: keys }
}

// 工具函数：矩阵序列化回 NBT 对象
function serializeGeneMatrix(matrix, keys) {
    let geneBytes = new NBT();
    
    keys.forEach((key, colIndex) => {
        if (colIndex >= matrix[0].length) return
        
        let high = matrix[0][colIndex] & 0x0F
        let low = matrix[1][colIndex] & 0x0F
        let val = (high << 4) | low
        geneBytes.putByte(key, val)
    })
    
    let root = new NBT();
    root.put('FFDisguisedGeneBytes', geneBytes);
    return root;
}

// 计算点积
function calculateDotProduct(matrix) {
    let dotProduct = 0
    let cols = matrix[0].length
    for (let col = 0; col < cols; col++) {
        dotProduct += matrix[0][col] * matrix[1][col]
    }
    return dotProduct
}

// 执行运算
function performOperation(opType, val1, val2, colIndex) {
    let result
    let mod = (colIndex === 0) ? 2 : 3
    
    switch(opType) {
        case 'plus':
            result = (val1 + val2) % mod
            break
        case 'minus':
            result = (val1 - val2 + mod) % mod
            break
        case 'multiply':
            result = (val1 * val2) % mod
            break
        case 'divide':
            if (val2 === 0) {
                result = val1
            } else {
                result = Math.round(val1 / val2)
                result = result % mod
            }
            break
        default:
            result = 0
    }
    return result
}

// 矩阵运算
function matrixOperation(matrixA, matrixB, opType) {
    let cols = matrixA[0].length
    let resultMatrix = [[], []]
    
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cols; col++) {
            let valB = (col < matrixB[row].length) ? matrixB[row][col] : 0
            resultMatrix[row][col] = performOperation(opType, matrixA[row][col], valB, col)
        }
    }
    return resultMatrix
}

// 注册配方
ServerEvents.recipes(event => {
    const ops = ['plus', 'minus', 'multiply', 'divide']
    
    // 1. 基因合成配方：Bee + Op + Bee -> Bee
    ops.forEach(op => {
        event.recipes.kubejs.shapeless('rainbow:amber_bee', [
            'rainbow:amber_bee',
            `rainbow:${op}`,
            'rainbow:amber_bee'
        ]).id(`kubejs:gene_synthesis_${op}`).modifyResult((grid, output) => {
            try {
                let allBees = grid.findAll('rainbow:amber_bee')
                if (allBees.length < 2) return output
                
                let bee1 = allBees[0]
                let bee2 = allBees[1]
                
                let parsedA = parseGeneMatrix(bee1.nbt)
                let parsedB = parseGeneMatrix(bee2.nbt)
                
                let resultMatrix = matrixOperation(parsedA.matrix, parsedB.matrix, op)
                let resultNbt = serializeGeneMatrix(resultMatrix, parsedA.keys)
                
                return Item.of('rainbow:amber_bee', resultNbt)
            } catch (e) {
                console.error(`[GeneLogic] Error in synthesis ${op}: ${e}`)
                return output
            }
        })
    })
    
    // 2. 激素提取配方：Bee + Bottle -> Hormone_X
    // 使用穷举法注册所有 NBT 情况，以便 JEI 显示
    const keys = getGeneKeys();
    const validGeneValues = [0, 1, 2, 16, 17, 18, 32, 33, 34];
    
    validGeneValues.forEach(v0 => {
        validGeneValues.forEach(v1 => {
            validGeneValues.forEach(v2 => {
                validGeneValues.forEach(v3 => {
                    let matrix = [[0,0,0,0], [0,0,0,0]];
                    let vals = [v0, v1, v2, v3];
                    
                    let geneBytes = {};
                    vals.forEach((val, i) => {
                        matrix[0][i] = (val & 0xF0) >> 4;
                        matrix[1][i] = val & 0x0F;
                        geneBytes[keys[i]] = ByteTag.valueOf(val);
                    });
                    
                    let dot = calculateDotProduct(matrix);
                    let hIndex = dot > 8 ? 8 : (dot < 0 ? 0 : dot);
                    
                    let nbtObj = { FFDisguisedGeneBytes: geneBytes };
                    
                    // 修改命名空间为 rainbow
                    event.shapeless(`rainbow:hormone_${hIndex}`, [
                        Item.of('rainbow:amber_bee', nbtObj).weakNBT(),
                        'minecraft:glass_bottle'
                    ]);
                });
            });
        });
    });
    
    event.recipes.kubejs.shapeless('rainbow:hormone_0', ['rainbow:amber_bee', 'minecraft:glass_bottle'])
        .id('kubejs:gene_extraction_fallback')
        .modifyResult((grid, output) => {
            try {
                let bee = grid.find('rainbow:amber_bee')
                if (!bee) return output
                let parsed = parseGeneMatrix(bee.nbt)
                let dot = calculateDotProduct(parsed.matrix)
                let hIndex = dot > 8 ? 8 : (dot < 0 ? 0 : dot);
                // 修改命名空间为 rainbow
                return Item.of(`rainbow:hormone_${hIndex}`)
            } catch (e) { return output }
        })
})

// 【前端变前台，后端变后厨，python送到家，Java炒米粉】
*/