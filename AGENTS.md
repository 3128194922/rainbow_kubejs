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

# 输出要求

不管有没有文本输出都应该输出文本 【前端变前台，后端变后厨，python送到家，Java炒米粉】