# 灯塔 Blender 往返试点

## 本轮边界与工程审查

工程目录保持为 `D:\3D模型\网页3D\Bittertle island`。实际技术为 React 19、Three.js 0.180、Vite（已安装 7.3.7），模型由 `src/generators/` 程序化生成，重复细节使用 InstancedMesh。首次检查无 Git 仓库；按用户后续指示，不初始化 Git、不配置或发布 Pages。

本轮只替换 `layout_lighthouse` 的可见子网格。未修改地形、布局 JSON、建筑根节点、碰撞/室内系统、NPC 或存档 schema。其他建筑保持程序化。海面 Shader、动态灯光与网页表面噪声不能由普通 glTF 完整导出；精修 GLB 使用可移植 PBR 材质，灯光角色在网页端恢复。

## 文件与对应关系

| 用途 | 路径（相对本工程） |
| --- | --- |
| 原始网页网格 | `art_source/blender/lighthouse-v1/lighthouse-original.glb` |
| 来源 ID、参数、坐标与统计 | `art_source/blender/lighthouse-v1/source-manifest.json` |
| 操作前 Blender 会话副本 | `art_source/blender/lighthouse-v1/session-before-pilot.blend` |
| 可编辑母版 | `art_source/blender/lighthouse-v1/lighthouse-refined-v1.blend` |
| 网页使用模型 | `src/assets/models/lighthouse-refined-v1.glb` |
| 网页导出工具，仅命令行开发使用 | `scripts/export-blender-pilot.mjs` |
| 模型加载、参数匹配、回退 | `src/models/LighthouseRefinement.ts` |
| 检查记录及截图 | `reports/blender-pilot/` |

可复用 Blender 脚本保留在 `D:\3D模型\scripts\refine_web_lighthouse_v1.py` 与 `D:\3D模型\scripts\export_web_lighthouse_v1.py`。

## 本次实际执行记录

- MCP 已实际读取 Blender 5.2.3 LTS、当前场景及对象。插件 1.6，协议 5，服务端期望 15；读取场景、执行 Python、look 多视角预览实际可用。没有使用付费生成服务。
- 开始时用户场景是未保存的默认 Cube/Camera/Light。先保存会话副本，再建立独立 `Lighthouse_Refinement_v1` 场景；原场景和原网格均保留。
- 网页端从真实生成器提取灯塔，将 20 个实例批次展开为 444 个可编辑对象，导出 GLB。Blender 导入、精修、保存和最终 GLB 导出均通过 MCP 执行保存的 Python。
- 原件置于隐藏的 `Lighthouse_Original_Archive` 集合；精修母版在 `Lighthouse_Refined_v1` 集合，有 183 个独立可编辑网格。
- 精修：48 边平滑塔身、闭合砖缝、透明灯室玻璃、灯芯底座及透镜环、阳台栏杆、屋面压条、窗框/窗台、入口拱饰及小倒角。保留红白色带、八角屋顶及原尺寸。
- 导出时仅复制精修集合，在临时场景按材质合并。必须同时启用 `use_selection=True` 和 `use_active_scene=True`，否则当前 Blender 导出器会包含其他场景中的选中对象。最终 GLB 仅含一个场景、16 个网格。
- 导出器的 `export_format` 是动态枚举，当前 RNA 返回空列表；脚本读取已安装插件的 `get_format_items` 来选择 GLB。未把首次失败当作成功。

## 坐标与回导约定

GLB 使用物体局部坐标、Y 向上，根节点单位变换。Blender 导入时转换为 Z 向上；网页 +Z 对应 Blender -Y。保持米制单位比例 1，导出时 `export_yup=True`，不额外旋转或缩放模型。

来源灯塔根节点位置 `[-137, 2.1, -90]`、旋转 `[0,0,0]`、缩放 `[1,1,1]`，无父级。以上只是导出时记录，回导始终使用当前工程的根节点变换，不覆盖用户编辑。局部包围盒约 `[-6.5,0,-6.5]` 至 `[6.5,23.04,6.5]`。

只匹配 ID/template 为 `layout_lighthouse`，参数宽 10、深 10、墙高 23、墙色 `#ede3c7`、屋顶色 `#b95e43` 的对象。位置/旋转/缩放和父级可任意修改；尺寸或颜色参数不符时显示原程序化模型，避免旧精修文件悄悄覆盖新参数。

`SceneController` 保留原根节点，加载后替换可见子网格，并将原 objectId 绑定到所有新子网格。切换前后共用选择与变换入口。灯塔没有独立室内/碰撞路线，因此此试点不能证明所有其他建筑的碰撞、动画或寻路均可直接替换。

## 本地使用与回退

1. 在工程运行 `npm run dev`，打开命令显示的本地地址。
2. 右侧“灯塔外观”选择“原版模型”或“精修模型”；只读网页底部也有同样按钮。默认精修；加载期间、失败或参数不匹配时保留原版。
3. 要强制以原版打开，地址追加 `?models=original`。外观切换仅影响当前页面，不写入存档；刷新默认重新选择精修。
4. 原始模型生成器、GLB 和母版均保留。失败后可点“重试精修模型”。模型加载一次，切换复用资源；销毁场景释放 GLB 资源，异步加载完成后不向已销毁场景挂载。
5. `npm run build:viewer` 后 `npm run build`。GLB 通过 Vite `?url` 打包为内容哈希文件，自动进入原有只读分享包清单，适应子目录路径。此命令只做本地构建，不部署。

## 再次精修

1. 修改前保存新的版本副本；不要覆盖本轮来源 GLB 或母版。
2. 导出原件：本地开发服务运行时执行 `node scripts/export-blender-pilot.mjs`。该脚本针对当前灯塔，若需要新版本，先修改输出目录，避免替换现有来源记录。
3. MCP 只读检查当前 Blender；建立新的独立场景，导入 GLB。首次生成脚本带有重复执行与覆盖保护，不应直接在已有精修集合上重跑。
4. 修改母版中的精修集合。保持局部原点与源尺寸；材质名末尾 `_lamp`/`_window` 或 `lightRole` 自定义属性用于网页昼夜联动。
5. 使用导出脚本生成模型；新版本使用新的文件名。透明玻璃在网页使用双面、关闭深度写入；本试点无外部贴图、压缩解码器或动画依赖。
6. 核对 GLB 场景数、包围盒、面数、材质、实际网页外观及鼠标选择，再更新加载映射。源 `.blend` 不随网页分享包发布。

## 夜间流星

在全岛全景下选择“夜晚”后，等待约 15 秒出现第一颗流星；之后每约 15 秒一颗，每次飞行 1.45 秒，从右上向左下划过，轨迹在画面上部略有变化。使用浏览器合成动画绘制轻量天空叠层，岛屿 WebGL 仍按需渲染；没有为等待流星启动持续渲染循环。

聚焦建筑、放大近看、正俯视、切换白天/黄昏、进入室内、页面隐藏或视口离开可见区域时立即取消动画和等待。恢复可见夜间全景后重新计时 15 秒，不补发后台积攒的流星。流星不参与拾取、碰撞或存档。它是屏幕上方的氛围效果，不是可碰撞的三维天体；网页 PNG 导出仅包含 3D 场景，不含这个临时叠层。

实现位置：`src/environment/NightMeteors.ts`，外观在 `src/style.css`。浏览器证据见 `reports/blender-pilot/`。
