// priority: 0
// ==========================================
// 🎵 音乐魔法网络事件处理脚本
// ==========================================

// 配置多个音乐序列 (乐器编号序列)
const Config_music_list = [
    { numbers: [0, 1, 2, 3, 7], alias: "sequenceOne" }
];

// 接收 "music" 数据包：处理音乐演奏序列
NetworkEvents.dataReceived("music", (event) => {
    let music = event.data.music;
    let music_ = listTagToJSArray(music); // 转换为数字数组

    // 查找匹配的预定义序列
    let match = Config_music_list.find(seq => {
        if (seq.numbers.length !== music_.length) return false;
        return seq.numbers.every((num, index) => num === music_[index]);
    });


    if(match == null)
        {
            return;
        }
        
    // 如果匹配到 "sequenceOne" 序列
    if(match.alias == "sequenceOne")
        {
            event.getPlayer().tell("你触发了集结令")
            // 可以在此处添加更多魔法效果
        }

});
