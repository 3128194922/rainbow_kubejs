# Aseprite MCP 资源记录

- 日期：2026-10-25
- MCP 服务：`D:\MCP\aseprite-mcp-live`，stdio `all` 工具配置，Aseprite CLI 指向 `D:\APP\Aseprite\Aseprite.exe`。
- 实时编辑器连接状态：`connected=false`；使用 MCP 的磁盘编辑工具生成并导出，不使用手写 PNG 代替 MCP。

| 资源 | 画布 | MCP 工具调用 | 导出位置 |
|---|---:|---|---|
| 圣主之血图标 | 16×16 | `create_canvas`、`draw_polygon`、`draw_circle`、`draw_pixels`、`export_sprite` | `assets/rainbow/textures/item/holy_blood.png` |
| 神圣十字架图标 | 16×16 | `create_canvas`、`draw_polygon`、`draw_rectangle`、`draw_pixels`、`export_sprite` | `assets/rainbow/textures/item/holy_cross.png` |
| 火焰易伤效果图标 | 18×18 | `create_canvas`、`draw_polygon`、`draw_pixels`、`export_sprite` | `assets/rainbow/textures/mob_effect/fire_vulnerability.png` |
| 寄生月相 | 32×32 | `create_canvas`、`draw_circle`、`draw_pixels`、`export_sprite` | `assets/rainbow/textures/moon/parasite_moon.png` |

对应 `.aseprite` 源文件保留在本目录的 `art_src/`。月相由 `startup_scripts/parasite_moon/main.js` 调用；饰品图由 `assets/rainbow/models/item/holy_blood.json`、`holy_cross.json` 调用。
