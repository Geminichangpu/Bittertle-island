# 外景自然素材与入口修正

## 本次修改

- 市集：两棵棕榈移到摊位外侧，增加与原平台连接的种植基座，调整彩旗绳端点。原生模型和 Blender 精修 GLB 同步更新。
- 绯华楼温泉：庭院入口的两片蓝色门帘收向门柱，中央保留 1.61 个源模型单位净宽；题字移到横梁上方，绣纹随门帘移位。碰撞代理采用相同侧帘尺寸。
- 漫游：桥、副楼、温泉的落点使用各独立部件的局部坐标，消除重复叠加建筑群偏移的问题。
- 岛上道路：保留现有路线与贴地方式；普通路线使用碎石路贴图，连接基地、神社及图书馆的路线使用石铺路贴图，保留边缘色差。
- 树木：杉木树皮颜色、OpenGL 法线和粗糙度贴图；渐细树干、分枝、起伏树冠和折面小叶簇。环境植被与人工岛树木继续共享几何、使用实例化；独立树木模板也使用相同材质风格。
- 石头：三种不规则风化轮廓，降低平整多面体感，使用岩石颜色、法线和粗糙度贴图。海岸、山峰、人工岛石材及独立石头模板同步处理。
- 素材加载完成后请求一次按需重绘，不增加独立动画循环；更新环境时释放贴图资源。

## 下载素材与来源

| 用途 | 素材 | 来源 | 授权 |
|---|---|---|---|
| 自然道路 | gravel_road | https://polyhaven.com/a/gravel_road | CC0 |
| 树皮 | japanese_cedar_bark | https://polyhaven.com/a/japanese_cedar_bark | CC0 |
| 岩石 | rock_boulder_dry | https://polyhaven.com/a/rock_boulder_dry | CC0 |
| 石铺路 | PavingStones036 | https://ambientcg.com/view?id=PavingStones036 | CC0 |

下载通过 Poly Haven 和 ambientCG 官方 API 返回的链接完成。原始 1K 素材、API 元数据、ambientCG 压缩包保留在 `assets/textures/island-nature/`，逐项来源见该目录 `manifest.json`。网页版本在 `src/assets/textures/island-nature/`，保留 1K 分辨率，颜色贴图适度降低饱和度与对比度，以接近原有小岛配色。法线使用 OpenGL 方向。

授权说明：https://polyhaven.com/license 、https://docs.ambientcg.com/license/ 。threejsassets 免费库需要账户登录下载，本次采用上述无需账户即可下载的素材。

## 可编辑文件

- 市集：`art_source/blender/exterior-set-v1/island-exteriors-refined-v1.blend`，旧市集集合隐藏保留为 `ARCHIVE_market_before_palm_clearance`。
- 温泉入口：`art_source/blender/feihua-v2/feihua-entry-refined-v2.blend`，保留完整建筑群，只改入口相关部件；网页继续使用现有温泉 GLB 路径。
- 自然素材分件库：`art_source/blender/island-nature-v1/island-nature-material-library-v1.blend`，包含树干、分枝、树冠、叶簇、三种岩石与两种路面。源几何由网页实际使用的几何函数导出，贴图已打包。

## 本地交付

更新本地网页资源包，不部署 GitHub。按照用户要求，不运行测试、类型检查、浏览器验证、漫游验证或渲染验证；打包仅用于让现有本地启动入口读取本次修改。
