
let $Minecraft = Java.loadClass("net.minecraft.client.Minecraft").getInstance();
let isOpen = false; 
let syncedInspiration = 100;

NetworkEvents.dataReceived("insp_update", event => {
    let packet = event.data;
    syncedInspiration = packet.num;
    if (isOpen==true) renderInspirationScreen(event.player);
})

ClientEvents.tick(event => {
	let player = event.player;
    if ($Minecraft.screen==null || !$Minecraft.screen.getClass().getName().contains("GuiInstrument")) {
        if (isOpen==true) {
            hideInspirationScreen(player);
            isOpen = false;
        }
        return;
    }
    if (isOpen==false) {
        renderInspirationScreen(player);
        isOpen = true;
    }
})

function hsvToHex(h, s, v) {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    let hr = Math.round(r * 255).toString(16).padStart(2, '0');
    let hg = Math.round(g * 255).toString(16).padStart(2, '0');
    let hb = Math.round(b * 255).toString(16).padStart(2, '0');
    return `#ff${hr}${hg}${hb}`;
}

const spriteTbl = [
    {0: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {1: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {2: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {3: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {4: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {5: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {6: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {7: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {8: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {9: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {10: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {11: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {12: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {13: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {14: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {15: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {16: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {17: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {18: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
    {19: {visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9, z: -200, alignX: 'center', texture: 'lsd:textures/hud/inspired/base.png'}},
]
const bgTbl = [
    {20:{visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9,  z: -203, alignX: 'center', color: '#FF000000'}},
    {21:{visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9,  z: -202, alignX: 'center', color: '#ffffff'}},
    {22:{visible:true, type: 'rectangle', x: 0, draw: 'always', y:10, w: 9, h: 9,  z: -201, alignX: 'center', color: '#c6c6c6'}},
]

function hideInspirationScreen(player) {
    for (var i=0;i<spriteTbl.length;i++) {
        let id = Object.keys(spriteTbl[i])[0];
        let screenElement = spriteTbl[i][id];
        screenElement.visible = false;
        player.paint(spriteTbl[i]);
    }
    for (var i=0;i<bgTbl.length;i++) {
        let id = Object.keys(bgTbl[i])[0];
        let screenElement = bgTbl[i][id];
        screenElement.visible = false;
        player.paint(bgTbl[i]);
    }
}

function renderInspirationScreen(player) {
    let totalWidth = spriteTbl.length * 9;
    let startX = -(totalWidth / 2);
    let startY = 30;
    let bgBaseW = totalWidth + 2;
    let bgBaseH = 20;

    for (let i = 0; i < bgTbl.length; i++) { 
        let id = Object.keys(bgTbl[i])[0];
        let screenElement = bgTbl[i][id];
        screenElement.x = -4;  
        screenElement.y = 25+(2*i); 
        screenElement.w = bgBaseW+10 - (4 * i); 
        screenElement.h = bgBaseH - (4 * i); 
        screenElement.visible = true;
        player.paint(bgTbl[i]);
    }

    for (var i = 0; i < spriteTbl.length; i++) {
        let id = Object.keys(spriteTbl[i])[0];
        let xPos = startX + (i * 9);
        let yPos = startY;
        let screenElement = spriteTbl[i][id];
        let hue = (i / spriteTbl.length + (5/6)) % 1;
        let hexColor = hsvToHex(hue, 1.0, 1.0);
        screenElement.alignY = 'top';
        screenElement.x = xPos;
        screenElement.y = yPos;
        screenElement.color = hexColor;
        if (i<(syncedInspiration / 100) * spriteTbl.length) screenElement.visible = true;
        else screenElement.visible = false;
        player.paint(spriteTbl[i]);
    }
}