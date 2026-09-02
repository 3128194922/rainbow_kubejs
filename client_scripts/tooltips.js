// priority: 500
// ==========================================
// 💡 物品提示信息脚本
// ==========================================@
// 引入原版工具类用于格式化时长
// MobEffectUtil 统一由 client_scripts/CONST.js 提供。

ItemEvents.tooltip(event => {
    // 使用标签过滤器匹配目标物品
    event.addAdvanced('#rainbow:food_tooltip', (item, advanced, text) => {
        
        const food = item.item.foodProperties
        if (!food) return;
        if(!item.item) return;
        if(item.item.hasTag('@dungeonsdelight')) return

        const effects = food.effects
        if (!effects || effects.isEmpty()) return
        
        // 设定插入索引：1 代表物品名称正下方
        // 这样可以确保效果显示在最显眼的位置，与 FD 逻辑一致
        let tooltipIndex = 1
        
        for (let i = 0; i < effects.size(); i++) {
            let effectPair = effects.get(i)
            let effectInstance = effectPair.first
            if (!effectInstance) continue
            
            let effectBase = effectInstance.getEffect()
            if (!effectBase) continue
            
            // 1. 获取基础名称 (例如: "安逸")
            let effectComponent = Text.translate(effectInstance.getDescriptionId())
            
            // 2. 处理等级 (Amplifier)
            if (effectInstance.getAmplifier() > 0) {
                effectComponent = Text.translate("potion.withAmplifier", effectComponent, Text.translate("potion.potency." + effectInstance.getAmplifier()))
            }
            
            // 3. 处理时长 (Duration)
            if (effectInstance.getDuration() > 20) {
                try {
                    let durationText = MobEffectUtil.formatDuration(effectInstance, 1.0)
                    effectComponent = Text.translate("potion.withDuration", effectComponent, durationText)
                } catch (e) {
                    let totalSeconds = Math.floor(effectInstance.getDuration() / 20)
                    let minutes = Math.floor(totalSeconds / 60)
                    let seconds = totalSeconds % 60
                    effectComponent = effectComponent.append(Text.of(` (${minutes}:${seconds < 10 ? '0' : ''}${seconds})`))
                }
            }
            
            // 4. 应用颜色样式并插入到指定位置
            let tooltipStyle = 'blue'
            try {
                tooltipStyle = effectBase.getCategory().getTooltipFormatting()
            } catch (e) {}
            
            // 使用 tooltipIndex++ 确保多个效果按顺序排列在顶部
            text.add(tooltipIndex++, effectComponent.withStyle(tooltipStyle))
        }
    })
})

//手套
ItemEvents.tooltip(event => {
    // 使用标签过滤器匹配目标物品
    event.addAdvanced('#rainbow:glove', (item, advanced, text) => {
        text.add(1, Text.gold("[手套]"))
    })
    // 末影之握：攻击时为目标附着末影火3秒
    event.addAdvanced('rainbow:ender_glove', (item, advanced, text) => {
        text.add(2, Text.aqua("▸ 攻击时为目标附着末影火 3秒"))
        text.add(3, Text.aqua("▸ 攻速>2时 +1 攻击伤害，否则 +3 攻击伤害"))
    })
    // 生灵之触：攻击时为目标附着生灵火3秒
    event.addAdvanced('rainbow:living_gauntlet', (item, advanced, text) => {
        text.add(2, Text.aqua("▸ 攻击时为目标附着生灵火 3秒"))
        text.add(3, Text.aqua("▸ 攻速>2时 +1 攻击伤害，否则 +3 攻击伤害"))
    })
    // 点金手套：攻击概率点金并冻结目标3秒
    event.addAdvanced('rainbow:gold_glove', (item, advanced, text) => {
        text.add(2, Text.aqua("▸ 攻击时概率将目标点金并冻结 3秒"))
        text.add(3, Text.aqua("▸ 概率 = 幸运值/25（幸运值需≥0，25幸运=100%）"))
        text.add(4, Text.aqua("▸ 攻速>2时 +1 攻击伤害，否则 +3 攻击伤害"))
    })
})

//物品介绍实例
ItemEvents.tooltip((event) => {
    //添加一个最普通的文本，这个文本是在最下面进行显示的
    //event.add('rainbow:super_mechanism', "这玩意好像用奇怪的东西合成...")
    //用数组添加文本，在游戏内数组的每个文本都独占一行
    //event.add('diamond', ["数组文本1","数组文本2"])
    //当你需要拼接字符串时可以使用下面方法
    //event.add('diamond', Text.of("该物品现属于").append(Client.player.username))
    //当你需要改变文本颜色时,只需要在后面添加一个颜色参数就可以
    //event.add('rainbow:super_mechanism', Text.of("上面显示的名字：").append(Client.player.username).red())
})

