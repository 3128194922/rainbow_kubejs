// priority: 100
// Handle custom potion effects logic for Rainbow namespace

EntityEvents.hurt(event => {
    const { entity, source } = event
    const attacker = source.player
    
    // Only proceed if attacker is a player
    if (!attacker) return

    // Bitter Effect: Lower hunger -> Higher damage
    // Formula: +5% damage per missing food point. Max +100% at 0 food.
    if (attacker.hasEffect("rainbow:bitter")) {
        let foodLevel = attacker.foodLevel
        // foodLevel is 0-20.
        let missingFood = 20 - foodLevel
        if (missingFood > 0) {
            let bonusMultiplier = 1 + (missingFood * 0.05)
            event.damage = event.damage * bonusMultiplier
        }
    }

    // Knowledge Burst Effect: Higher XP -> Higher damage
    // Formula: +1% damage per XP level.
    if (attacker.hasEffect("rainbow:knowledge_burst")) {
        let xpLevel = attacker.xpLevel
        if (xpLevel > 0) {
            let bonusMultiplier = 1 + (xpLevel * 0.01)
            event.damage = event.damage * bonusMultiplier
        }
    }
})
