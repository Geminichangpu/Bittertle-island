# 基地卧室 Blender MCP 分件精修 v1

本轮根据用户提供的白天卧室图，先分析形状、结构与材质，再通过 Blender MCP 制作室内分件。物件分析见 [bedroom-reference-analysis.md](bedroom-reference-analysis.md)。

## 完成的制作

床架、床头板、厚床垫、带垂边的连续床单与左右枕分别建模；书桌采用开放腿部空间与浅抽屉，木椅使用宽曲面靠背、略外撇椅腿和横撑。床侧书柜采用三层开口，高书柜与桌上书格按现有位置布置，书籍分别包含封皮、书脊、纸页、标签，并有高度、厚度、倾角和摆法的差异。

窗帘左右分件制作，包含褶皱、束带、折边和缝线。门窗补充木板缝、压条、合页、金属底座和螺丝。桌旁补木框镜面、风景相框、笔筒、铅笔和纸张；图片未展示的后角储物柜、藤编篮及地毯沿用同类木色与素色织物。

实际使用 Blender 5.2.3 LTS；开始时 Blender 未运行，启动本机安装并恢复既有 MCP 服务后完成建模、保存与导出。未使用付费生成服务。

## 文件与可编辑结构

- `art_source/blender/bedroom-v1/bedroom-refined-v1.blend`：可编辑母版。
- `Bedroom_Interior_v1`：独立室内场景。
- `Bedroom_Refined_v1`：精修集合，按床架、床垫、床单、各个枕头、书桌、木椅、各书架、各本书、窗帘和摆件继续细分。
- `Bedroom_Original_Archive`：隐藏的原室内网格归档。
- 同目录 `session-before-bedroom.blend`：操作前 Blender 会话副本。
- 同目录 `source-meshes.json`、`source-manifest.json`、`bedroom-original.glb`：现有生成器提取的源网格、来源信息与原件。
- 同目录 `textures/`：为本轮制作的木纹、布纹贴图；材质与用户参考图均打包进母版。参考图只作为 Blender 中的制作资料，不进入网页模型。
- `src/assets/models/bedroom-interior-refined-v1.glb`：网页使用的精修室内。

脚本：工程内 `scripts/export-bedroom-source.mjs` 与 `scripts/export-bedroom-source-entry.ts`；`D:/3D模型/scripts/refine_web_bedroom_v1.py` 和 `D:/3D模型/scripts/export_web_bedroom_v1.py`。建模脚本复用树屋脚本内的纯网格构造函数，不执行树屋场景代码。后续制作应另存新版本，避免覆盖已有同名精修场景。

## 网页接入与边界

进入基地卧室默认加载精修版，底部可切换“原版室内 / 精修室内”；加载失败保留原版并提供重试。`?models=original` 仍可强制初始使用原版。

模型保留原来的反 L 房间轮廓、室内横向放大和 Z 轴镜像；不改动小岛上的建筑外观、坐标与地形。保留当前开门角、出口点和相机视角，参考图中的门板样式用于细化门的形状，并未把出口状态改成另一种逻辑。

网页按原墙体与天花容器分别替换可见网格，剖面视角继续隐藏对应部分；窗外景物保留。原有碰撞数据继续用于漫游，新可见模型不整批当成大碰撞盒。玻璃与灯罩复用室内原有昼夜材质；精修网格转换为可互动实例，并在切换时重新关联书本、绿植、灯和夜景互动，保留静音状态。仅切换/加载时请求绘制，无新持续动画。

本轮只进行模型制作、导出和 `node scripts/package-local.mjs` 本地打包。遵照“不要验证”，未执行测试、类型检查、浏览器、截图或渲染验收；上述接入行为尚未运行验收。
