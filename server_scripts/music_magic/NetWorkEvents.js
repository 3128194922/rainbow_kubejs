// priority: 0
// ==========================================
// 🎵 音乐魔法网络事件处理脚本
// ==========================================

// 配置多个音乐序列 (乐器编号序列)
const Config_music_list = [
    { numbers: [0, 1, 7], alias: "democratic_save" }
];

// 接收 "music" 数据包：处理音乐演奏序列
NetworkEvents.dataReceived("music", (event) => {
    let music = event.data.music;
    let music_ = listTagToJSArray(music); // 转换为数字数组
    let player = event.getPlayer();

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
    if(match.alias == "democratic_save")
        {
            player.potionEffects.add("rainbow:democratic_save",SecoundToTick(2),0,false,false)
        }
});
