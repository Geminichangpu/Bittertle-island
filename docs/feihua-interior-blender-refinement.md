# 绯华楼内部 Blender MCP 分件精修 v1

后续桌后通道调整：办公桌以原中心横向收窄至 78%，连同桌面陈设前移 0.6 个室内单位，办公椅后移 0.25。两侧柜体保留，桌侧形成绕行入口，桌椅之间增加进入办公位的空隙。Blender 母版、网页 GLB 和原版室内碰撞来源同步调整；不进行运行验证。

三张参考图的物件分析见 [feihua-interior-reference-analysis.md](feihua-interior-reference-analysis.md)。本轮实际通过 Blender MCP 在 Blender 5.2.3 LTS 内完成大厅、二楼外廊和办公室制作、保存与 GLB 导出。

## 制作内容

大厅：接待台厚顶、木框面板、竖板缝、中央花徽、铜铃、受付桌牌与手记分别建模。门帘使用分片连续褶皱曲面，配折边、挂环和圆花纹。原楼梯踏步增加圆润前沿与木钉，原红栏增加铜脚套、铆钉和顶帽；保持原坡度和栏杆路线。走道端部补竹纹挂轴，入口增加格子落地灯。

外廊：六角暖纸灯笼包含纸面、细框、花徽、盖底、吊环、链节和紫穗；地灯采用方格木框。沿原柱位补金属鞋、铆钉和木托，原办公室入口补弧形门楣与金饰。深色圆腹窄口陶瓶配独立木架、长叶和紫色花簇，位于原有种植区域。

办公室：重做三段金边漆木桌、角花和圆花徽，桌上配置纸张、毛笔、墨台与漆盒；紫背椅补木框、靠垫和织物花纹。四扇金屏风各自可编辑，梅枝跨屏延续，边框、铰链与花朵独立。壁龛增加滑门矮柜、曲干盆景、分层枝叶和红釉瓶。矮茶桌配曲脚、带垂边与流苏的紫金桌旗、鼓起的软坐垫、茶盘、陶壶与空心茶杯。边柜有带拉手的抽屉、金边和纹章陈列盘；榻榻米补包边，天花补横格梁。

## 文件与分件

- `art_source/blender/feihua-interior-v1/feihua-interior-refined-v1.blend`：可编辑母版，独立场景 `Feihua_Interior_v1`。
- `FeihuaInterior_Refined_v1`：按区域、物件和结构拆分集合；屏风扇、坐垫、花器、各盏灯、栏杆节点分别命名。
- `FeihuaInterior_Original_Archive`：隐藏的原室内网格。
- 同目录 `session-before-feihua-interior.blend`：制作前 Blender 会话副本。
- 同目录 `source-meshes.json`、`source-manifest.json`、`feihua-interior-original.glb`：原始网格及来源资料。
- 同目录 `textures/`：木纹、织物贴图；三张参考图和材质已打包进母版。参考图不作为网页中的背景贴图。
- `src/assets/models/feihua-interior-refined-v1.glb`：网页模型。

工程内提取脚本为 `scripts/export-feihua-interior-source.mjs`、`scripts/export-feihua-interior-source-entry.ts`。Blender 脚本为 `D:/3D模型/scripts/refine_web_feihua_interior_v1.py` 与 `D:/3D模型/scripts/export_web_feihua_interior_v1.py`；复用既有卧室、办公室、树屋脚本中的纯网格函数，不执行它们的场景创建代码。

导出时仅在相同部件、材质、区域及互动标签内合并临时副本，字体曲线转为网页网格，母版保留原分件与可编辑文字。

## 接入边界

进入绯华楼室内默认加载精修版，底部可切换“原版室内 / 精修室内”；失败时保留原版并提供重试。`?models=original` 可以从原版启动。

家具、墙体和天花分别装入既有容器，沿用一楼大厅、二楼走廊、办公室、一楼平面和楼层总览视角及剖面高度。保留房间根变换、两层高度、通道、楼梯、入口和原漫游碰撞；新装饰不重建碰撞。窗外原有景物继续使用，原建筑群外观、山腰平台和悬空桥不在本轮编辑范围。

灯纸复用既有室内灯材质，模型切换时重新关联前台手记、茶具、落地灯与外廊夜灯互动，保留静音和环境状态。无新增持续动画。

本轮仅制作、导出和同步本地启动打包。按用户要求未执行测试、类型检查、浏览器、渲染、截图或视觉验证，网页接入行为尚未运行验收；未部署 GitHub。
