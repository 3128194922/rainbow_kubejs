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
            text.add(0, Text.darkPurple("饕餮之锅"));
        }
        else {
            text.add(0, Text.darkPurple("饕餮之锅"));
        }
        text.add(1, Text.red("已食用食物数:").append(Text.lightPurple(`${item.nbt.foodnumber}`)));
    })
    event.addAdvanced('uniyesmod:giants_ring', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("碰撞体积变大1.5倍"));
            text.add(2, Text.darkPurple("冲刺可以对比自己体型小的生物造成伤害"));
        }
        text.add(Text.red("**Third-Party Licenses**"))
        text.add(Text.red("MIT License"))
        text.add(Text.red("Project: demis-enigmatic-dice"))
    })
    event.addAdvanced('uniyesmod:moon', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("手持失去重力"));
            text.add(2, Text.darkPurple("空中蹲下可以恢复重力"));
        }
        text.add(Text.red("**Third-Party Licenses**"))
        text.add(Text.red("MIT License"))
        text.add(Text.red("Project: demis-enigmatic-dice"))
    })
    event.addAdvanced('uniyesmod:gravity_core', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("可以进行二段跳"));
            text.add(2, Text.darkPurple("在空中按住[SHIFT]可以对地践踏"));
        }
        text.add(Text.red("**Third-Party Licenses**"))
        text.add(Text.red("MIT License"))
        text.add(Text.red("Project: demis-enigmatic-dice"))
    })
    event.addAdvanced('rainbow:berserk_emblem', (item, advanced, text) => {
            text.add(1, Text.darkPurple("根据已经损失的血量增加属性"));
            text.add(2, Text.red("联动暴食之符"));
    })
    event.addAdvanced('rainbow:resilience_syringe', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("显示[肾上腺素]条,开启肾上腺素系统"));
            text.add(2, Text.darkPurple(`开启后启动肾上腺素`));
        }
    })
    event.addAdvanced('rainbow:rage_syringe', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("显示[暴怒]条,开启化学内爆系统"));
            text.add(2, Text.darkPurple(`开启后启动化学内爆`));
        }
    })
    event.addAdvanced('rainbow:dice', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("击杀生物概率刷新主手和副手物品冷却"));
            text.add(2, Text.darkPurple(`触发概率根据幸运值判断`));
        }
    })
    event.addAdvanced('rainbow:daawnlight_spirit_origin', (item, advanced, text) => {
        text.add(1, Text.darkPurple("每10s标记周围实体,被标记实体受到远程伤害翻倍"));
    })
    event.addAdvanced('rainbow:mining_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("+1时运"));
    })
    event.addAdvanced('rainbow:wind', (item, advanced, text) => {
        text.add(1, Text.darkPurple("获取灵魂汲取buff"));
    })
    event.addAdvanced('rainbow:weapon_master_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("根据手持武器攻速的不同提供不同加成"));
    })
    event.addAdvanced('rainbow:hungry_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("佩戴后会依据当下的饥饿值提供增益"));
    })
    event.addAdvanced('rainbow:mind', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`开启后释放心灵墙`));
    })
    event.addAdvanced('rainbow:lightning', (item, advanced, text) => {
        text.add(1, Text.darkPurple("攻击生物触发连锁闪电,最大连锁5"));
    })
    event.addAdvanced('rainbow:cactus', (item, advanced, text) => {
        text.add(1, Text.darkPurple("每30s恢复1饥饿值"));
    })
    event.addAdvanced('rainbow:big_stomach', (item, advanced, text) => {
	  text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
      if (event.shift) {
		text.remove(1)
        text.add(1, Text.darkPurple("消耗饱和度抵消部分伤害"));
		text.add(2, Text.darkPurple(`加速玩家饮食速度的同时，允许玩家在饱食度已满时进食`));
		}
    })
    event.addAdvanced('uniyesmod:moai_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("生物碰撞箱对你无影响"));
        text.add(Text.red("**Third-Party Licenses**"))
        text.add(Text.red("MIT License"))
        text.add(Text.red("Project: demis-enigmatic-dice"))
    })
    event.addAdvanced(['rainbow:adventure_charm'], (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
          text.remove(1)
          text.add(1, Text.darkPurple("佩戴后放置方块将受限制"));
          text.add(2, Text.darkPurple("佩戴极限之证时本饰品不生效"));
          }
    })
    event.addAdvanced(['rainbow:despair_insignia'], (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
          text.remove(1)
          text.add(1, Text.darkPurple("佩戴后放置方块将受限制"));
          text.add(2, Text.darkPurple("最大生命值锁定为2"));
          }
    })
    event.addAdvanced('rainbow:gluttony_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("根据你当前所损失的饥饿值百分比获得加成"));
            text.add(2, Text.darkPurple("佩戴该护符时免疫饥饿所造成的伤害"));
            text.add(3, Text.red("联动血战沙场之证"));
        }
    })
    event.addAdvanced('rainbow:golden_piggy_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("猪灵不会攻击你"));
            text.add(2, Text.darkPurple("无敌帧延长到2s"));
        }
    })
    event.addAdvanced('rainbow:monster_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("定期获得伤害吸收buff"));
            text.add(2, Text.darkPurple("在特定结构内获得仇怨buff"));
            text.add(3, Text.darkPurple(`按[${global.regKeyCharm.getKey().getDisplayName().getString()}]启动召唤宠物`));
        }
    })
    event.addAdvanced('rainbow:flesh', (item, advanced, text) => {
        text.remove(0)
        text.add(0, Text.darkPurple("怪肉"));
        if (event.shift) {
            text.remove(0)
            text.add(0, Text.darkPurple("人肉"));
        }
    })
    event.addAdvanced('legendary_monsters:the_great_frost', (item, advanced, text) => {
            text.add(3, Text.gold("特殊能力3:").append(Text.gray("对水生和着火生物伤害+50%")));
            text.add(4, Text.gold("特殊能力4:").append(Text.gray("攻击附加冻结")));
    })
    event.addAdvanced('rainbow:musical_score', (item, advanced, text) => {
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
    })
    event.addAdvanced('rainbow:reload_core', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`取消霰弹炮CD`));
    })
    event.addAdvanced('rainbow:lyre', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`取消号角CD`));
    })

    const machine_name ={
        'mbd2:nuke_machine': "核弹发射井",
    }

    event.addAdvanced('rainbow:beacon_ball', (item, advanced, text) => {
        if(!item.nbt) return;
        text.add(1, Text.gold(`绑定坐标：`).append(`X:${item.nbt.getInt("X")} Y:${item.nbt.getInt("Y")} Z:${item.nbt.getInt("Z")}`));
        text.add(1, Text.gold(`绑定机器：`).append(`${machine_name[item.nbt.getString("MACHINE")]}`));
    })
    event.addAdvanced('rainbow:phantom_body', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`触发烛心面具模仿生物的主动技能`));
    })
    event.addAdvanced('rainbow:lilith_hug', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`你将变为吸血鬼`));
        text.add(2, Text.red(`那么代价呢？`));
    })
    event.addAdvanced('rainbow:cruncher_charm', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`快速消耗饥饿(非全部) 恢复生命值`));
    })
    event.addAdvanced('rainbow:eye_of_satori', (item, advanced, text) => {
        text.add(1, Text.gold("读心: ").append(Text.gray("准心标记怪物，增强友军")));
    })
    event.addAdvanced('rainbow:musical_score', (item, advanced, text) => {
        text.add(1, Text.gold("记录: ").append(Text.gray("拿在副手吹响号角进行记录，如果形成完整乐谱可以右键释放对应魔法")));
    })
    event.addAdvanced('rainbow:mind_ctroller_detention', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`右键回收被脑控的佣兵生物`));
    })
    event.addAdvanced('rainbow:purified_cloth', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`长按右键擦掉副手物品的诅咒附魔`));
    })
    event.addAdvanced('create_fantasizing:tree_cutter', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`在有气罐气体情况下消耗10气体额外造成6伤害`));
    })
    event.addAdvanced('rainbow:chronos', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("定期锁定BUFF持续时间"));
            text.add(2, Text.darkPurple("在结构内可以直接重置结构"));
        }
    })
    event.addAdvanced('rainbow:ancientaegis', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.darkPurple("右键绑定在线玩家"));
            text.add(2, Text.darkPurple("你受到的伤害将转移到对应在线玩家身上"));
            text.add(3, Text.gold("绑定对象ID: ").append(`${item?.nbt?.getString("UUID")}`));
        }
    })
    event.addAdvanced('rainbow:luoyang_shovel', (item, advanced, text) => {
        text.add(1, Text.darkPurple("右键可直接提取出考古物品"));
    })
    event.addAdvanced('rainbow:sacrificial_amulet', (item, advanced, text) => {
            // 先判断 NBT 是否存在
            let nbt = item.getNbt();
            if (!nbt) {
                return;
            }
            else
            {
                text.add(1, Text.darkPurple(`献祭：${nbt.getInt("kill")}`));
            }
    })
    event.addAdvanced('rainbow:amber_bee', (item, advanced, text) => {
        text.add(1, Text.darkPurple("按 [ALT] 查看详细"));
    
        if (event.alt) {
            text.remove(1);
    
            // 先判断 NBT 是否存在
            const nbt = item.getNbt();
            if (!nbt) {
                text.add(1, Text.gray("❌ 无存储信息"));
                return;
            }
    
            let raw = nbt.get("FFDisguisedGeneBytes");
            if (!raw) {
                text.add(1, Text.gray("❌ 无存储信息"));
                return;
            }
    
            let str = raw.toString(); // 例如 "{RC:0b,FT1:32b,FT2:0b,FC:0b}"
            let regex = /([A-Z0-9_]+):([0-9]+)b/g;
            let match;
            let hasGene = false;
    
            while ((match = regex.exec(str)) !== null) {
                hasGene = true;
                let key = match[1];
                let value = parseInt(match[2]);
    
                let dominant = value & 0xF;         // 低4位 -> 显性
                let recessive = (value >> 4) & 0xF; // 高4位 -> 隐性
    
                text.add(1, Text.gray(`- ${key}: 高位 ${recessive}, 低位 ${dominant}`));
            }
    
            if (!hasGene) text.add(1, Text.gray("❌ 无存储信息"));
        }
    });
    event.addAdvanced('rainbow:365_exe', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`根据剩余的义体容量提供加成`));
    })
    event.addAdvanced('rainbow:biological_monitoring', (item, advanced, text) => {
        text.add(1, Text.darkPurple(`当你血量低于最大生命值25%时立刻回满血量`));
    })
    event.addAdvanced('rainbow:cyber_nerve_cpu', (item, advanced, text) => {
        text.add(1, Text.gold(`[义体前置]`));
    })
})