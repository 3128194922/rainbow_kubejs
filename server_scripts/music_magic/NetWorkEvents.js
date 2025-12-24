// 配置多个音乐序列
const Config_music_list = [
    { numbers: [0, 1, 2, 3, 7], alias: "sequenceOne" }
];

NetworkEvents.dataReceived("music", (event) => {
    let music = event.data.music;
    let music_ = listTagToJSArray(music); // number[]

    // 查找匹配的序列
    let match = Config_music_list.find(seq => {
        if (seq.numbers.length !== music_.length) return false;
        return seq.numbers.every((num, index) => num === music_[index]);
    });


    if(match == null)
        {
            return;
        }
    if(match.alias == "sequenceOne")
        {
            event.getPlayer().tell("你触发了集结令")
        }

});
