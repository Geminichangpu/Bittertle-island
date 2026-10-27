# 树屋 Blender MCP 外观精修 v1

2026-10-26，使用 Blender MCP 在已连接的 Blender 5.2.3 LTS 中制作并导出。按用户指示，不运行类型检查、测试、渲染、截图或浏览器验证；只做模型制作、网页接入和本地打包。

## 制作范围

- 原有树屋位置、朝向、缩放、平台高度、房体与窗户位置继续沿用。
- 保留“无楼梯、无梯子、房体两侧及平台下方无斜木”的造型约束。
- 树干：重建有起伏的渐细树干，增加断续树皮纹、节疤和少量基部藤叶；按后续指示删除底部一圈放射状斜木，程序化原版与精修版同步。历史原件归档保留修改前内容。
- 树冠：沿原有各叶团的位置与尺度制作多层树冠和叶尖，保留绿色层次；屋后增加短段自然树枝衔接树冠。
- 木屋：增加墙板拼缝、角柱、木钉、山墙通风条、窗框装饰、窗台和把手。
- 屋顶：沿原坡面铺设独立绿色叠瓦、分段脊盖、木纹、封檐板与小铜钉。
- 平台：增加木板纹理、钉头、围栏柱帽与连接箍，保持原来的完整前栏杆。
- 不修改室内、地形、工程存档或其他建筑。

## 交付文件

| 文件 | 用途 |
| --- | --- |
| art_source/blender/treehouse-v1/treehouse-refined-v1.blend | 可编辑母版，包含精修与隐藏原件集合 |
| art_source/blender/treehouse-v1/session-before-treehouse.blend | 操作前 Blender 会话副本 |
| art_source/blender/treehouse-v1/source-meshes.json | 来自当前网页生成器的原始网格与实例矩阵 |
| art_source/blender/treehouse-v1/source-manifest.json | 来源对象、参数与变换 |
| art_source/blender/treehouse-v1/layout_treehouse-original.glb | 原始外观 GLB |
| src/assets/models/treehouse-refined-v1.glb | 网页使用的局部坐标精修 GLB |

母版采用独立场景 `Treehouse_Exterior_v1`、精修集合 `Treehouse_Refined_v1` 和隐藏原件集合 `Treehouse_Original_Archive`。此前灯塔与绯华楼的场景继续保留。模型按特征及材质组织为可编辑网格；小倒角保持为母版修改器，导出时只对临时副本应用并按材质合并。

脚本：工程内 `scripts/export-treehouse-source.mjs`，以及 `D:/3D模型/scripts/refine_web_treehouse_v1.py`、`D:/3D模型/scripts/export_web_treehouse_v1.py`。同名精修场景已经存在时，制作脚本停止以避免覆盖；后续精修应另存新版本。

## 网页使用

`src/models/TreehouseRefinement.ts` 仅替换 `layout_treehouse` 根节点下的可见网格，保留编辑选择和原始变换。当前宽 17、深 17、高 20、墙色 `#9b7445`、屋顶色 `#a6b764` 匹配精修模型。尺寸或颜色参数修改后回退程序化版本，移动/旋转/缩放继续生效。

编辑器与只读网页新增“树屋外观”的原版/精修切换。默认精修；加载期间或失败时保留原版。`?models=original` 可让全部精修对象先显示原版。窗户保留昼夜发光角色，所有细节保持静态，不增加持续渲染。

通过 `node scripts/package-local.mjs` 更新本地编辑器、只读启动文件与分享模板，不部署 GitHub，不运行验证。
