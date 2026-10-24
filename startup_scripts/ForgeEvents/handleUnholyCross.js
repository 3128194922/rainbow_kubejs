// priority: 5000
// ==========================================
// 亵渎十字架（rainbow:unholy_cross） - 额外真实伤害
// ==========================================
// 功能：佩戴者造成伤害后，额外造成一次 1 点真实伤害（独立伤害实例）。
// 实现：与 rainbow:dismas_scarf 相同，使用自定义伤害类型 rainbow:unholy_cross
//       （server_scripts/rainbow/unholy_cross.js 注册，带 bypasses_armor / bypasses_effects tag），
//       通过 DamageSource + victim.attack() 结算。
// 无敌帧：LivingDamageEvent 触发时原伤害的无敌帧已生效（invulnerableTime=20），
//         额外一击前临时清零，结算后恢复；lastHurt 也必须恢复，否则后续 10 tick 内
//         的伤害减免会以 1 为基准计算，导致异常增伤。
//         lastHurt 为 protected 字段，生产环境 SRG 名为 f_20898_，开发环境为 lastHurt，
//         沿父类链反射查找并缓存 Field。
// 递归：额外一击会再次触发 LivingDamageEvent，用按受害者 UUID 的标记跳过自身，
//       同时允许额外一击引发的范围伤害对其他受害者正常触发。
// ==========================================

let unholyCrossExtraHitVictims = {};
let unholyCrossLastHurtField = null;
let unholyCrossLastHurtFieldResolved = false;

/**
 * 获取并缓存 LivingEntity.lastHurt 字段（沿父类链查找，兼容 SRG 名 f_20898_ 与 Mojmap 名 lastHurt）。
 * @param {Internal.Entity} victim 受伤实体
 * @returns {JavaObject|null}
 */
function getUnholyCrossLastHurtField(victim) {
    if (unholyCrossLastHurtFieldResolved) return unholyCrossLastHurtField;
    unholyCrossLastHurtFieldResolved = true;
    try {
        let cls = victim.getClass();
        while (cls != null) {
            let fs = cls.getDeclaredFields();
            for (let i = 0; i < fs.length; i++) {
                let name = String(fs[i].getName());
                if ((name == 'lastHurt' || name == 'f_20898_') && String(fs[i].getType().getName()) == 'float') {
                    fs[i].setAccessible(true);
                    unholyCrossLastHurtField = fs[i];
                    return unholyCrossLastHurtField;
                }
            }
            cls = cls.getSuperclass();
        }
        console.log("[亵渎十字架] 未找到 lastHurt 字段，将无法恢复无敌帧伤害基准");
    } catch (e) {
        unholyCrossLastHurtField = null;
        console.log("[亵渎十字架] 无法获取 lastHurt 字段，将无法恢复无敌帧伤害基准: " + e);
    }
    return unholyCrossLastHurtField;
}

/**
 * 亵渎十字架：佩戴者造成伤害后额外造成一次 1 点真实伤害。
 * @param {Internal.LivingDamageEvent} event
 * @param {Internal.Entity} attacker 伤害来源的实际造成者
 * @param {Internal.Entity} victim   受伤实体
 * @param {Object} context           伤害事件上下文
 */
function handleUnholyCrossDamage(event, attacker, victim, context) {
    try {
        if (attacker == null || !attacker.isPlayer()) return;
        if (victim == null || victim.level.isClientSide()) return;

        let victimKey = victim.getUuid().toString();
        if (unholyCrossExtraHitVictims[victimKey]) return;
        if (!hasContextCurio(context, "attacker", attacker, "rainbow:unholy_cross")) return;

        let registry = victim.level.registryAccess().registryOrThrow(Registries.DAMAGE_TYPE);
        let holder = registry.getHolderOrThrow(ResourceKey.create(Registries.DAMAGE_TYPE, new ResourceLocation('rainbow', 'unholy_cross')));
        let source = new DamageSource(holder, attacker, attacker);

        let lastHurtField = getUnholyCrossLastHurtField(victim);
        let previousLastHurt = null;
        if (lastHurtField != null) {
            try {
                previousLastHurt = lastHurtField.getFloat(victim);
            } catch (e) {
                console.log("[亵渎十字架] 读取 lastHurt 失败: " + e);
            }
        }

        let previousInvulnerableTime = victim.invulnerableTime;
        unholyCrossExtraHitVictims[victimKey] = true;
        try {
            victim.invulnerableTime = 0;
            victim.attack(source, 1);
        } finally {
            delete unholyCrossExtraHitVictims[victimKey];
            victim.invulnerableTime = previousInvulnerableTime;
            if (lastHurtField != null && previousLastHurt != null) {
                try {
                    lastHurtField.setFloat(victim, previousLastHurt);
                } catch (e) {
                    console.log("[亵渎十字架] 恢复 lastHurt 失败: " + e);
                }
            }
        }
    } catch (e) {
        console.log("[亵渎十字架] 额外真实伤害结算失败: " + e);
    }
}
