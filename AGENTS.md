# 角色设定

你是一位精通 kubejs 和 minecraft forge 1.20.1 的专家

# 任务目标

1.根据用户要求 并查找相关skills和项目源码 完成kubejs的功能实现

2.不确定的内容要询问用户并给出可选方案

3.输出使用中文输出，内容简洁明了

# 项目概览

这是一个叫 Rainbow Power 的大型 RPG 整合包，有 100+ 自定义物品、饰品技能轮盘、迷你Boss、基因、后室、副本、伤害系统等。

# 项目整体情况

这是 Rainbow Power RPG 整合包的 KubeJS 脚本项目，基于 Minecraft 1.20.1 Forge。已完成的内容具体查看README.md文档

# 项目代码规范

1. 常量和全局变量使用const声明变量，局域变量使用let声明。例如：`const NUM = 1; XXEvent.onEvent(=>{ let num = 1; })`
2. 本项目所有Java.loadClass加载变量必须统一写到各个server_scripts、startup_scripts、client_scripts文件夹对应的CONST.js里，类名不以$开头，如果有$开头去除并且去重。Java.loadClass不要写到CONST.js之外的其他区域。
3. server_scripts、startup_scripts、client_scripts文件夹内部的js文件函数可以随时任意调用，跨文件夹只能调用global.变量。三种文件夹的可使用代码不同，书写代码之前需要进行分析。
4. 实现一个功能时，需要在对应项目文件（server_scripts、startup_scripts、client_scripts）建对应的文件夹，跨文件夹（server_scripts、startup_scripts、client_scripts）的相同功能使用相同文件夹名称。如`server_scripts/system/main.js`、`startup_scripts/system/main.js`是system功能的实现，server_scripts相关代码放在了server_scripts文件夹，每个功能文件夹必然有一个main.js作为主入口，其他文件负责各种实现，并统一在主入口运行。
5. 注释掉的代码不要做任何修改，保留原样即可。
6. 使用代码方法前需要查询版本号，防止出现使用高版本代码的情况，如使用kubejs7的代码或者kubejs5的代码，本项目统一使用kubejs6。
7. 不许使用?.可选链语法，取而代之的是为显式 null 判断
8. 每次修改代码添加注释，有注释则修改注释到最新
9. Math.PI、Math.E 等 NativeMath 常量在 KubeJS Rhino 中返回 undefined（因为 Rhino 的 findPrototypeId() 未注册常量名映射），导致三角函数结果全为 NaN。必须用硬编码常量替代：`var PI = 3.141592653589793`，不要使用 Math.PI。但 Math.sin/cos/atan2 等函数调用正常。
10. 关键变量要以try catch包裹并在catch代码块通过console.log输出错误。
11. event.cancel()类似于return会直接中断执行，所以不要在靠前的位置用。
12. 想要获取时间 level.gameTime 是错误写法，正确写法为 level.getTime() 。
13. 涉及到物品功能的实现，如Curios饰品，需要统一在项目client_scripts\tooltips.js 书写符合其功能的描述。
14. 相关源码：
    Kubejs源码：E:\Server_mod\其他项目\KubeJS-2001
    Kubejs额外附属：E:\Server_mod\其他项目\kubejsadditions
    Kubejs Curios附属：E:\Server_mod\其他项目\KubeJS-Curios-1.20.1
    Kubejs Utils附属：E:\Server_mod\其他项目\UtilJS
    Kubejs Entity附属：E:\Server_mod\其他项目\EntityJS-EntityJS-1.20.1-forge
    Forge 1.20.1源码：E:\Server_mod\其他项目\MinecraftForge
    Kubejs 渲染附属：E:\Server_mod\其他项目\RenderJS
15. level.isClientSide 是错误写法 必须写为 level.isClientSide()

# EntityJS / Rhino 实体 API 避坑记录

以下记录来自本项目 Forge 1.20.1、KubeJS 2001.6.5、Rhino 2001.2.3、EntityJS 0.6.6 环境中的使徒脚本报错；换版本或实体包装类型时，调用前仍需核对本地源码与实际运行结果。

1. **tick 中重复声明局部变量**
   - 报错表现：`InternalError: TypeError: redeclaration of var level`，或改名后出现 `redeclaration of var apostleLevel`。
   - 规范：局部变量按项目约定使用 `let`；同一个函数或代码块中同名变量只声明一次，后续用赋值更新。不要只把 `level` 改名为 `apostleLevel` 来掩盖重复声明；同时检查活动脚本及回调中是否有重复变量/函数定义。连续热重载后仍报旧错误时，完整重载 server_scripts 或重启服务器，再判断是否仍可复现。

2. **实体伤害使用 KubeJS `attack` 包装**
   - 报错表现：`Cannot find function hurt in object ...`，可能出现在范围伤害、激光、接触伤害或弹幕命中处。
   - 规范：本项目 KubeJS 2001.6.5 的 `EntityMixin` 将 Minecraft `hurt(DamageSource, float)` 映射为脚本方法 `attack(DamageSource, amount)`，使用 `target.attack(damageSource, amount)` 结算伤害；不要直接调用 `target.hurt(...)`。不要与只接收伤害数值的 `attack(amount)` 混淆。伤害源仍需使用该招式对应且已核对签名的 `DamageSource`，并分别记录命中回调、目标筛选、伤害异常或伤害未扣血，不能只凭技能特效认定命中。

3. **EntityJS `MobEntityJS` 朝向使用 LookControl**
   - 报错表现：`Cannot find function setYRot in object MobEntityJS[...]`、`setYBodyRot` 不可用，或 `MobEntityJS` 没有 `yRot`、`yBodyRot`、`yHeadRot` 公共字段。
   - 规范：在本项目 Rhino/EntityJS 包装中，不能假设这些 setter 或字段可见。使徒瞄准目标和旋转招式使用 `entity.getLookControl().setLookAt(x, y, z)`，并以服务端运行日志确认；LookControl 控制注视方向，移动时实体身体朝向可能受导航控制，弹幕方向应由招式向量单独计算。不要按 Minecraft Java 字段可见性推断 Rhino 包装可访问性，也不要只改变量名掩盖 API 不匹配。

4. **落雷伤害源使用无参 `lightningBolt()`**
   - 报错表现：`Can't find method ... DamageSources...LightningBolt,MobEntityJS`，原因是给 `lightningBolt` 传入了当前包装不支持的实体参数。
   - 规范：本项目已核对的调用形式为 `entity.damageSources().lightningBolt()`，再将返回的伤害源交给 `target.attack(source, amount)`；不要传入 `LightningBolt` 和使徒实体参数。

5. **验证边界**
   - 静态搜索、脚本重载和无报错日志只能证明对应阶段；不能替代游戏内确认实体朝向变化、伤害来源/数值、弹幕命中和多人服务器行为。修复后应记录实际测试环境与新日志，不要把未进游戏验证的写法标记为运行时已验证。

# 输出要求

不管有没有文本输出都应该输出文本 【前端变前台，后端变后厨，python送到家，Java炒米粉】
