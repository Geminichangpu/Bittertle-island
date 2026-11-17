# 神社居住区 CC0 贴图

按 `贴图需求.md` 从官方 API 检索并下载，全部采用 1K 分辨率。原始素材和派生图片均保留。下载日期：2026-10-26。

| 来源 / 素材 | 实际用途 | 文件 |
| --- | --- | --- |
| [Poly Haven · Fine Grained Wood](https://polyhaven.com/a/fine_grained_wood) | 梁柱、障子框、柜子、茶桌与木作收边 | `fine_grained_wood/` |
| [Poly Haven · Dark Wood](https://polyhaven.com/a/dark_wood) | 缘侧地板、前沿、障子下裙 | `dark_wood/` |
| [Poly Haven · Rough Linen](https://polyhaven.com/a/rough_linen) | 坐垫、铺褥、枕头、薄被、榻榻米包边 | `rough_linen/` |
| [Poly Haven · Grey Plaster](https://polyhaven.com/a/grey_plaster) | 室内抹灰墙 | `grey_plaster/` |
| [Poly Haven · Dark Rock](https://polyhaven.com/a/dark_rock) | 石灯、石础、庭院踏石 | `dark_rock/` |
| [ambientCG · Paper001](https://ambientcg.com/a/Paper001) | 障子纸、柜门纸、灯罩、纸签、书页 | `Paper001/` |
| [ambientCG · Tatami002](https://ambientcg.com/a/Tatami002) | 榻榻米草编表面 | `Tatami002/` |

每组均下载 Base Color、Roughness、OpenGL Normal。ambientCG 下载包另外包含的文件随原包保留，不代表全部用于模型。

授权：以上资产均为 CC0 1.0。官方说明：[Poly Haven](https://polyhaven.com/license)、[ambientCG](https://docs.ambientcg.com/license/)。未调用付费生成服务，网页不运行素材站 API。

`manifest.json` 记录来源页、实际下载 URL、授权、分辨率和使用对象；`material-usage.json` 记录 Blender 材质与源贴图的对应关系；`sources/` 保存官方 API 元数据和原始下载包。

`styled/` 中的派生颜色 PNG 以下载图的明暗纹理为基础，降低反差并映射为参考图所需木色、草色及织物色。不是纯色替换。法线保留原始图，材质内强度为 0.17～0.30。粗糙度限制在 0.56～0.97，并预打包为 R=白、G=粗糙度、B=零金属度的 PNG，使用 Separate Color 直连 Principled BSDF。颜色图片使用 sRGB，粗糙度与法线使用 Non-Color。

用户要求不验证，因此没有纹理嵌入检查、网页截图或效果验收记录；素材已配置到母版并随 GLB 导出。
