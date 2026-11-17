# Bittertle Island：只读版性能与渲染审计

分支：`optimize/viewer-performance`。基线提交：`243e8d6`。本报告是本地实验记录，尚未合并或部署到 `main`。

## 加载与黑色材质

- 旧版创建空建筑节点，启动时即请求全部精修外景；绯华楼及其他建筑组使用整组等待，任何一个失败会丢弃整组成功结果。
- 新版先显示原有程序化建筑，以相机目标距离、视锥和缩放决定精修对象；室外共用最多两个请求，按目标距离排序，逐个加载、挂载、缓存和失败重试。离开范围、进入室内、退出建筑群或销毁场景时取消不再需要的下载。直接进入建筑群会先显示低精度场景，再逐个替换精修建筑并重新绑定互动。
- 室内模型只在进入相应房间时请求；关闭房间取消下载，失败时可重新尝试。高精度模型在本次场景生命周期内缓存，尚没有 LRU 内存上限。
- `TextureLoader` 旧逻辑在 JPG 完成前就绑定了不完整纹理。阻断 JPG 可复现反馈图中的黑色道路、山顶岩石和中央岛外壁；现在先使用完整的中性色/中性法线纹理，下载成功后更新共享纹理，失败时保留占位。没有统一关闭阴影或材质。
- 海岸覆盖层移除零面积三角形；研究学堂的三处屋顶为退化屋脊顶点补用同一面片相邻法线，未移动顶点或改变 UV。开发诊断抽查最终首页 155 个不同几何体，没有发现缺失所需法线、缺失贴图 UV、零/非有限法线或非有限 UV。未证明每种浏览器和每个高精度场景都不存在其他阴影或穿插问题。
- 诊断仅在开发模式 `?diagnostics=1` 启用；`window.__islandDiagnostics` 提供 `stats()`、`surfaces()`、`setShadows(boolean)`、`setRoadWireframe(boolean)`、`setColorMaps(boolean)`。生产构建不包含这些诊断入口。

## 同机浏览器测量

条件：Windows，本地 HTTP，Chrome Headless + SwiftShader，1280×800，禁用 HTTP 缓存。使用原提交的独立临时源码副本重建旧版；新版使用本分支构建。HTTP 数字仅统计 HTTP(S)，不把嵌入图片的 `blob:` 资源计入网络传输。测量窗口为画布和“全岛”按钮出现后 30 秒，流量仅包括窗口内完成的请求。

| 指标 | 旧版 | 新版 | 说明 |
|---|---:|---:|---|
| HTTP 请求开始 / 完成 | 50 / 43 | 26 / 26 | 旧版还有 7 个请求未完成 |
| 已完成 HTTP 传输 | 91.98 MiB | 9.62 MiB | 新版约减少 89.5%；旧版实际最终量更高 |
| 高精度 GLB 开始 / 完成 | 27 / 20 | 0 / 0 | 首页鸟瞰，不进入室内 |
| 最大完成资源 | 绯华楼外景 18,981,084 字节 | 岩壁颜色图 1,249,282 字节 | 本地 HTTP Network 记录 |
| 画布和“全岛”按钮出现 | 8.78 秒 | 9.74 秒 | 单次结果，按钮可见的近似指标，不是严格 TTI；新版另一次为 15.65 秒，不能声称启动耗时已稳定改善 |
| 首屏 Draw Calls | 731 | 657 | 开发诊断，旧版取 30 秒、新版取 5 秒，旧版资源仍可能部分加载 |
| 首屏三角形 | 2,929,167 | 2,078,617 | 同上 |
| 几何体 / 纹理对象 | 685 / 302 | 155 / 42 | `renderer.info.memory`，不是字节数 |
| 几何 / 纹理近似占用 | 110.7 / 560.5 MiB | 13.2 / 141.0 MiB | 根据属性数组和纹理尺寸×4估算；不含驱动、阴影贴图等，不能当成实际显存 |
| 鼠标拖动时完成帧率 | 0.52 FPS | 0.83 FPS | 25 次自动鼠标移动的完成渲染帧数/耗时；SwiftShader 软件渲染，仅作本机实验，不能代表真实 GPU |
| 只读完整发布目录 | 514.99 MiB | 508.86 MiB | 仍包含其他原始室内资源；首屏不下载它们 |

三时段截图：[白天旧版](performance-screenshots/before-day.png) / [新版](performance-screenshots/after-day.png)，[黄昏旧版](performance-screenshots/before-dusk.png) / [新版](performance-screenshots/after-dusk.png)，[夜晚旧版](performance-screenshots/before-night.png) / [新版](performance-screenshots/after-night.png)。

贴图失败复现：[旧版](performance-screenshots/before-texture-failure.png) / [新版](performance-screenshots/after-texture-failure.png)。失败时新版暂用中性色，画面会与贴图完整加载时有差异。

## GLB 体积与压缩实验

[36 个原始 GLB 清单](performance-glb-inventory.json)列出文件大小、网格/primitive/顶点/三角形、材质、纹理、各嵌入图片大小和 SHA-256。原始 GLB 合计约 501.5 MiB；按嵌入图片字节 SHA-256 粗算，重复图片约 207.1 MiB（不意味着可以直接删除，材质、采样与色彩空间仍需逐项确认）。