ItemEvents.tooltip((event) => {
    event.addAdvanced("rainbow:eldritch_pan", (item, advanced, text) => {
        if (item.nbt.foodnumber < 3 || !item.nbt.foodnumber) {
            text.add(0, "饕餮之锅");
        }
        else {
            text.add(0, "饕餮之锅");
        }
        text.add(1, Text.gold("已食用食物数:").append(Text.yellow(`${item.nbt.foodnumber}`)));
    })
    /*event.addAdvanced("rainbow:eldritch_sword", (item, advanced, text) => {
        text.add(0, Text.aqua("饕餮剑"));
        let count = item.nbt ? (item.nbt.swordnumber || 0) : 0;
        text.add(1, Text.red("已吞噬剑数:").append(Text.yellow(`${count}`)));
    })*/
    event.addAdvanced('rainbow:berserk_emblem', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("消耗的心之容器越多，加成越高"));
            text.add(2, Text.aqua("每个空容器(半颗心)："));
            text.add(3, Text.aqua("+0.8 攻击伤害 / +1.5 护甲"));
            text.add(4, Text.aqua("攻击半血以下的实体伤害翻倍"));
        }
    })
    /*event.addAdvanced('rainbow:resilience_syringe', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("显示[肾上腺素]条,开启肾上腺素系统"));
            text.add(2, Text.aqua(`开启后启动肾上腺素`));
        }
    })
    event.addAdvanced('rainbow:rage_syringe', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("显示[暴怒]条,开启化学内爆系统"));
            text.add(2, Text.aqua(`开启后启动化学内爆`));
        }
    })*/
    event.addAdvanced('rainbow:dice', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("击杀生物时，随机减少主副手与饰品栏中"));
            text.add(2, Text.aqua("处于冷却物品当前剩余冷却的 0%~25%"));
            text.add(3, Text.aqua("触发后有 5 秒冷却"));
            text.add(4, Text.aqua("暴击率 = 幸运值/25（幸运25=100%暴击）"));
            text.add(5, Text.aqua("暴击使减少的百分比×2"));
            text.add(6, Text.gold("骰子的嘲弄：即使摇出 0%，依旧会暴击"));
            text.add(7, Text.darkGray("搏一搏，单车变宝马！"));
        }
    })
    event.addAdvanced('tide:fishing_journal', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("鱼类图鉴解锁进度 → 幸运加成"));
            text.add(2, Text.aqua(`幸运 = 解锁比例×25（100%解锁 = +25幸运）`));
        }
    })
    /*event.addAdvanced('rainbow:daawnlight_spirit_origin', (item, advanced, text) => {
        text.add(1, Text.aqua("每10s标记周围实体,被标记实体受到远程伤害翻倍"));
    })*/
    event.addAdvanced('rainbow:mining_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("+3时运"));
        text.add(2, Text.aqua("高亮显示附近的战利品箱子"));
    })
    event.addAdvanced('rainbow:wind', (item, advanced, text) => {
        text.add(1, Text.aqua("获取灵魂汲取buff"));
    })
    event.addAdvanced('rainbow:weapon_master_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("根据手持武器攻速的不同提供不同加成"));
    })
    event.addAdvanced('rainbow:hungry_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("佩戴后会依据当下的饥饿值提供增益"));
    })
    event.addAdvanced('rainbow:soul_diamond', (item, advanced, text) => {
        text.add(1, Text.aqua(`开启后释放心灵墙`));
    })
    event.addAdvanced('rainbow:bottled_lightning', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸被动：攻击触发链式闪电，连锁5（雨天连锁10）"));
            text.add(2, Text.aqua("▸主动：召唤雷云风暴，5秒内对周围敌人持续落雷"));
            text.add(3, Text.aqua("  并施加漂浮效果，冷却30秒"));
        }
    })
    event.addAdvanced('windswept:dream_catcher', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸主动：进入灵体状态3秒，可穿墙逃生"));
            text.add(2, Text.aqua("  时间结束后返回生存模式，冷却10秒"));
        }
    })
    event.addAdvanced('rainbow:cactus', (item, advanced, text) => {
        text.add(1, Text.aqua("每30s恢复1饥饿值"));
    })
    event.addAdvanced('rainbow:big_stomach', (item, advanced, text) => {
      text.add(1, Text.gray("按[SHIFT]查看详细"));
      if (event.shift) {
        text.remove(1)
        text.add(1, Text.aqua("▸ 食用/饮用速度 +50%"));
        text.add(2, Text.aqua("▸ 饱食度满仍可进食"));
        text.add(3, Text.aqua("▸ 受伤时以饱和度抵消伤害"));
        text.add(4, Text.darkGray("我好吃个蜜汁火腿，烤鸡这一块~"));
      }
    })
    event.addAdvanced('gimmethat:moai_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("生物碰撞箱对你无影响"));
        text.add(Text.darkGray("**Third-Party Licenses**"))
        text.add(Text.darkGray("MIT License"))
        text.add(Text.darkGray("Project: demis-enigmatic-dice"))
    })
    event.addAdvanced(['rainbow:adventure_charm'], (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
          text.remove(1)
          text.add(1, Text.aqua("佩戴后放置方块将受限制"));
          text.add(2, Text.aqua("佩戴极限之证时本饰品不生效"));
          }
    })
    event.addAdvanced('rainbow:the_wafer', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("减免10%所受伤害"));
            text.add(2, Text.aqua("延长无敌帧至1.5s"));
        }
    })
    event.addAdvanced(['rainbow:despair_insignia'], (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
          text.remove(1)
          text.add(1, Text.aqua("幸运 -25，抢夺 +3，时运 +3"));
          text.add(2, Text.aqua("经验获取 +400%，护甲与护甲韧性 -50%"));
          text.add(3, Text.red("全属性伤害 -50%"));
          text.add(4, Text.darkGray("高风险，高回报"));
          }
    })
    event.addAdvanced('rainbow:gluttony_charm', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("根据你当前所损失的饥饿值百分比获得加成"));
            text.add(2, Text.aqua("佩戴该护符时免疫饥饿所造成的伤害"));
            //text.add(3, Text.red("联动血战沙场之证"));
        }
    })
    /*event.addAdvanced('rainbow:golden_piggy_charm', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("猪灵不会攻击你"));
            text.add(2, Text.aqua("无敌帧延长到2s"));
        }
    })*/
    event.addAdvanced('rainbow:monster_meat', (item, advanced, text) => {
        text.remove(0)
        if (Client.player && Client.player.hasEffect('rainbow:monster')) {
            text.add(0, "人肉");
        } else {
            text.add(0, "怪肉");
        }
    })
    event.addAdvanced('legendary_monsters:the_great_frost', (item, advanced, text) => {
            text.add(3, Text.gold("特殊能力3:").append(Text.aqua("对水生和着火生物伤害+50%")));
            text.add(4, Text.gold("特殊能力4:").append(Text.aqua("攻击附加冻结")));
    })
    /*event.addAdvanced('rainbow:musical_score', (item, advanced, text) => {
        if(item.nbt == null) return;
        if (item.nbt.music != null && item.nbt.music.length > 0) {
            // 数字下标对应的中文名称
            let IDs = ['沉思', '歌颂', '寻匿', '感受', '仰慕', '呼唤', '憧憬', '想象'];
    
            // 拼接显示字符串
            let musicNames = item.nbt.music.map(num => {
                if (num >= 0 && num < IDs.length) {
                    return IDs[num];
                } else {
                    return "未知"; // 避免越界
                }
            }).join(" → "); // 用箭头连接多个乐曲
    
            // 添加到显示文本中
            text.add(1, Text.gold("当前乐曲: ").append(Text.gray(musicNames)));
        }
    })*/
    event.addAdvanced('rainbow:reload_core', (item, advanced, text) => {
        text.add(1, Text.aqua(`盾反时霰弹炮冷却 -33%`));
        text.add(2, Text.aqua(`主动：10秒内霰弹炮冷却立即取消，最多3次`));
        text.add(3, Text.darkGray("已经在换弹啦~"));
    })
    /*event.addAdvanced('rainbow:lyre', (item, advanced, text) => {
        text.add(1, Text.aqua(`取消号角CD`));
    })*/

    event.addAdvanced('rainbow:sharpshooter_charm', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("远程攻击时，距离目标每格提升10%伤害"));
            text.add(2, Text.aqua("最高提升200%伤害（20格）"));
        }
    })

    // 装填核心已移除能量充能机制，不再显示能量条；连射核心保留
    event.addAdvanced('rainbow:short_core', (item, advanced, text) => {
        let energy = item.nbt ? (item.nbt.getFloat("Energy") || 0) : 0;
        let color = energy >= 100 ? "§a" : "§e";
        text.add(1, Text.of(`当前能量: ${color}${energy.toFixed(1)} / 100.0`));
    })

    // 狂怒面具：显示受伤充能与饰品NBT中保存的下一次音调进度
    event.addAdvanced('rainbow:fury_mask', (item, advanced, text) => {
        let energy = 0;
        let pitch = 1.0;
        try {
            if (item.nbt != null) {
                energy = item.nbt.getFloat("Energy") || 0;
                pitch = item.nbt.getFloat("FuryPitch") || 1.0;
            }
        } catch (e) {
            console.log("[狂怒面具提示] 读取怒气或音调出错: " + e);
        }
        energy = Math.max(0, Math.min(10, energy));
        pitch = Math.max(1.0, Math.min(2.0, pitch));
        let energyColor = energy >= 10 ? "§a" : "§e";
        let pitchColor = pitch >= 2.0 ? "§a" : "§6";
        text.add(1, Text.of(`当前怒气: ${energyColor}${energy.toFixed(1)} / 10.0`));
        text.add(2, Text.of(`下次音调: ${pitchColor}${pitch.toFixed(1)} / 2.0`));
        text.add(3, Text.aqua(`受到伤害累计充能，满10点进入狂怒状态（持续11秒，冷却5秒）`));
        text.add(4, Text.aqua(`狂怒期间每次攻击回复5血，非跳劈暴击额外回复20血`));
        text.add(5, Text.gold(`触发音效会逐次升调，达到最高音调后重置`));
    })

    // 葵花宝典：提示治疗代价、生命伤害和翻滚后的单次免伤
    event.addAdvanced('rainbow:fist_of_seven_wounds', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.red("受到治疗效果 -100%"));
            text.add(2, Text.aqua("佩戴时：每次翻滚后免疫下一次伤害"));
            text.add(3, Text.darkGray("天下武功，唯快不破"));
        }
    })

    const machine_name ={
        'mbd2:nuke_machine': "核弹发射井",
    }

    event.addAdvanced('rainbow:beacon_ball', (item, advanced, text) => {
        if(!item.nbt) return;
        text.add(1, Text.gold(`绑定坐标：`).append(Text.yellow(`X:${item.nbt.getInt("X")} Y:${item.nbt.getInt("Y")} Z:${item.nbt.getInt("Z")}`)));
        text.add(1, Text.gold(`绑定机器：`).append(Text.yellow(`${machine_name[item.nbt.getString("MACHINE")]}`)));
    })
    event.addAdvanced('rainbow:phantom_body', (item, advanced, text) => {
        text.add(1, Text.aqua(`触发烛心面具模仿生物的主动技能`));
    })
    event.addAdvanced('rainbow:lilith_hug', (item, advanced, text) => {
        text.add(1, Text.aqua(`你将变为吸血鬼`));
        text.add(2, Text.red(`那么代价呢？`));
    })
    event.addAdvanced('rainbow:cruncher_charm', (item, advanced, text) => {
      // 读取贪咀护符的进食任务数据（服务器同步的饰品 NBT，PlayerTick 每秒刷新）
      let foodId = null;
      let taskDone = false;
      let streak = 0;
      let remaining = -1;
      if (item.nbt != null && item.nbt.contains("cc_epoch")) {
        foodId = item.nbt.getString("cc_food");
        taskDone = item.nbt.getBoolean("cc_done");
        streak = item.nbt.getInt("cc_streak");
        if (item.nbt.contains("cc_remaining")) {
          remaining = item.nbt.getInt("cc_remaining");
        }
      }
      // 非SHIFT：显示当期想吃食物；未初始化时提示佩戴开启任务
      text.add(1, Text.gray("按[SHIFT]查看详细"));
      text.add(2, Text.gray("佩戴后开启进食任务"));
      if (event.shift) {
        text.remove(1)
        text.remove(2)
        text.add(1, Text.aqua("▸ 每2秒消耗2饥饿回复2生命（需生命未满且饥饿过半）"));
        text.add(2, Text.aqua("▸ 每2个游戏日想吃一种食物"));
        text.add(3, Text.aqua("▸ 连续完成10个任务进化为大胃袋"));
        let line = 4;
        if (foodId != null && foodId != "") {
          text.add(line, Text.gold("目标食物：").append(Text.gold(Item.of(foodId).getDisplayName().getString())));
          line++;
          text.add(line, Text.gray(foodId));
          line++;
          if (taskDone) {
            text.add(line, Text.green("状态：已完成本轮进食"));
          } else {
            text.add(line, Text.yellow("状态：尚未吃到指定食物"));
          }
          line++;
        } else {
          text.add(line, Text.gray("还未开启进食任务"));
          line++;
        }
        // 距下次换食的剩余时间（cc_remaining 由服务器 PlayerTick 写入）
        if (remaining >= 0) {
          if (remaining <= 0) {
            text.add(line, Text.aqua("即将换食"));
          } else {
            let days = Math.floor(remaining / 24000);
            let hours = Math.floor((remaining % 24000) / 1000);
            text.add(line, Text.aqua("距下次换食：约 " + days + " 游戏日 " + hours + " 小时"));
          }
          line++;
        }
        text.add(line, Text.aqua("任务进度：").append(Text.gold("" + streak)).append(Text.aqua("/10")));
        line++;
      }
    })
    event.addAdvanced('rainbow:eye_of_satori', (item, advanced, text) => {
        text.add(1, Text.gold("开眼: ").append(Text.aqua("蹲下时相机跟随准心实体")));
        text.add(2, Text.gold("闭眼: ").append(Text.aqua("降低被怪物发现的概率")));
    })
    /*event.addAdvanced('rainbow:musical_score', (item, advanced, text) => {
        text.add(1, Text.gold("记录: ").append(Text.gray("拿在副手吹响号角进行记录，如果形成完整乐谱可以右键释放对应魔法")));
    })*/
    event.addAdvanced('rainbow:soul_diamond_ctroller_detention', (item, advanced, text) => {
        text.add(1, Text.aqua(`右键回收被脑控的佣兵生物`));
    })
    event.addAdvanced('rainbow:purified_cloth', (item, advanced, text) => {
        text.add(1, Text.aqua(`长按右键擦掉副手物品的诅咒附魔`));
    })
    event.addAdvanced('create_fantasizing:tree_cutter', (item, advanced, text) => {
        text.add(1, Text.aqua(`在有气罐气体情况下消耗10气体额外造成6伤害`));
    })
    event.addAdvanced('rainbow:chronos', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("右键：返回前5s的位置和血量"));
            text.add(2, Text.aqua("在结构内可以直接重置结构"));
            text.add(3, Text.aqua("潜行右键：以自身为中心半径8格区域时间停止（持续5秒）"));
        }
    })
    event.addAdvanced('rainbow:ancientaegis', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("右键绑定在线玩家"));
            text.add(2, Text.aqua("你受到的伤害将转移到对应在线玩家身上"));
            let uuidText = ""
            if (item.nbt != null) uuidText = item.nbt.getString("UUID")
            text.add(3, Text.gold("绑定对象ID: ").append(Text.yellow(String(uuidText))));
        }
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
    })
    /*event.addAdvanced('rainbow:luoyang_shovel', (item, advanced, text) => {
        text.add(1, Text.aqua("右键可直接提取出考古物品"));
    })*/
    event.addAdvanced('rainbow:oceantooth_necklace', (item, advanced, text) => {
        text.add(1, Text.gray("与狱牙吊坠互斥"));
        if (item.getMaxDamage && item.getDamage) {
            let dmg = item.getDamage();
            let maxDmg = item.getMaxDamage();
            text.add(Text.aqua("耐久：").append(Text.yellow(`${maxDmg - dmg} / ${maxDmg}`)));
        }
    })
    event.addAdvanced('rainbow:infernotooth_necklace', (item, advanced, text) => {
        text.add(1, Text.gray("与海牙吊坠互斥"));
    })
    event.addAdvanced('rainbow:dead_river', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        let nbt = item.getNbt();
        let souls = nbt !== null ? nbt.getInt("Souls") : 0;
        text.add(2, Text.aqua("灵魂：").append(Text.yellow(`${souls}`)));
        if (event.shift) {
            text.remove(1)
            text.remove(2)
            text.add(1, Text.aqua("击杀生物储存灵魂"));
            text.add(2, Text.aqua("技能：释放所有灵魂召唤幽魂护卫"));
            text.add(3, Text.aqua("消耗3：壮硕幽魂 (高血高攻)"));
            text.add(4, Text.aqua("消耗2：悍将幽魂 (冲刺破盾)"));
            text.add(5, Text.aqua("消耗1：引导幽魂 (均衡型)"));
            text.add(6, Text.aqua("优先召唤高消耗变种"));
            text.add(7, Text.aqua("配合莉莉丝之拥可消耗灵魂免死一次"));
            text.add(8, Text.gray("手持 spectralibur 时每秒转移1灵魂"));
            text.add(9, Text.darkGray("拘束制御术式 零 解"));
        }
    })
    event.addAdvanced('rainbow:baseball_bat', (item, advanced, text) => {
        // 先判断 NBT 是否存在
        text.add(1, Text.gold(`[未激活]`));
    })
    event.addAdvanced('rainbow:baseball_power', (item, advanced, text) => {
        // 先判断 NBT 是否存在
        text.add(1, Text.gold("能量：").append(Text.yellow("0")));
        let nbt = item.getNbt();
        if (!nbt) {
            return;
        }
        else
        {
            text.remove(1)
            text.add(1, Text.gold("能量：").append(Text.yellow(`${nbt.getInt("Power")}`)));
        }
    })
    event.addAdvanced('rainbow:amber_bee', (item, advanced, text) => {
        text.add(1, Text.gray("按 [ALT] 查看详细"));

        if (event.alt) {
            text.remove(1);

            const nbt = item.getNbt();
            if (!nbt || !nbt.contains('extracted_gene')) {
                text.add(1, Text.gray("❌ 无基因信息"));
                return;
            }

            let geneId = nbt.getString('extracted_gene');

            // 解析双字符基因: char[0](显性) + char[1](隐性)
            if (geneId && geneId.length === 2) {
                text.add(1, Text.gold("基因: ").append(Text.yellow(`${geneId}`)));
                text.add(1, Text.gray(`- 显性: ${geneId.charAt(0)}, 隐性: ${geneId.charAt(1)}`));
            } else if (geneId) {
                text.add(1, Text.gold("基因: ").append(Text.yellow(`${geneId}`)));
            }

            // 显示基因属性效果
            if (global.GeneEffectMap && global.GeneEffectMap[geneId]) {
                let effect = global.GeneEffectMap[geneId];
                let opLabel = effect.OPERATION === "addition" ? "+" : "×";
                text.add(1, Text.gray(`效果: ${effect.attribute} ${opLabel}${effect.NUMBER}`));
            } else if (geneId) {
                text.add(1, Text.gray("该基因无特殊效果"));
            }
        }
    });
    event.addAdvanced('rainbow:365_exe', (item, advanced, text) => {
        text.add(1, Text.aqua(`根据剩余的义体容量提供加成`));
    })
    event.addAdvanced('rainbow:biological_monitoring', (item, advanced, text) => {
        text.add(1, Text.aqua(`当你血量低于最大生命值25%时立刻回满血量`));
    })
    event.addAdvanced('rainbow:cyber_nerve_cpu', (item, advanced, text) => {
        text.add(1, Text.gold(`[义体前置]`));
    })
    event.addAdvanced('rainbow:soul_hex_block', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("标记5格内非玩家实体"));
            text.add(2, Text.aqua("标记实体获得油漆层视觉提示"));
            text.add(3, Text.aqua("击杀标记实体可获得特殊掉落物"));
        }
    })
    event.addAdvanced('rainbow:docker', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("通用型物品传输方块，支持6种模式"));
            text.add(2, Text.aqua("模式0-2: 将容器物品转移到玩家身上"));
            text.add(3, Text.aqua("模式3-5: 将玩家背包映射到容器(实时同步)"));
            text.add(4, Text.aqua("潜行右键切换模式，需绑定玩家"));
        }
    })
    event.addAdvanced('rainbow:docker_nether_on', (item, advanced, text) => {
        text.add(1, Text.aqua(`收集附近的唱片机音乐，产生下界之音`));
    })
    event.addAdvanced(['alexscaves:hazmat_mask','alexscaves:hazmat_chestplate','alexscaves:hazmat_leggings' ,'alexscaves:hazmat_boots'], (item, advanced, text) => {
        text.add(1, Text.gold(`穿戴全套防化服时`));
        text.add(2, Text.aqua(`免疫中毒、凋零、辐照效果和伤害`));
    })
    event.addAdvanced('rainbow:treasure_necklace', (item, advanced, text) => {
        text.add(1, Text.aqua("击杀生物积累能量，满100后消耗耐久产出战利品"));
        let nbt = item.getNbt();
        if (!nbt) return;
        text.add(2, Text.aqua("能量：").append(Text.yellow(`${nbt.getInt("kill")} / 100`)));
    })
    event.addAdvanced('rainbow:sculk_affinity', (item, advanced, text) => {
        text.add(1, Text.aqua("站在幽匿方块上时获得"));
        text.add(2, Text.aqua("+20% 移动速度"));
        text.add(3, Text.aqua("每秒恢复 10 点生命值"));
        text.add(4, Text.aqua("监守者不会攻击你"));
    })
    event.addAdvanced('rainbow:ccb', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("右键生物骑乘，控制其移动与攻击"));
            text.add(2, Text.aqua("为坐骑提供 +20血量 / +10护甲 / +5攻击"));
            text.add(3, Text.red("无法骑乘凋灵和末影龙"));
        }
    })
    event.addAdvanced('rainbow:the_bible', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("根据穿戴的纹饰盔甲数量提供伤害抵消"));
            text.add(2, Text.aqua("每件纹饰盔甲抵消 1 点伤害（最多 4 件）"));
            text.add(3, Text.aqua("受到伤害最低为 0"));
            text.add(4, Text.gold("技能：释放圣经之力"));
            text.add(5, Text.aqua("向外扩散金色冲击波"));
            text.add(6, Text.aqua("推开周围实体"));
            text.add(7, Text.aqua("每次脉冲恢复 100 血量"));
            text.add(8, Text.darkGray("天主和帝皇"));
        }
    })
    event.addAdvanced('rainbow:mini_moon', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("释放引力场牵引周围生物并造成伤害"));
            text.add(2, Text.aqua("潜行释放则推开周围生物"));
        }
    })
    event.addAdvanced('rainbow:sprite', (item, advanced, text) => {
        text.add(1, Text.aqua("移动时获得"));
        text.add(2, Text.aqua("+10 护甲 / +3 攻击 / +50% 击退抗性"));
    })
    event.addAdvanced('rainbow:curse_crown', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("根据主副手与盔甲栏每个诅咒附魔提供加成"));
            text.add(2, Text.aqua("每诅咒：+4% 暴击率 / +8% 暴击伤害 / -1 幸运"));
        }
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
    })
    event.addAdvanced('rainbow:clawofhorus', (item, advanced, text) => {
        text.add(1, Text.aqua("隐匿时获得暴击率与暴击伤害加成"));
    })
    event.addAdvanced('rainbow:sharingan', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("极限闪避或盾反成功时，洞察破绽"));
            text.add(2, Text.aqua("▸ 恢复主副手与饰品栏中物品的冷却"));
            text.add(3, Text.aqua("▸ 每次减少该物品当前剩余冷却的 25%"));
            text.add(4, Text.darkGray("你那双写轮眼，究竟能看多远？"));
        }
    })
    event.addAdvanced('rainbow:shiny_stone', (item, advanced, text) => {
        text.add(1, Text.aqua("不移动时每秒恢复4点生命值"));
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
    })
    // 心之项链（功能见 startup_scripts/Registry/Registry_curios.js）
    event.addAdvanced('rainbow:necklace_of_heart', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 最大生命值 +4（2颗心）"));
            text.add(2, Text.aqua("▸ 每2秒自动恢复 1 点生命值"));
        }
    })
    event.addAdvanced('rainbow:dark_sun_ring', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("火焰/岩浆伤害有概率转化为治疗"));
            text.add(2, Text.aqua("小于10的伤害有概率完全抵消"));
            text.add(3, Text.gold("以上效果均受幸运值影响"));
        }
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
    })
    event.addAdvanced('rainbow:lucky_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("获得幸运值加成"));
    })
    event.addAdvanced('rainbow:hero_charm', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("根据手持武器的攻击速度提供加成"));
            text.add(2, Text.aqua("慢速武器：护甲穿透 +150%"));
            text.add(3, Text.aqua("快速武器：额外 +3 攻击伤害"));
        }
    })
    event.addAdvanced('rainbow:gravity_core', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("空中潜行快速下坠，落地造成范围伤害"));
            text.add(2, Text.aqua("动能伤害越高，践踏伤害越高"));
        }
    })
    event.addAdvanced('species:kinetic_core', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("受到伤害时触发范围动能爆破"));
            text.add(2, Text.aqua("爆破伤害与范围随受伤值动态提升"));
        }
    })
    event.addAdvanced('rainbow:giants_ring', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("碰撞体积变大 1.5 倍"));
            text.add(2, Text.aqua("冲刺时对比自己小的生物造成踩踏伤害"));
        }
        text.add(Text.darkGray("美术资源：Demi's Enigmatic Dice"));
    })
    event.addAdvanced('rainbow:libra', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("攻击时交换双方所有药水效果"));
            text.add(2, Text.aqua("你的效果复制给目标，目标的效果复制给你"));
        }
    })
    event.addAdvanced('rainbow:cloud_boots', (item, advanced, text) => {
        text.add(1, Text.aqua("免疫摔落伤害"));
    })
    event.addAdvanced('rainbow:moai_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("生物碰撞箱对你无影响"));
        text.add(2, Text.aqua("100% 击退抗性"));
        text.add(3, Text.darkGray("美术资源：Demi's Enigmatic Dice"));
    })
    event.addAdvanced('rainbow:chaos_core', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("受到伤害乘以 [0.0 ~ 2.0] 倍率"));
            text.add(2, Text.aqua("概率反弹伤害给攻击者"));
            text.add(3, Text.gold("以上效果均受幸运值影响"));
        }
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
    })
    event.addAdvanced('rainbow:luban_lock', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("空手右键捕获上方3×3×3结构"));
            text.add(2, Text.aqua("破坏后保留结构到物品"));
            text.add(3, Text.aqua("放置时自动还原结构，含方块实体"));
        }
    })
    event.addAdvanced('rainbow:ender_air', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("穿戴盔甲且进入隐匿状态"));
            text.add(2, Text.aqua("隐匿时每件盔甲提供 4% 伤害加成"));
            text.add(3, Text.darkGray("据说闻起来像葡萄汁"));
        }
    })
    // 鸦羽骨哨：实际效果见 server_scripts/curios_skill_system/Skillwheel.js 的 registerSkill('rainbow:whistle')（主动技能：20秒范围内敌人攻击伤害降低50%，半径8格，自动排除友军）
    event.addAdvanced('rainbow:whistle', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("主动技能：开启后 10 秒内，以自身为中心"));
            text.add(2, Text.aqua("半径 8 格内的敌人攻击伤害降低 50%"));
            text.add(3, Text.aqua("领域自动排除友军（已驯服宠物/佣兵）"));
            text.add(4, Text.aqua("半透明黑雾显示领域影响范围"));
            text.add(5, Text.red("素材版权警告，需要验证版权问题"));
        }
    })
    event.addAdvanced('rainbow:tyrfing', (item, advanced, text) => {
        text.add(Text.darkGray("美术资源：Embers Rekindled"))
    })
    event.addAdvanced('rainbow:hand_of_scratches', (item, advanced, text) => {
        text.add(Text.aqua("攻击额外触发最大生命值5%伤害，冷却5s"))
    })
    event.addAdvanced('rainbow:super_hormone', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("主动技能：全局时间减缓 80%（10秒）"));
            text.add(2, Text.aqua("恢复 1000 点生命值 + 迅捷 II"));
            text.add(3, Text.gold("触发时视角边缘闪耀金光"));
            text.add(4, Text.gray("冷却 30 秒"));
        }
    })
    //巫毒女巫锅
    event.addAdvanced('mysticartifacts:witch_pot', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("攻击者每有一个负面药水效果"));
            text.add(2, Text.aqua("减少对该攻击者所受伤害的 4%"));
            text.add(3, Text.gold("最高减免 100%"));
        }
    })
    //滴水兽
    event.addAdvanced('oreganized:gargoyle', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("站立不动时提供 +30 盔甲值"));
            text.add(2, Text.aqua("移动时盔甲加成消失"));
        }
    })
    // 吐根酊
    event.addAdvanced('rainbow:lpecac', (item, advanced, text) => {
        text.add(1, Text.aqua("攻击时在目标位置产生爆炸"));
        text.add(2, Text.aqua("爆炸不破坏方块，强度由 boom_damage 决定"));
    })
    // 腐烂之心
    event.addAdvanced('rainbow:rotten_heart', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("血量≤20时，每少1点血量"));
            text.add(2, Text.aqua("提升 1 点血量上限"));
            text.add(3, Text.aqua("血量>20时加成失效"));
        }
    })
    // 乌鸦之心
    /*event.addAdvanced('rainbow:crow_heart', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("消耗的心之容器越多，加成越高"));
            text.add(2, Text.aqua("每个空容器(半颗心)："));
            text.add(3, Text.aqua("+0.8 攻击伤害 / +1.5 护甲"));
        }
    })*/
    // ==========================================
    // ✨ MysticArtifacts 奇器玄兵 物品介绍
    // ==========================================
    // 超薄橡胶
    event.addAdvanced('mysticartifacts:rubber', (item, advanced, text) => {
        text.add(1, Text.aqua("超薄橡胶，用于合成民主(绝地潜兵)防具"));
    })
    // 幽匿箭
    event.addAdvanced('mysticartifacts:sculk_arrow', (item, advanced, text) => {
        text.add(1, Text.aqua("追猎 6 格内移动中的生物并自动转向命中"));
        text.add(2, Text.gray("无法回收"));
    })
    // 虚空箭
    event.addAdvanced('mysticartifacts:void_arrow', (item, advanced, text) => {
        text.add(1, Text.aqua("无重力恒定高速飞行，贯穿所有生物(穿刺127)"));
        text.add(2, Text.gray("5秒后消散，命中的箭可回收"));
    })
    // 占卜者之石
    event.addAdvanced('mysticartifacts:tracking_arrow', (item, advanced, text) => {
        text.add(1, Text.red("右键消耗自身2点生命(≤2血直接死亡)"));
        text.add(2, Text.aqua("环绕身边旋转，自动索敌并撞击最近目标"));
        text.add(3, Text.aqua("每次撞击造成 8 点伤害"));
    })
    // 绝密(Helldiver)防具套装
    event.addAdvanced(['mysticartifacts:democracy_helmet', 'mysticartifacts:democracy_chestplate', 'mysticartifacts:democracy_leggings', 'mysticartifacts:democracy_boots'], (item, advanced, text) => {
        text.add(1, Text.aqua("绝地潜兵战术护甲(防御 6/11/9/6)"));
        text.add(2, Text.aqua("韧性 +4，使用超薄橡胶修复"));
    })
    // 下界之音
    event.addAdvanced('mysticartifacts:nether_of_voice', (item, advanced, text) => {
        text.add(1, Text.aqua("右键释放：飞行中持续转向准星方向"));
        text.add(2, Text.aqua("命中造成 10 点伤害，命中后停止追踪"));
    })
    // 空爆箭
    event.addAdvanced('mysticartifacts:airburst_arrow', (item, advanced, text) => {
        text.add(1, Text.aqua("接近敌人3米内自动引爆"));
        text.add(2, Text.aqua("散射 12(±8) 枚空爆I小型箭"));
    })
    // 空爆I
    event.addAdvanced('mysticartifacts:exploding_arrow', (item, advanced, text) => {
        text.add(1, Text.aqua("命中时产生 2 格爆炸"));
        text.add(2, Text.aqua("再散射 3~6 枚空爆II"));
    })
    // 空爆II
    event.addAdvanced('mysticartifacts:final_exploding_arrow', (item, advanced, text) => {
        text.add(1, Text.aqua("命中时产生 2 格爆炸(不破坏方块)"));
    })
    // 末影苦无
    event.addAdvanced('mysticartifacts:ender_kunai', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("右键投掷(可叠加16)，落地后发光"));
            text.add(2, Text.aqua("遭受攻击瞬间传送回苦无处"));
            text.add(3, Text.aqua("取消该次伤害并消耗苦无"));
            text.add(4, Text.aqua("苦无 60 秒后消失"));
        }
    })
    // 二龙戏珠
    event.addAdvanced('mysticartifacts:two_dragons_play_ball', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("右键召唤火/冰双龙珠环绕转动(直径5格,40秒)"));
            text.add(2, Text.aqua("龙珠碰撞造成 5 点伤害"));
            text.add(3, Text.aqua("长按攻击键抛飞龙扇：自动索敌弹射6次后返回"));
            text.add(4, Text.aqua("返回后龙珠恢复，每次释放消耗3耐久"));
            text.add(5, Text.aqua("冷却 2 秒"));
        }
    })
    // 武士刀
    event.addAdvanced('mysticartifacts:katana', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.gold("▸ 长按右键防御(消耗2血量)"));
            text.add(2, Text.aqua("  开头0.5秒内为完美格挡窗口"));
            text.add(3, Text.aqua("  完美格挡：弹反弹道并反弹近战伤害"));
            text.add(4, Text.aqua("  普通格挡：抵消伤害"));
            text.add(5, Text.aqua("  格挡时触发 ParticleJS 格挡粒子反馈"));
            text.add(6, Text.gold("▸ 潜行右键居合斩"));
            text.add(7, Text.aqua("  消耗6血量向前冲刺，斩击路径上所有敌人"));
            text.add(8, Text.aqua("  冲刺伤害 = 攻击力×10，斩后10秒强化姿态"));
            text.add(9, Text.aqua("  使用后短暂冷却"));
        }
    })
    // 击杀牌叠
    event.addAdvanced('mysticartifacts:poker_card', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("左键投掷扑克牌（伤害4，冷却0.65秒）"));
            text.add(2, Text.aqua("飞牌贯穿敌人，落地后发光标记"));
            text.add(3, Text.aqua("右键回收20格内的落地牌"));
            text.add(4, Text.aqua("回收途中切割路径上的敌人(伤害6)"));
        }
    })
    // 扑克牌(投掷物)
    event.addAdvanced('mysticartifacts:poker_card_projectile', (item, advanced, text) => {
        text.add(1, Text.darkGray("扑克牌投掷物的物品形态，仅供渲染展示"));
    })
    // 死亡之眼
    event.addAdvanced('mysticartifacts:death_eye', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("饰品。佩戴后36格内的生物"));
            text.add(2, Text.aqua("会显示摇曳的死亡切割线"));
            text.add(3, Text.aqua("近战攻击与切割线重合时"));
            text.add(4, Text.gold("伤害×2(处决)"));
        }
    })
    // 王之宝库
    event.addAdvanced('mysticartifacts:sword_swarm_charm', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            let count = (item.nbt != null && item.nbt.contains("EatenSwords")) ? item.nbt.getList("EatenSwords", 8).size() : 0
            text.add(1, Text.aqua(`已吞噬剑种：${count}`))
            text.add(2, Text.aqua("在背包中用剑右键点击首饰吞入(每种剑仅一次)"));
            text.add(3, Text.aqua("长按攻击键自动发射幻影剑(每2tick一把)"));
            text.add(4, Text.aqua("幻影剑伤害 = 已吞噬剑种数量"));
            text.add(5, Text.aqua("吞噬过的剑会环绕浮现在饰品周围"));
        }
    })
    // 量子密钥
    event.addAdvanced('mysticartifacts:quantum_key', (item, advanced, text) => {
        text.add(1, Text.aqua("量子加密的解锁密钥"));
        text.add(2, Text.red("生成后60秒未使用即失效"));
        text.add(3, Text.aqua("用于解锁曼德尔砖"));
    })
    // 曼德尔砖
    event.addAdvanced('mysticartifacts:mandel_brick', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("将未过期的量子密钥右键到它进行解锁"));
            text.add(2, Text.aqua("解锁后再次右键开启，获得随机奖励"));
        }
    })
    // 器灵
    event.addAdvanced('mysticartifacts:artifact_spirit', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("可吞噬：弓/弩/喷溅药水/滞留药水/土豆炮/灼烧器"));
            text.add(2, Text.aqua("佩戴后召唤器灵跟随战斗"));
            text.add(3, Text.aqua("自动攻击你正在攻击的目标"));
            text.add(4, Text.aqua("弹药从你的末影箱消耗"));
            text.add(5, Text.aqua("箭/烟花/药水/煤炭对应不同武器"));
        }
    })
    // 钻石长矛
    event.addAdvanced('mysticartifacts:spear', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("攻击范围1.5~4.5格(+2格交互距离)"));
            text.add(2, Text.aqua("蓄力穿刺：直线刺穿路径上的敌人"));
            text.add(3, Text.aqua("近战切换类长武器，无法破坏方块"));
        }
    })
    // 破坏者刺雷
    event.addAdvanced('mysticartifacts:griefer_spear', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("蓄力穿刺攻击"));
            text.add(2, Text.aqua("命中敌人时产生 2 格刺雷爆炸"));
            text.add(3, Text.aqua("爆炸不破坏方块"));
        }
    })
    // 伪抄
    event.addAdvanced('mysticartifacts:codex', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("铁砧中与古代书合成：录刻附魔"));
            text.add(2, Text.aqua("刻录等级 = 该附魔上限+2级"));
            text.add(3, Text.aqua("再将伪抄与武器/装备铁砧合成"));
            text.add(4, Text.aqua("可将该附魔提升1级(等级需正好差1级)"));
            text.add(5, Text.red("合成消耗30~50级经验"));
        }
    })
    // 全视之眼
    event.addAdvanced('mysticartifacts:all_seeing_eye', (item, advanced, text) => {
        text.add(1, Text.aqua("右键打开在线玩家列表"));
        text.add(2, Text.aqua("选择目标后进入观战视角跟随"));
        text.add(3, Text.aqua("再次右键退出观战"));
    })
    // 求生玉
    event.addAdvanced('mysticartifacts:survival_jade', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("所受伤害转化为[残影]暂存(上限=最大生命)"));
            text.add(2, Text.aqua("残影每3秒衰减1点"));
            text.add(3, Text.aqua("造成伤害时50%转化为治疗(消耗残影)"));
            text.add(4, Text.aqua("取下饰品后残影清空"));
        }
    })
    // ==========================================
    // 📖 图鉴系列饰品（fieldguide 收集进度加成）
    // 加成基于 Field-Guide 对应分类的解锁百分比，与图鉴百科互斥
    // ==========================================
    // 图鉴·植物篇
    event.addAdvanced('rainbow:field_guide_plant', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 植物收集进度 → 治疗溢出"));
            text.add(2, Text.aqua("▸ 100%收集 = +50% 治疗溢出"));
            text.add(3, Text.red("▸ 与图鉴百科互斥"));
        }
    })
    // 图鉴·动物篇
    event.addAdvanced('rainbow:field_guide_animal', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 动物收集进度 → 宠物伤害"));
            text.add(2, Text.aqua("▸ 100%收集 = +20 宠物伤害"));
            text.add(3, Text.red("▸ 与图鉴百科互斥"));
        }
    })
    // 图鉴·怪物篇
    event.addAdvanced('rainbow:field_guide_monster', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 怪物收集进度 → 当前生命伤害"));
            text.add(2, Text.aqua("▸ 100%收集 = +10% 当前生命伤害"));
            text.add(3, Text.red("▸ 与图鉴百科互斥"));
        }
    })
    // 图鉴·BOSS篇
    event.addAdvanced('rainbow:field_guide_boss', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ BOSS收集进度 → 闪避几率"));
            text.add(2, Text.aqua("▸ 100%收集 = +80% 闪避几率"));
            text.add(3, Text.red("▸ 与图鉴百科互斥"));
        }
    })
    // 寻友护符
    event.addAdvanced('rainbow:player_doll', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 根据服务器在线玩家数量提供加成"));
            text.add(2, Text.aqua("▸ 每人在线：+10% 挖掘速度（乘算）"));
            text.add(3, Text.aqua("▸ 每人在线：+10% 造成伤害（乘算）"));
            text.add(4, Text.aqua("▸ 每人在线：+10% 自然恢复速度（乘算）"));
            text.add(5, Text.gold("▸ 在线玩家 > 1 时激活，图标变化"));
        }
    })
    // 图鉴百科
    event.addAdvanced('rainbow:the_field_guide', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 同时拥有四篇图鉴的全部加成"));
            text.add(2, Text.aqua("▸ 植物收集 → 治疗溢出"));
            text.add(3, Text.aqua("▸ 动物收集 → 宠物伤害"));
            text.add(4, Text.aqua("▸ 怪物收集 → 当前生命伤害"));
            text.add(5, Text.aqua("▸ BOSS收集 → 闪避几率"));
            text.add(6, Text.red("▸ 与四篇图鉴饰品互斥"));
        }
    })
    // 流浪软糖包
    event.addAdvanced('rainbow:wandering_gummy_pack', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 攻击概率触发随机软糖的食用效果"));
            text.add(2, Text.aqua("▸ 一次触发只触发其中一种软糖的效果"));
            text.add(3, Text.aqua("▸ 触发冷却 2 秒"));
            text.add(4, Text.gold("▸ 幸运值 8 时概率最大（25%）"));
        }
    })
    // 兽性面具：从玩家当前药水效果显示闪避层数，不读取饰品NBT
    event.addAdvanced('rainbow:beast_mask', (item, advanced, text) => {
        let dodgeLevel = 0;
        try {
            if (Client.player != null) {
                let dodgeEffect = Client.player.getEffect("rainbow:beast_dodge");
                if (dodgeEffect != null) dodgeLevel = dodgeEffect.getAmplifier() + 1;
            }
        } catch (e) {
            console.log("[兽性面具提示] 读取闪避层数出错: " + e);
        }
        dodgeLevel = Math.max(0, Math.min(10, dodgeLevel));
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 击杀敌人治疗自己 4 点生命"));
            text.add(2, Text.aqua("▸ 每次受伤增加1层被动闪避"));
            text.add(3, Text.of(`▸ 当前闪避层数: §e${dodgeLevel}§r / 10`));
            text.add(4, Text.aqua("  每层提供1%闪避，最多叠加10层，持续10秒"));
            text.add(5, Text.aqua("  继续受伤会重置闪避效果持续时间"));
            text.add(6, Text.aqua("  触发极限闪避恢复4血量"));
        }
    })
    // 多心经
    // 机制：佩戴获得 +10% 冷却缩减（乘算）
    event.addAdvanced('rainbow:the_heart_sutra', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 佩戴后获得 +10% 冷却缩减"));
            text.add(2, Text.aqua("▸ 所有技能冷却时间缩短"));
            text.add(3, Text.aqua("  效果为乘算，可与其他减CD叠加"));
        }
    })
    // 抽血袋
    event.addAdvanced('rainbow:blood_collection_bag', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("▸ 触发背刺时，恢复背刺伤害 50% 的血量"));
            text.add(2, Text.aqua("▸ 背刺判定需处于隐匿状态且从目标背后攻击"));
            text.add(3, Text.gold("▸ 回血量基于背刺最终伤害（伤害×2后）"));
        }
    })
    // 先祖之信
    // 机制：免疫一次致死伤害后进行判定
    event.addAdvanced('mysticartifacts:ancestors_letter', (item, advanced, text) => {
        text.add(1, Text.gray("先祖的低语仍在信纸间流转……"));
        text.add(2, Text.gray("正常：免疫一次致死伤害并进行判定——"));
        text.add(3, Text.gold("50%【美德】受伤-25%，致死时75%拒绝死亡并回满血，持续一个游戏日"));
        text.add(4, Text.darkRed("50%【折磨】受伤+15%，受伤时25%直接死亡，且无法取下"));
        text.add(5, Text.gray("死亡或睡觉后回归平静。"));
    })
    // 强盗围巾
    event.addAdvanced('rainbow:dismas_scarf', (item, advanced, text) => {
        text.add(1, Text.aqua("触发极限闪避时进行").append(Text.gold("反击")));
        text.add(2, Text.gold("反击").append(Text.aqua("：对攻击者造成 12点")).append(Text.white("真实伤害")));
        text.add(3, Text.red("素材版权警告，需要验证版权问题"));
    })
    // 忍具袋
    event.addAdvanced('rainbow:ninja_tools', (item, advanced, text) => {
        text.add(1, Text.aqua("投掷伤害 +2"));
    })
    // 要你命3000
    event.addAdvanced('rainbow:the_3000_ways_to_kill', (item, advanced, text) => {
        text.add(1, Text.aqua("爆炸伤害 +2"));
    })
    // 肩甲
    event.addAdvanced('rainbow:pauldron', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("翻滚/高速移动时撞击周围敌人"));
            text.add(2, Text.aqua("对被撞到的敌人造成 8 点伤害并击退"));
        }
    })
    // 通灵卷轴（功能见 server_scripts/curios_skill_system/Skillwheel.js registerSkill('rainbow:kuchiyosenojutsu')）
    event.addAdvanced('rainbow:kuchiyosenojutsu', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("主动：召唤通灵卷轴悬浮面前 5 秒"));
            text.add(2, Text.aqua("自动从末影箱取出投掷物"));
            text.add(3, Text.aqua("朝施法方向持续发射(雪球/箭/投掷药水等)"));
            text.add(4, Text.gold("潜行：召唤偏转卷轴(偏转加速射来的抛射体)"));
        }
    })
})
