# 室内图片材质与分件精修 · 2026-10-26

本轮使用 Blender MCP 制作模型，下载并配置真实图片材质；没有执行截图、渲染、网页漫游、自动测试或视觉验证。最终运行 `scripts/package-local.mjs` 仅用于更新本地启动文件，不代表验收通过。

## 神社重叠调整

神社住居床边的盆栽从原室内坐标 `(3.1, 0, -3.7)` 移到 `(1.8, 0, -3.7)`。原始生成器、碰撞来源、Blender 中的盆栽分件及网页 GLB 使用相同位置；原床铺保持不动。

## 范围与材质

| 区域 | 本轮处理 |
| --- | --- |
| 基地卧室 | 保留此前按图制作的木床、床品、书柜、书桌、窗帘分件；升级真实木纹、亚麻、纸面及法线和粗糙度贴图，补细边倒角 |
| 基地办公室 | 原位置的木桌、木椅、组合柜、书本文件夹、绿帘等升级图片材质；保留柜门、抽屉、文具及花束分件 |
| 绯华楼 | 大厅、二楼外廊与办公室升级木纹、纸面、榻榻米和织物材质；紫色软装使用绒布纹理，保留办公室已腾出的桌旁通道 |
| 琉璃塔大厅 | 石材地面、皮革沙发、缝边坐垫、木质柜体、前台板缝与踢脚、独立键帽，以及平滑陈设体积 |
| 赫卡忒房间 | 连续床单与被面褶皱、枕头、床头软包压线、旅行箱皮革滚边、锁扣与弧形提手 |
| 赫伯房间 | 绒布床品、软榻与坐凳、香水瓶标签和瓶口、披巾包边与短流苏 |
| 多莉房间 | 亚麻床品、绒布被面、阅读书页切口与书签、玩偶羽毛细节 |
| 岛主层 | 石材地面、皮革会客沙发、缝边坐垫、柜体木纹、桌面键帽与家具细边 |

琉璃塔各层沿用各自家具位置、配色、房间缩放及电梯通道。中文标题和门牌继续使用网页原生文字，不烘成空白面片。新模型按楼层加载，支持原版／精修切换；灯纸图片保留，并同步原有昼夜和开关状态。

## 下载来源

纹理使用 1K 的颜色、粗糙度与 OpenGL 法线图片。复用本项目已下载的七组神社贴图，并新增以下三组：

- [Poly Haven marble_01](https://polyhaven.com/a/marble_01)：琉璃塔地面。
- [Poly Haven leather_white](https://polyhaven.com/a/leather_white)：沙发软包、床头、旅行箱。
- [Poly Haven velour_velvet](https://polyhaven.com/a/velour_velvet)：被面、靠垫及绯华楼紫色软装。

Poly Haven 材质按 [CC0 授权](https://polyhaven.com/license) 使用；和纸、榻榻米来自 ambientCG，授权见 [ambientCG license](https://docs.ambientcg.com/license/)。

完整下载 URL、授权、分辨率和本地文件路径保存在 `assets/textures/indoor-common/manifest.json`。原始图片保留在 `assets/textures/indoor-common/` 和 `assets/textures/shrine-residence/`；官方 API 元数据保存在各自 `sources/` 中。`styled/` 保存由原图派生的低对比配色贴图和 glTF 粗糙度打包图，不替换原始下载文件。

颜色贴图使用 sRGB，法线和粗糙度使用 Non-Color。导出的 GLB 内嵌图片；材质的表面细节来自下载图片，几何部分承担轮廓、软包缝边和布料垂边。

## 可编辑母版与制作脚本

- `art_source/blender/bedroom-pbr-v2/bedroom-pbr-v2.blend`
- `art_source/blender/office-pbr-v2/office-pbr-v2.blend`
- `art_source/blender/feihua-pbr-v2/feihua-pbr-v2.blend`
- `art_source/blender/tower-lobby-v1/tower-lobby-refined-v1.blend`
- `art_source/blender/tower-hecate-v1/tower-hecate-refined-v1.blend`
- `art_source/blender/tower-hebe-v1/tower-hebe-refined-v1.blend`
- `art_source/blender/tower-dolly-v1/tower-dolly-refined-v1.blend`
- `art_source/blender/tower-owner-v1/tower-owner-refined-v1.blend`

各母版按部件或家具区域分组；保留图片、UV 和细分件。对应文件夹中的 `material-assignment.json` 记录材质和原图来源。既有 v1 母版保留，神社位置调整写入其现有母版。

制作脚本位于 `D:/3D模型/scripts/indoor_pbr_common.py`、`upgrade_existing_indoor_pbr.py`、`refine_web_tower_pbr_v1.py`。现有母版的打开与升级分两次 MCP 调用执行，以等待 Blender 刷新上下文；琉璃塔脚本用 `FLOOR` 选择楼层。网页原件导出入口为 `scripts/export-tower-interior-source.mjs`，只用于建模数据准备。

本轮没有部署 GitHub，也没有进行运行、视觉或交互验收。
