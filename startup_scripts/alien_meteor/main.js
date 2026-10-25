// priority: 5000
// 被动在实际受到远程伤害后发生，不回溯抵消已经命中的那一击。
function alienMeteorIntercept(event, victim, source, context) {
    try {
        if (!(event.getAmount() > 0) || !victim.isPlayer() || !hasContextCurio(context, 'victim', victim, 'rainbow:mini_moon')) return;
        let direct = source.getDirectEntity();
        let ranged = source.is(DamageTypeTags.IS_PROJECTILE) || direct instanceof Projectile;
        if (!ranged) return;
        // 自定义被动使用持久数据计时，不能为未注册的物品ID创建冷却。
        let time = victim.level.getTime();
        if (victim.persistentData.getLong('AlienMeteorPassiveUntil') > time) return;
        victim.persistentData.putLong('AlienMeteorPassiveUntil', time + 20);
        // 抵挡抛射体范围半径 3：范围查询与距离判定都按 3 格（平方 9）过滤。
        for (let projectile of victim.level.getEntitiesWithin(victim.boundingBox.inflate(3))) {
            if (!(projectile instanceof Projectile) || !projectile.isAlive()) continue;
            let dx = projectile.getX() - victim.getX();
            let dy = projectile.getY() - victim.getY();
            let dz = projectile.getZ() - victim.getZ();
            if (dx * dx + dy * dy + dz * dz > 9) continue;
            let owner = projectile.getOwner();
            if (owner != null && rebalanceIsAlly(victim, owner)) continue;
            projectile.discard();
        }
        victim.server.runCommandSilent('particle minecraft:cloud ' + victim.getX() + ' ' + (victim.getY() + 0.7) + ' ' + victim.getZ() + ' 3 0.1 3 0.08 50 force');
    } catch (e) { console.log('[异星陨石] 远程冲击波拦截失败: ' + e); }
}