| 最大原始文件 | 大小 | 网格 | 顶点 | 材质 | glTF 纹理引用 |
|---|---:|---:|---:|---:|---:|
| 绯华楼室内 | 63.94 MiB | 427 | 402,825 | 43 | 75 |
| 神社住居室内 | 43.19 MiB | 153 | 78,557 | 40 | 48 |
| 办公室室内 | 42.50 MiB | 387 | 141,896 | 49 | 75 |
| 琉璃塔 Hecate 室内 | 41.32 MiB | 338 | 139,830 | 63 | 57 |
| 琉璃塔 Dolly 室内 | 38.22 MiB | 322 | 129,778 | 50 | 51 |

- 绯华楼室内的无量化 Meshopt 实验：67,050,064 → 60,606,444 字节。已作为独立 `src/assets/models-optimized/feihua-interior-meshopt-lossless.glb` 接入；`src/assets/models/feihua-interior-refined-v1.glb` 原件保留，SHA-256 为 `6618346eea864f002b05b1702cbb0e25d7237325d2bc5ae7ecdffe5f2f61fae8`。
- 在相同实际室内相机下，无量化版本与原版截图基本一致，测得平均像素差约 0.000003；网格 449、三角形 244,208、4 个室内互动目标、视角和漫游均一致。[原始截图](performance-screenshots/interior-original.png) / [优化截图](performance-screenshots/interior-optimized.png)。此检查不等于所有 GPU、所有画角的人工验收。
- 常规量化 Meshopt 为 57,951,016 字节；虽然独立查看器能解码，但实际室内模型位置错误、互动目标丢失，因此未接入。
- Draco 为 54,442,496 字节；独立 Three.js 查看器可解码，但三角形统计从 274,384 变为 263,812，未完成实际室内互动验收，因此未接入。
- 一张 1024×1024 灰泥颜色 PNG 的 KTX2 ETC1S 实验：1,262,426 → 153,046 字节，转回 RGBA 与原图 PSNR 约 31.88 dB。只验证了单图编解码，没有接入 GLB 或验证各 GPU 兼容性；法线与数据贴图需要分别设定线性色彩空间和压缩质量。
- 原始 Blender 母版、原始 GLB 和根布局均未覆盖。实验文件及工具位于本地被 Git 忽略的 `reports/performance/optimized/` 和 `reports/performance/tools/`。

## 实例与交互

36 个原始 GLB 的节点中，没有找到同时引用相同 accessor、索引和材质的重复 primitive 组；这不排除不同 accessor 内存在字节相同的几何。程序化植被、岩石和建筑结构已有真正的分桶实例化；最终首页诊断为 498 个多实例批次、44,210 个实例，零个单实例 InstancedMesh。旧版相同诊断窗口中有 493 个单实例包装。

精修外景和室内的单个网格不再包装为 `InstancedMesh(..., 1)`；互动管理器同时支持普通 Mesh 和 InstancedMesh。浏览器单元检查了普通/多实例动画、实例索引、复位以及嵌套旋转和非均匀缩放（世界矩阵最大误差约 3e-7）。未对不同模型强行合并。

## 验证与复现

- `pnpm build:viewer -- --use-project-layout` 与 `pnpm build` 通过。
- `node scripts/test-performance-regression.mjs`：首页 GLB 0，峰值并发 2，单个绯华楼外景失败时其他部件继续加载，重试成功。
- 慢请求切回全岛时观察到请求 `ERR_ABORTED`，没有错误弹窗。直接进入基地/绯华楼建筑群后精修对象逐个替换；模拟基地鱼塘模型失败并重试，鱼塘水面与睡莲互动目标仍存在。
- 编辑器与只读版均打开办公室；模拟办公室失败后可重试并启用漫游。最终只读构建实际请求无量化 Meshopt 绯华楼室内并进入漫游。其他全部房间、楼层及真实硬件性能尚未逐一人工验收。
- `node scripts/audit-glb.mjs` 可重做原始 GLB 清单；需先构建只读版，再运行 `node scripts/test-performance-regression.mjs`，可用 `BROWSER_PATH` 指定浏览器。两个 `scripts/test-*-interaction*.mjs` 需要先在 5173 端口启动 Vite viewer 开发服务器。
- 可选的压缩工具安装到被忽略的独立目录：`npm install --prefix reports/performance/tools --no-save @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 meshoptimizer@1.3.0`；`node scripts/prepare-feihua-meshopt.mjs` 只生成报告目录下的副本，不自动覆盖原件或正式资产。应重新完成画面、互动与目标浏览器验证后再采用任何新产物。

剩余工作：进一步降低全部室内纹理体积、验证 KTX2 的色彩空间和设备支持、为长时间探索增加缓存上限，并在用户真实浏览器/显卡上复测首屏时间、交互 FPS、全部房间及用户反馈地点。不要把当前 SwiftShader 结果当作线上硬件验收。
