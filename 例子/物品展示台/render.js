// client_scripts

const { $Vec3 } = require("packages/net/minecraft/world/phys/$Vec3");
const { $Axis } = require("packages/com/mojang/math/$Axis");
const { $ItemStack } = require("packages/net/minecraft/world/item/$ItemStack");
const { $BlockPos } = require("packages/net/minecraft/core/$BlockPos");

let _Items = [{
    pos: "0_-71_0",
    item: Item.of("minecraft:air", 1)
}];
function _addItem(pos, item) {
    _removeItem("0_-71_0")
    const index = _Items.findIndex(i => i.pos === pos);
    if (index !== -1) {
        _Items[index].item = item; // Update existing item
    } else {
        _Items.push({ pos:pos, item:item }); // Add new item
    }
}

function _getItem(pos) {

    const item = _Items.find(i => i.pos === pos);
    return item ? item.item : null; // Return the item if found, otherwise null
}

function _setItem(pos, item) {
    _removeItem("0_-71_0")
    const index = _Items.findIndex(i => i.pos === pos);
    if (index !== -1) {
        _Items[index].item = item; // Update existing item
    } else {}
}

function _removeItem(pos) {
    const index = _Items.findIndex(i => i.pos === pos);
    if (index !== -1) {
        _Items.splice(index, 1); // Remove the item
    } else {}
}

NetworkEvents.dataReceived("pedestal", e => {
    const { level, data } = e;
    const pos2str = `${data.pos.x}_${data.pos.y}_${data.pos.z}`
    const itemData = data.entityData.attachments[0].items[0];
    if (!itemData || itemData.id === "minecraft:air") return;
    const itemStack = new $ItemStack(itemData.id, itemData.Count, itemData.tag);
    const itembool = _getItem(pos2str) == itemStack;
    itembool ? _setItem(pos2str, itemStack) : _addItem(pos2str, itemStack);
    _Items.forEach((z)=>{
        const pos = str2pos(z.pos);
        level.getBlock(pos).id != "kubejs:pedestal" && _removeItem(z.pos)
    })
});



RenderJSEvents.AddWorldRender((e)=>{
    console.log([_Items])
    e.addWorldRender((r)=>{
        _Items.forEach((_i)=>{
            const itemStack = _i.item;
            const _pos = str2pos(_i.pos);
            const camera = r.camera;
            const cameraX = camera.position.get("x");
            const cameraY = camera.position.get("y");
            const cameraZ = camera.position.get("z");
            const block = Client.level.getBlock(_pos);
            if (block.id == "kubejs:pedestal") {
                r.poseStack.pushPose();
                const pos = _n(_pos)
                const renderX = pos.x + 0.5;
                const renderY = pos.y + 1.25;
                const renderZ = pos.z + 0.5;
                r.poseStack.translate(renderX - cameraX, renderY - cameraY, renderZ - cameraZ);
                const time = Date.now();
                const angle = (time / 10) % 360;
                r.poseStack.mulPose($Axis.YP.rotationDegrees(angle));
                r.poseStack.scale(0.95, 0.95, 0.95);
                RenderJSWorldRender.renderItem(r.poseStack, itemStack, 15, 15, Client.level);
                r.poseStack.popPose();
            } else {
                _removeItem(_i.pos)
            }
        })    
    })
    
})

export const OTMapper = {
    NO_OVERLAY: 655360.0,
    NO_WHITE_U: 0.0,
    RED_OVERLAY_V: 3.0,
    WHITE_OVERLAY_V: 10.0
}

/**
 * 
 * @param {$Vec3} _pos 
 * @returns 
 */
function _n (_pos) {
    return { x: _pos.get("x"), y: _pos.get("y"), z: _pos.get("z") }
}

/**
 * 
 * @param {String} str 
 * @returns 
 */
const str2pos = (str) => {
    let _pos = str.split("_").map((e) => parseInt(e))
    return new $BlockPos(_pos[0], _pos[1], _pos[2])
}