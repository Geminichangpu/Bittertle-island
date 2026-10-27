# 神社居住区 Blender MCP 分件与图片材质升级

依据夜晚神社庭院参考图，先完成 [物件与形状分析](residence-reference-analysis.md)，再通过 Blender MCP 在 Blender 5.2.3 LTS 中制作分件、配置下载的图片材质并导出。

## 造型

保留原房间尺度、家具原点、门洞与缘侧通道。细化缘侧前沿、柱脚石础和木钉；障子增加下裙竖板、收边、滑轨、凹拉手及纸纤维表面。榻榻米保持原铺法，替换原有密集纯色细线为真实草编图片，并增加窄布包边；室内沿墙补木腰板。

图片未展示的室内采用现有布局：茶桌增加厚面与曲脚，配空心杯、带盖茶壶、托盘与茶巾；坐垫、铺褥和枕头使用饱满曲面，薄被有连续褶皱、侧边下垂及接缝。低柜按原范围重做木框纸拉门、凹拉手，并细化书册、盆栽和挂轴木轴。

缘侧风铃采用薄壁玻璃曲面、圆口、内舌、细绳和弯折纸签。石灯分成石础、柱、火袋、透光窗、四角曲面笠顶与顶饰；踏石沿原路径重做不规则扁平轮廓，并在原庭院植物区域补叶簇。

## 真实下载贴图

七组官方免费 CC0 材质均为 1K：Fine Grained Wood、Dark Wood、Rough Linen、Grey Plaster、Dark Rock、Paper001、Tatami002。完整列表与授权见 [贴图清单](../assets/textures/shrine-residence/README.md)。

本轮读取了原室内生成器及导出的网格／材质信息：原模型以程序化颜色、几何细线和画布材质为主。新增的是实际下载的 Base Color、Roughness、Normal 图片及派生颜色图片；为每个分件写入 UV。降低颜色反差与法线强度，避免强烈写实噪点。没有把整张参考图贴在模型表面。

材质使用兼容 glTF 的 Principled BSDF：颜色图片直连 Base Color，OpenGL 法线经 Normal Map 节点连接；粗糙度预打包到图片绿色通道、金属度为蓝色零值，避免导出时临时重编码的目录权限问题。原图片、派生图片和节点均保存，继续编辑不依赖网络。

## 文件

- `art_source/blender/residence-interior-v1/residence-interior-refined-v1.blend`：可编辑母版。
- `Residence_Interior_v1` 场景 / `ResidenceInterior_Refined_v1` 集合：按门板、风铃、石灯、家具、寝具等分件。
- `ResidenceInterior_Original_Archive`：原始网格归档；同目录 `session-before-residence.blend` 保留操作前会话。
- 同目录 `before/`：本轮相关原源码备份；`source-meshes.json`、`source-manifest.json` 和 `residence-interior-original.glb`：原件与来源。
- `src/assets/models/residence-interior-refined-v1.glb`：网页精修模型。
- `assets/textures/shrine-residence/`：贴图原件、派生文件、API 元数据、来源与授权清单。

制作脚本：工程内 `scripts/export-residence-interior-source.mjs`、`scripts/export-residence-interior-source-entry.ts`、`scripts/download-residence-textures.ps1`；以及 `D:/3D模型/scripts/refine_web_residence_interior_v1.py`、`pack_residence_roughness.py`、`export_web_residence_interior_v1.py`。纯网格函数复用已有脚本，不执行它们的场景创建代码。

## 网页与范围

进入神社居住区默认使用精修版，提供“原版室内 / 精修室内”切换；失败保留原版并可重试。`?models=original` 可从原版启动。家具、墙、天花、室内庭院景物分别替换，沿用现有剖面视角、漫游碰撞和交互配置。

灯具保留纸纹图片材质，通过同步原灯状态响应昼夜与开关；风铃、茶壶、灯笼和庭院夜间互动沿用既有位置。岛上外部建筑材料不修改，无新增持续动画。

依据用户直接指令，本次只做神社居住区，没有按《贴图需求.md》的默认顺序重做基地卧室。未进行截图、渲染、测试、类型检查、GLB 图片嵌入检查或浏览器验证；只制作、导出与同步本地启动打包。实际网页效果尚未经运行验收。
