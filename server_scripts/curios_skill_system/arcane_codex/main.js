// 奥数法典：保存原实体状态、复制可兼容属性，并在 200 tick 后还原实体类型。
const ARCANE_CODEX_MARKER = 'rainbow_arcane_codex_transformed';
const ARCANE_CODEX_TYPE_KEY = 'rainbow_arcane_codex_original_type';
const ARCANE_CODEX_NBT_KEY = 'rainbow_arcane_codex_original_nbt';
const ARCANE_CODEX_END_TICK_KEY = 'rainbow_arcane_codex_end_tick';
const ARCANE_CODEX_DURATION_TICKS = 200;

// 在转换前复制属性数据，避免 convertTo 转移装备时改变原实体的装备属性修饰符。
function arcaneCodexReadAttributes(source) {
    let snapshots = [];
    try {
        let sourceAttributes = source.getAttributes().getSyncableAttributes();
        for (let sourceInstance of sourceAttributes) {
            try {
                let modifierSnapshots = [];
                let modifiers = sourceInstance.getModifiers();
                for (let modifier of modifiers) {
                    modifierSnapshots.push(modifier);
                }
                snapshots.push({
                    attribute: sourceInstance.getAttribute(),
                    baseValue: sourceInstance.getBaseValue(),
                    modifiers: modifierSnapshots
                });
            } catch (e) {
                console.log('[奥数法典] 保存单项属性失败: ' + e);
            }
        }
    } catch (e) {
        console.log('[奥数法典] 保存实体属性失败: ' + e);
    }
    return snapshots;
}

// 将原实体与猪双方都支持的属性基础值和修饰符复制到猪身上。
function arcaneCodexCopyAttributes(snapshots, pig) {
    try {
        for (let snapshot of snapshots) {
            try {
                let pigInstance = pig.getAttributes().getInstance(snapshot.attribute);
                if (pigInstance == null) continue;
                pigInstance.removeModifiers();
                pigInstance.setBaseValue(snapshot.baseValue);
                for (let modifier of snapshot.modifiers) {
                    pigInstance.addPermanentModifier(modifier);
                }
            } catch (e) {
                console.log('[奥数法典] 复制单项属性失败: ' + e);
            }
        }
    } catch (e) {
        console.log('[奥数法典] 复制实体属性失败: ' + e);
    }
}

// 将射线命中的 Mob 转成原版猪，并在猪的 persistentData 中保存还原快照。
function arcaneCodexTransformToPig(target) {
    let pig = null;
    let originalNbt = null;
    try {
        if (target == null || !target.isAlive() || !(target instanceof Mob) || target.isPlayer()) return false;
        if (String(target.getType()) == 'minecraft:pig') return false;
        if (target.persistentData.getBoolean(ARCANE_CODEX_MARKER)) return false;

        let originalTypeId = String(target.getType());
        let originalHealth = target.getHealth();
        let originalLevel = target.level;
        let attributeSnapshots = arcaneCodexReadAttributes(target);
        originalNbt = target.getNbt();
        if (originalNbt == null || originalNbt.isEmpty()) return false;

        let pigTypeLocation = new ResourceLocation('minecraft:pig');
        if (!BuiltInRegistries.ENTITY_TYPE.containsKey(pigTypeLocation)) return false;
        let pigType = BuiltInRegistries.ENTITY_TYPE.get(pigTypeLocation);
        pig = target.convertTo(pigType, true);
        if (pig == null) return false;

        pig.persistentData.putBoolean(ARCANE_CODEX_MARKER, true);
        pig.persistentData.putString(ARCANE_CODEX_TYPE_KEY, originalTypeId);
        pig.persistentData.put(ARCANE_CODEX_NBT_KEY, originalNbt.copy());
        pig.persistentData.putLong(ARCANE_CODEX_END_TICK_KEY, originalLevel.getTime() + ARCANE_CODEX_DURATION_TICKS);

        arcaneCodexCopyAttributes(attributeSnapshots, pig);
        pig.setHealth(Math.min(originalHealth, pig.getMaxHealth()));
        return true;
    } catch (e) {
        console.log('[奥数法典] 转化目标失败: ' + e);
        if (pig != null && originalNbt != null) {
            try {
                let fallbackNbt = originalNbt.copy();
                fallbackNbt.remove('UUID');
                fallbackNbt.remove('UUIDMost');
                fallbackNbt.remove('UUIDLeast');
                let originalTypeId = String(target.getType());
                let originalTypeLocation = new ResourceLocation(originalTypeId);
                if (BuiltInRegistries.ENTITY_TYPE.containsKey(originalTypeLocation)) {
                    let restored = pig.convertTo(BuiltInRegistries.ENTITY_TYPE.get(originalTypeLocation), true);
                    if (restored != null) restored.setNbt(fallbackNbt);
                }
            } catch (restoreError) {
                console.log('[奥数法典] 转化失败后的回滚失败: ' + restoreError);
            }
        }
        return false;
    }
}

// 将猪恢复为原实体，并重新加载转换前保存的属性、装备、效果和自定义数据。
function arcaneCodexRestorePig(pig) {
    try {
        if (pig == null || !pig.isAlive() || !pig.persistentData.getBoolean(ARCANE_CODEX_MARKER)) return false;
        let originalTypeId = pig.persistentData.getString(ARCANE_CODEX_TYPE_KEY);
        let originalNbt = pig.persistentData.getCompound(ARCANE_CODEX_NBT_KEY);
        if (originalTypeId == null || originalTypeId.length <= 0 || originalNbt == null || originalNbt.isEmpty()) {
            console.log('[奥数法典] 缺少原实体快照，无法恢复猪实体。');
            return false;
        }

        let originalTypeLocation = new ResourceLocation(originalTypeId);
        if (!BuiltInRegistries.ENTITY_TYPE.containsKey(originalTypeLocation)) {
            console.log('[奥数法典] 原实体类型不存在，无法恢复: ' + originalTypeId);
            return false;
        }

        let currentX = pig.getX();
        let currentY = pig.getY();
        let currentZ = pig.getZ();
        let currentHealth = pig.getHealth();
        let restored = pig.convertTo(BuiltInRegistries.ENTITY_TYPE.get(originalTypeLocation), true);
        if (restored == null) {
            console.log('[奥数法典] 转回原实体失败: ' + originalTypeId);
            return false;
        }

        let restoreNbt = originalNbt.copy();
        // 新实体已由 convertTo 注册，移除快照 UUID 避免覆盖世界中的新 UUID 索引。
        restoreNbt.remove('UUID');
        restoreNbt.remove('UUIDMost');
        restoreNbt.remove('UUIDLeast');
        restored.setNbt(restoreNbt);
        restored.setPos(currentX, currentY, currentZ);
        restored.setHealth(Math.min(currentHealth, restored.getMaxHealth()));
        return true;
    } catch (e) {
        console.log('[奥数法典] 恢复原实体失败: ' + e);
        return false;
    }
}

// 使用 Forge LivingTickEvent 与实体所在维度的 level.getTime() 计时，兼容本项目 KubeJS 版本。
NativeEvents.onEvent(LivingTickEvent, event => {
    try {
        let entity = event.entity;
        if (entity == null || entity.level == null || entity.level.isClientSide()) return;
        if (entity.persistentData == null || !entity.persistentData.getBoolean(ARCANE_CODEX_MARKER)) return;
        if (entity.level.getTime() < entity.persistentData.getLong(ARCANE_CODEX_END_TICK_KEY)) return;
        arcaneCodexRestorePig(entity);
    } catch (e) {
        console.log('[奥数法典] 定时恢复监听失败: ' + e);
    }
});
