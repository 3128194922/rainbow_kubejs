
const XercaMusic = Java.loadClass('xerca.xercamusic.common.XercaMusic').NETWORK_HANDLER
let $SingleNotePacket = Java.loadClass('xerca.xercamusic.common.packets.SingleNotePacket');
$SingleNotePacket = new $SingleNotePacket();
let $SingleNotePacketHandler = Java.loadClass('xerca.xercamusic.common.packets.SingleNotePacketHandler')
$SingleNotePacketHandler = new $SingleNotePacketHandler();


//Network override stuff. Here be dragons.
function encode(pkt, buf) {
    $SingleNotePacket.encode(pkt,buf)
}
function decode(pkt) {
    return $SingleNotePacket.decode(pkt);
}
function handle(message,ctx) {
    if (!message.isStop()) {
        //The below is likely not thread safe. Not sure how stable this is. Worked fine for me so far. ¯\_(ツ)_/¯
        //If you modify this, be very careful with what you modify in the netty thread(Or, in this function or any branching functions). Rhino *will* freeze and be very angry at you!
        const player = ctx.get().getSender();
        if (player.data.playedNotes==null) player.data.playedNotes = Array(maxNotes);
        const noteArray = player.data.playedNotes;
        noteArray.unshift(message.getNote());
        noteArray.pop();
    }
    $SingleNotePacketHandler.handle(message,ctx);
}
XercaMusic.registerMessage(3, $SingleNotePacket.class, encode, decode, handle); //Yay for wide open packet managers! Thanks Xercamusic!


//Short convenience things
function setInspiration(player, insp) {
    player.data.music.insp = insp;
    player.sendData('insp_update',{num: insp});
}
function doesArrayStartWith(startWithArray, arrayToFind) {
    for (var i=0;i<startWithArray.length; i++) {
        if (arrayToFind[i]!=startWithArray[i]) return false;
    }
    return true;
}
const XercaKeymap = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"] //This is currently only here to be a convenient showing of notes.
                //    Q   W    E   R   T    Y   U    I   O   P    [   ]
                //    1   2    3   4   5    6   7    8   9  10   11  12

const maxNotes = 12;

PlayerEvents.chat(event => { //This is just here for debugging. Should be removed later.
    if (event.message.contains(".recharge")) { 
        setInspiration(event.player,100);
        event.cancel();
    }
})
      


//The actual songs
const songs = [
    {
        keys: [3,1,9,3,1,9].reverse(), //Song of healing
        cost: 95,
        func: function(player) {
            const mobAABB = player.boundingBox.inflate(15);
            let found = 0;
            const ents = player.getLevel().getEntitiesWithin(mobAABB);
            for (var i=0;i<ents.length;i++) {
                const entity = ents[i];
                if (entity == null) continue;
                if (entity.getType()!="minecraft:zombie_villager") continue;
                if (found++>3) break;
                let tnbt = entity.getNbt();
                tnbt.putInt("ConversionTime",30*Math.floor((Math.random()*7)));
                entity.setNbt(tnbt);
            }
            if (found>0) return true;
            return false;
        }
    },
    {
        keys: [8,7,8,8,7,9,8].reverse(), //Water Theme (mario)
        cost: 60,
        sound: "minecraft:item.bucket.fill",
        func: function(player) {
            const mobAABB = player.boundingBox.inflate(15);
            const ents = player.level.getEntitiesWithin(mobAABB);
            let found = 0;
            console.log(ents)
            for (var i=0;i<ents.length;i++) {
                var entity = ents[i];
                if (entity == null) continue;
                if (entity.getType()!="minecraft:player") continue;
                entity.potionEffects.add("aquamirae:swim_speed", 20*60, 20, false, false);
                entity.tell(player.name.string+"s song granted you enhanced swimming for a minute.");
                found++;
            }
            if (found>0) return true;
            return false;
        },
    },
    {
        keys: [8,9,11,1,11,4].reverse(), //Pokeflute (Pokemon Snap)
        cost: 60,
        sound: "minecraft:item.bucket.fill",
        func: function(player) {
            const mobAABB = player.boundingBox.inflate(15);
            const ents = player.getLevel().getEntitiesWithin(mobAABB);
            let found = 0;
            for (var i=0;i<ents.length;i++) {
            }
            if (found>0) return true;
            return false;
        },
    },
    {
        keys: [11,6,9,3,7,6,4,3,4,11].reverse(), //Song of Wind (IoG)
        cost: 95,
        sound: "minecraft:item.bucket.fill",
        func: function(player) {
            const mobAABB = player.boundingBox.inflate(15);
            const ents = player.getLevel().getEntitiesWithin(mobAABB);
            let found = 0;
            for (var i=0;i<ents.length;i++) {
            }
            if (found>0) return true;
            return false;
        }
    }
];



          




