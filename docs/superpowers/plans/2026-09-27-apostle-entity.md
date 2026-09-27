# Apostle Entity Implementation Plan

> **For agentic workers:** Execute the approved design in this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Add a hostile EntityJS `rainbow:apostle` villager-variant entity with ranged danmaku and a Blockbench model.

**Architecture:** Register the mob and its visual resources in startup scripts; keep server-only target selection, spacing movement, and alternating projectile patterns in `server_scripts/apostle/main.js`. Use EntityJS projectiles with server-side hit filtering and retain the editable Blockbench source.

**Tech Stack:** Minecraft 1.20.1 Forge 47.4.20; KubeJS 2001.6.5; EntityJS 0.6.6; Rhino; GeckoLib-compatible geometry and PNG texture.

**Spec:** `docs/superpowers/specs/2026-09-27-apostle-entity-design.md`

## Global Constraints

- Use the installed KubeJS 6, EntityJS 0.6.6, Rhino, and Forge 1.20.1 APIs.
- Put all `Java.loadClass` calls only in matching lifecycle `CONST.js` files; remove leading `$` from loaded class variable names and deduplicate.
- Cross script lifecycle calls must use `global`; keep each lifecycle's functions inside its matching `apostle` directory with `main.js` entry point.
- Keep added/updated comments current, preserve all existing commented code exactly, and avoid optional chaining.
- Guard entity ticks and projectile callbacks with `try/catch` that logs failures; check `level.isClientSide()` explicitly and mutate/spawn projectiles only on the server.
- Keep all model/texture/export files under non-conflicting new paths in this workspace.

---

### Task 1: Add and integrate the Blockbench model

**Files:**
- Create: `assets/rainbow/geo/entity/apostle.geo.json`
- Create: `assets/rainbow/textures/entity/apostle.png`
- Create: `assets/rainbow/textures/item/apostle_bullet.png`
- Create: `model_sources/apostle/apostle.bbmodel`
- Create: `model_sources/apostle/apostle-preview.png`

**Interfaces:**
- Produces: EntityJS resources addressable as `rainbow:geo/entity/apostle.geo.json` and `rainbow:textures/entity/apostle.png`.

- [x] Resume the existing Blockbench project with the GPT-6-Astra model agent and confirm its export format is GeckoLib Bedrock geometry, not Java entity model JSON.
- [x] Finish the villager-proportioned robe, gold/ochre ornaments and crown from the user image, preserving readable pixel-art texture details.
- [x] Export geometry, texture, and editable project to the exact new paths above without replacing existing assets.
- [x] Inspect the saved files and report any format or preview limitations.

### Task 2: Register the apostle and its danmaku projectile

**Files:**
- Create: `startup_scripts/apostle/main.js`
- Modify: `startup_scripts/CONST.js` only if a missing Java class is required.

**Interfaces:**
- Produces: entity IDs `rainbow:apostle` and `rainbow:apostle_bullet`.
- Produces: server callback `global.apostleTick(entity)` consumed by the entity's startup builder callback.

- [x] Register `rainbow:apostle` as `entityjs:mob`, hostile category, dimensions matching a villager, visible through the geometry and texture paths from Task 1, and with a spawn egg.
- [x] Register a small EntityJS projectile that has an explicit lifetime, uses the new bullet visual resource, removes itself on block hit, and routes entity-hit resolution to a dedicated callback.
- [x] Add an EntityJS `createAttributes` handler that gives the apostle explicit max-health, movement-speed, follow-range, attack-damage, and armor values appropriate to a ranged hostile mob.
- [x] Delegate the apostle entity tick through the approved `global.apostleTick` entry while keeping callback errors logged.

### Task 3: Implement server-only target selection and distance control

**Files:**
- Create: `server_scripts/apostle/main.js`
- Modify: `server_scripts/CONST.js` only if a missing Java class is required.

**Interfaces:**
- Produces: `global.apostleTick(entity)` for startup registration.
- Produces: `global.apostleProjectileHit(projectile, target)` for startup projectile hit handling.

- [x] Define local helpers for valid target selection, distance, navigation destination, and projectile state using the script's `persistentData`; initialize state inside logged exception handling.
- [x] Select the nearest live player or `Monster` within 32 blocks; exclude the apostle and same-type apostle entities.
- [x] Maintain a 12–20 block combat band: retreat below 12, approach above 20, and strafe within the band; stop combat navigation when there is no valid target.
- [x] Handle navigation and target errors without allowing a single failure to terminate future entity ticks.

### Task 4: Implement alternating danmaku and collision damage

**Files:**
- Modify: `server_scripts/apostle/main.js`
- Modify: `startup_scripts/apostle/main.js` only where projectile callbacks need their final interface.

**Interfaces:**
- Consumes: `global.apostleTick(entity)` and `global.apostleProjectileHit(projectile, target)`.
- Produces: alternating 20-tick fan attack and delayed aimed attack; each bullet deals 2 health points and expires after 60 ticks.

- [x] Implement the Remilia-inspired fan by deriving a forward basis from the target direction and spawning a bounded spread of projectiles with a predictable angle range.
- [x] Implement the Kisin-inspired delayed shot by placing a harmless telegraph point near the target, storing a small pending-shot queue in apostle `persistentData`, then firing toward the target's current position after the delay.
- [x] Set projectile owner to the apostle; on impact damage only a live player or hostile `Monster`, excluding same type and owner; remove the projectile after a hit.
- [x] Keep the total bullets per volley bounded and ensure both patterns respect collision, lifetime, and server-side-only rules.

### Task 5: Update the project guide

**Files:**
- Modify: `README.md` under `## 自定义实体`.

**Interfaces:**
- Documents: apostle ID, villager-variant appearance, targeting/range rules, attack cycle, and registration implementation paths.

- [x] Add one concise row for `rainbow:apostle` and its two-attack cycle without changing unrelated README content.

### Task 6: Review the deliverable and report runtime limits

**Files:**
- Review all files created or modified in Tasks 1–5.

- [x] Inspect the final diff/file list and ensure no unrelated or pre-existing commented code changed.
- [x] Report what was implemented and state clearly that an in-game restart and real combat have not been confirmed unless they were actually performed.

