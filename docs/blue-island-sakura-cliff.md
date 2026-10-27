# 蓝色小岛界面、神社樱花与海边山崖

## 界面

海水蓝主按钮、浅蓝面板、云白背景和轻柔阴影，覆盖编辑器、展示页、漫游控件及室内提示。保留原有操作，将模型版本选项收纳到“模型外观”菜单，降低底部遮挡。

## 神社后方的樱花树

参考图 1：粗壮分叉树干、横向舒展的树枝、粉白分层花冠、独立五瓣花、小叶簇与地面落瓣。使用已有杉木树皮颜色、法线和粗糙度贴图。

樱花树实际归属 `shrine_group`，与神社一起管理，并作为神社整体漫游的观察点。调整归属时通过世界矩阵转回神社局部坐标，保留当前位置、朝向和大小。


## 当前修订 v4：神社海岸材质与低矮坐石

神社岸边原本属于地形的纯色陡坡使用与海崖相同的 Marble Cliff 01 岩壁材质与纹理尺度，保留上方平坦草地。覆盖层跟随原有地形三角面，不改变地形与漫游支撑。

望海石上表面降低至离地约 0.63 场景单位，对应漫游人物约膝高的坐石；保留宽平石面，石脚埋入地面，边缘裂纹和碎石同步缩低。

新母版：`art_source/blender/scenic-coast-v4/coast-sitting-stone-refined-v4.blend`；网页山崖模型更新为 `scenic_cliff-refined-v4.glb`。樱花树继续使用 v3。只更新本地包，不做验证。

## 修订 v3：无路草地、连续高地和完整树干

- 海崖内侧及樱花树到海崖之间不再生成路径；自动寻路也避开这片区域。
- 删除海崖整片黄褐色草岩覆盖面，直接显示小岛原有草地颜色。只在海侧沿自然崖缘保留宽度不一的碎石地带，使用已有 Rocky Trail 贴图。
- 内陆侧增加两排错落树木和灌木，包围草地，朝海一侧保持视野；望海石仍在山崖内部。
- 连续高地延伸至神社一侧，降高过渡移到外围；相应海岸顶点不再被强制压到旧沙滩高度，并补上高地侧面的岩壁。
- 樱花树干和枝条改为连续环形截面网格，转折处共享顶点，不再使用互相分离的封口圆柱。漫游碰撞仍采用逐段代理，避免大包围盒封住场地。
- 新母版：`art_source/blender/scenic-coast-v3/sakura-coast-grove-refined-v3.blend`。
- 当前网页资产：`scenic_sakura-refined-v3.glb`、`scenic_cliff-refined-v3.glb`。
- v1/v2 母版保留；本次通过 Blender MCP 制作，仅更新本地包，未进行测试、浏览器或渲染验证。

以下 v2 小节为上一版记录，以本节为准。

## 独立海边山崖（2026-10-27 修订）

参考图 2 镜像朝向：海在右侧（+X），陆地在左；海岸由几个大小不同的凸岬、凹口组成，不再使用圆弧状的多排堆石。连续岩体共用顶点，带纵向褶皱、侵蚀凹面、岩草交界，向下延伸至海面以下。顶部草岩地面与弯曲碎石径配套，保留内陆侧树木和低矮植被。

神社到山崖之间使用连续高地，主体高度同为 14，外围平缓过渡；樱花树下保留轻微隆起。神社原建筑地基和建筑变换保持原样。

地图只保留一个 `scenic_cliff` 单体，删除旧的空 `coast_group` 布局分组。宽厚望海石并入山崖模型，位于局部坐标 (-5,0,-11)，不再是对象列表里的同级地点。Blender 中仍可单独编辑石头网格。漫游菜单显示“海边山崖 · 漫游”，内部保留旧漫游路由 ID 以兼容入口。

聚焦改为取对象实际世界包围盒中心，避免空分组原点导致相机跳到岛中央。海崖漫游沿实际地形支撑，隐形边界随自然岩缘布置。

## 文件与制作

- 布局：`比特尔特岛-布局.json`、`dist-viewer/project.json`。
- 本轮修改前备份：`art_source/blender/scenic-coast-v2/layout-before-scenic.json`、`viewer-before-scenic.json`。
- 樱花树母版沿用 `art_source/blender/scenic-coast-v1/sakura-seaside-cliff-refined-v1.blend`。
- 新海崖母版：`art_source/blender/scenic-coast-v2/natural-seaside-cliff-refined-v2.blend`。
- 新网页模型：`src/assets/models/scenic_cliff-refined-v2.glb`，含内部望海石。
- 几何：`src/generators/coastal-cliff.ts`、`src/generators/scenic.ts`。
- 迁移：`src/data/scenic-upgrade.ts`；旧存档自动升级到 scenicCoast revision 2。
- 新下载贴图及来源授权：`assets/textures/scenic-coast-v2/LICENSE-and-sources.md`。Poly Haven CC0 Marble Cliff 01、Aerial Grass Rock、Rocky Trail；保留 API 文件清单和原始贴图。

通过 Blender MCP 制作并保存模型，更新本地网页包，不发布 GitHub。沿用此前要求，未进行测试、浏览器漫游或渲染验证。