///The fun magic.
PlayerEvents.tick(event => {
    const player = event.player;
    if (player.data.tickCount==null) player.data.tickCount=0;
    if (player.data.tickCount++%5!=1) return;
    checkForInspirationUpdate(player);
    if (player.data.music.insp==null) setInspiration(player,100);
    const insp = player.data.music.insp;
    const notes = player.data.playedNotes;
    if (notes==null) return;
    var noteList = []
    for (var i=0;i<notes.length;i++) { //Normalize the notes
        //let noteInOctave = ((note - 9) % 12);
        //let noteOctave = Math.floor((note - 9) / 12);
        noteList[i] = Math.floor((notes[i]-9)%12)+1;
    } 
    for (var i=0;i<songs.length;i++) {
        if (!doesArrayStartWith(songs[i].keys,noteList)) continue;
        player.data.playedNotes=Array(maxNotes);
        if (insp < songs[i].cost) {
            player.tell("You don't feel inspired enough.");
            break;
        }
        if (songs[i].func(player)) {
            let pname = player.name.string;
            if (songs[i].sound!=null) event.server.runCommandSilent("execute at " + pname + " run playsound "+songs[i].sound+" player @a ~ ~ ~");
            setInspiration(player,insp-songs[i].cost);
        }
    }
})
function checkForInspirationUpdate(player, insp) {
    const pdata = player.data;
    if (player.data.music==null) {
        pdata.music = {};
        let mdata = pdata.music;
        mdata.biome = player.block.boimeId;
        mdata.position = player.position();
        mdata.rain = player.getLevel().isRaining();
        mdata.pendingInsp = 0;
        mdata.dimension = player.getLevel().getDimension().getPath();
    }
    let mdata = pdata.music;
    //The players inspiration gets small boosts when...
    if (pdata.tickCount++%120==1) mdata.pendingInsp+=0.1; //..Time passes
    if (pdata.tickCount%3600==1 && mdata.biome!=player.block.biomeId) { //..New biomes are explored
        mdata.biome = player.block.biomeId;
        mdata.pendingInsp+=3.0;
    }
    if (pdata.tickCount%1200==1 && mdata.position.distanceTo(player.position())>32) { //..Moving around
        mdata.position = player.position();
        mdata.pendingInsp+=0.5;
    }
    if (pdata.tickCount%2400==1 && mdata.rain!=player.getLevel().isRaining()) { //..Experiencing a change in weather
        mdata.rain = player.getLevel().isRaining();
        mdata.pendingInsp+=2.5;
    }
    if (pdata.tickCount%2400==1 && mdata.dimension!=player.getLevel().getDimension().getPath()) { //..Exploring new dimensions
        mdata.dimension = player.getLevel().getDimension().getPath();
        mdata.pendingInsp+=2.5;
    }
    if (mdata.pendingInsp==0) return;
    insp+=mdata.pendingInsp;
    mdata.pendingInsp = 0;
    if (insp < 0) insp = 0;
    if (insp > 100) insp = 100;
    setInspiration(player,insp);
}