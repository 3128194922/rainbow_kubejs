// priority: 500
// ==========================================
// 💡 物品提示信息脚本
// ==========================================

ItemEvents.tooltip(event => {
    // 为彩虹大便添加提示
    //event.add('rainbow:shit', '§6这是一坨有味道的物品')
})

// 引入原版工具类用于格式化时长
const $MobEffectUtil = Java.loadClass('net.minecraft.world.effect.MobEffectUtil')

ItemEvents.tooltip(event => {
    // 使用标签过滤器匹配目标物品
    event.addAdvanced('#rainbow:food_tooltip', (item, advanced, text) => {
        const food = item.item.foodProperties
        if (!food) return
        
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
                    let durationText = $MobEffectUtil.formatDuration(effectInstance, 1.0)
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
            text.add(1, Text.aqua("攻击半血以下的实体伤害翻倍"));
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
            text.add(1, Text.aqua("击杀生物概率刷新主手和副手物品冷却"));
            text.add(2, Text.aqua(`触发概率根据幸运值判断`));
        }
        text.add(3, Text.darkGray("美术资源：Demi's Enigmatic Dice"));
    })
    event.addAdvanced('rainbow:daawnlight_spirit_origin', (item, advanced, text) => {
        text.add(1, Text.aqua("每10s标记周围实体,被标记实体受到远程伤害翻倍"));
    })
    event.addAdvanced('rainbow:mining_charm', (item, advanced, text) => {
        text.add(1, Text.aqua("+1时运"));
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
        text.add(1, Text.aqua("消耗饱和度抵消部分伤害"));
        text.add(2, Text.aqua("伤害计算包含护甲和抗性"));
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
          text.add(1, Text.aqua("佩戴后放置方块将受限制"));
          text.add(2, Text.aqua("最大生命值锁定为2"));
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
    event.addAdvanced('rainbow:golden_piggy_charm', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("猪灵不会攻击你"));
            text.add(2, Text.aqua("无敌帧延长到2s"));
        }
    })
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
        text.add(1, Text.aqua(`取消霰弹炮CD`));
    })
    /*event.addAdvanced('rainbow:lyre', (item, advanced, text) => {
        text.add(1, Text.aqua(`取消号角CD`));
    })*/

    event.addAdvanced(['rainbow:reload_core', 'rainbow:short_core'], (item, advanced, text) => {
        let energy = item.nbt ? (item.nbt.getFloat("Energy") || 0) : 0;
        let color = energy >= 200 ? "§a" : "§e";
        text.add(1, Text.of(`当前能量: ${color}${energy.toFixed(1)} / 200.0`));
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
        text.add(1, Text.aqua(`快速消耗饥饿(非全部) 恢复生命值`));
    })
    event.addAdvanced('rainbow:eye_of_satori', (item, advanced, text) => {
        text.add(1, Text.gold("读心: ").append(Text.aqua("准心标记怪物，增强友军")));
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
            text.add(1, Text.aqua("返回前5s的位置和血量"));
            text.add(2, Text.aqua("在结构内可以直接重置结构"));
        }
    })
    event.addAdvanced('rainbow:ancientaegis', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("右键绑定在线玩家"));
            text.add(2, Text.aqua("你受到的伤害将转移到对应在线玩家身上"));
            text.add(3, Text.gold("绑定对象ID: ").append(Text.yellow(`${item?.nbt?.getString("UUID")}`)));
        }
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
    })
    /*event.addAdvanced('rainbow:luoyang_shovel', (item, advanced, text) => {
        text.add(1, Text.aqua("右键可直接提取出考古物品"));
    })*/
    event.addAdvanced('rainbow:oceantooth_necklace', (item, advanced, text) => {
        text.add(1, Text.gray("与狱牙吊坠互斥"));
        let nbt = item.getNbt();
        if (!nbt) return;
        let dmg = item.getDamage();
        let maxDmg = item.getMaxDamage();
        text.add(Text.aqua("耐久：").append(Text.yellow(`${maxDmg - dmg} / ${maxDmg}`)));
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
            text.add(1, Text.aqua("根据穿戴的盔甲纹饰提供属性加成"));
            text.add(2, Text.aqua("加成效果受魔法伤害属性影响"));
            text.add(3, Text.gold("技能：释放圣经之力"));
            text.add(4, Text.aqua("向外扩散金色冲击波"));
            text.add(5, Text.aqua("推开周围实体"));
            text.add(6, Text.aqua("每次脉冲恢复 100 血量"));
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
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("隐匿时获得暴击率与暴击伤害加成"));
            text.add(2, Text.aqua("潜行/隐身/少穿盔甲可扩大隐匿范围"));
            text.add(3, Text.aqua("被索敌发现时加成暂时失效"));
        }
    })
    event.addAdvanced('rainbow:shiny_stone', (item, advanced, text) => {
        text.add(1, Text.aqua("不移动时每秒恢复 2 点生命值"));
        text.add(Text.darkGray("美术资源：Forgotten Relics"))
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
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("获得幸运效果"));
            text.add(2, Text.aqua("时运 +3"));
        }
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
        text.add(3, Text.darkGray("美术资源：Demi's Enigmatic Dice"));
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
        }
    })
    event.addAdvanced('rainbow:whistle', (item, advanced, text) => {
        text.add(1, Text.gray("按[SHIFT]查看详细"));
        if (event.shift) {
            text.remove(1)
            text.add(1, Text.aqua("对16格范围内的主人召唤物施加杀戮欲望"));
            text.add(2, Text.aqua("其他生物获得发光效果，持续10秒"));
        }
    })
    event.addAdvanced('rainbow:tyrfing', (item, advanced, text) => {
        text.add(Text.darkGray("美术资源：Embers Rekindled"))
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
})