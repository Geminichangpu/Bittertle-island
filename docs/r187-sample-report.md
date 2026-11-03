# 神社入口、岸线与树木：本地检查记录

这是推送前的本地样板阶段记录。用户确认效果后的清理和加载复测见 [发布检查记录](publish-r187-20261103.md)。下文“没有推送”描述当时的阶段状态。

仅本地修改，**没有推送或部署**。原分支 `main`、原 HEAD `d987c84`，开始时未提交修改为 0；当前工作分支 `work/r187-shrine-sample`。未改用户布局、原始 GLB、Blender 母版或其他任务文件。

- [本地滑动对比页面](http://127.0.0.1:4190/reports/r187-sample/compare.html)
- [本地只读成品](http://127.0.0.1:4191/)
- [本地样板近景，编辑器](http://127.0.0.1:4190/?sample=shrine)
- [独立迁移记录](r187-migration.md)

本地恢复包：`reports/r187-sample/recovery-d987c84.zip`，保存原提交的 Git 文件；忽略的原始纹理仍在原处。`main` 未移动。可恢复到原提交或下面各阶段，不需要覆盖其他任务工作。

| 本地提交 | 范围 |
| --- | --- |
| `2e0b9df` | r187 依赖、WebGL 兼容、手动矩阵、阴影与贴图尺寸修复 |
| `ced6bfe` | 神社无量化 Meshopt、按需加载解码器 |
| `14564a4` | 神社样板材质／构件／道路植物与可选水面微动 |
| `71a7cc7` | 用户追加的普通树、樱花和精模树冠修整 |

## 实际效果与范围

Three.js 与匹配类型包固定为 **0.187.0**，addons、GLTFLoader、MeshoptDecoder 随同包升级。继续使用 **WebGLRenderer**。迁移依据为用户提供的 [r187 发布说明](https://github.com/mrdoob/three.js/releases/tag/r187) 和 [官方迁移指南](https://github.com/mrdoob/three.js/wiki/Migration-Guide)。未迁移 WebGPU。

神社保留现有屋瓦、格窗和斗拱，在独立实例层中补窗台和窗上框、檐口滴水边、台阶前沿、主殿侧栏、墙脚收边，以及入口道路的碎石过渡、断续路缘石与小组植物。未改建筑位置与布局。新增三组 64×64 共享底色／法线／粗糙度贴图在内存生成，不增加图片 HTTP 下载；路面、岩石和植物尽量复用现有资源。

水面使用一个 128×128 岸距遮罩表现浅水到深水颜色，微动为轻微解析波纹和岸边亮纹，无反射相机、无全岛实时反射、无深度预通道。项目没有海底地形数据，水深是**由岸距估算的视觉过渡**。微动默认关闭，手动开启后最多约 20 次/秒请求绘制，仅在神社近景且页面可见时运行；返回全岛、进入室内或页面隐藏时暂停，并尊重减少动态效果偏好。

普通共享树冠从实心球改为带尖端和折面的叶簇：单个冠体 **180 → 176 三角形**，没有透明混合、独立叶片对象或新叶片图片。现有枝干和分支保留，小岛环树、普通树林与灌木共用这一几何。樱花去掉粉色实心球，使用现有弯曲枝干与成组的五瓣花，形成有空隙的分层花枝。学堂、海崖等精模和树屋中烘焙的旧球冠也被替换，避免精模加载后又恢复球体。旧精模中的隐藏冠体分配随原资产生命周期释放，未重建全岛高精度树木。

DemandRenderer、实例化、目标距离／视锥决定精模加载、两个并发上限、离开近景卸下精模、静态阴影缓存均保留。全局 DPR 上限未提高；流畅画质仍限制 DPR 为 1。

## 同镜头截图与绘制测量

条件：同一台 Windows / RTX 2060 SUPER，Chrome Headless / ANGLE D3D11，1440×960 浏览器窗口、**1440×850 画布、DPR 1**，标准画质、白天。固定相机在 `reports/r187-sample/cameras.json`；树木近景在 `foliage-cameras.json`。

每个镜头预热后做 12 次 `render + gl.finish`，记录 CPU 提交与等待 GPU 完成的同步耗时。**这不是 FPS，也不是其他显卡的性能保证。** 下表是单次采集，耗时存在波动，不据此宣称帧率提升。

| 镜头 | 调用：r180 → 最终 | 三角形：r180 → 最终 | 同步绘制中位 ms：r180 → 最终 | 最终 p95 ms | 静止 1 秒新增帧 |
| --- | --- | --- | --- | --- | --- |
| 入口 | 457 → 462 | 1,970,381 → 1,996,421 | 4.1 → 3.3 | 3.7 | 0 → 0 |
| 岸线 | 542 → 547 | 2,053,886 → 2,082,614 | 5.1 → 3.7 | 4.7 | 0 → 0 |
| 细部 | 327 → 332 | 1,787,724 → 1,814,840 | 1.8 → 2.3 | 3.3 | 0 → 0 |

最终场景净增加 5 次调用，三角形增加约 1.3%–1.5%。细部镜头中位耗时增加 0.5 ms，应由用户结合真实浏览器体验判断是否接受。单独的升级阶段对照见迁移记录；样板美术和追加树木阶段也分别保留 JSON。

| 对比 | 修改前 | 修改后 |
| --- | --- | --- |
| 入口 | [PNG](../reports/r187-sample/before-entrance.png) | [PNG](../reports/r187-sample/after-entrance.png) |
| 岸线 | [PNG](../reports/r187-sample/before-coast.png) | [PNG](../reports/r187-sample/after-coast.png) |
| 细部 | [PNG](../reports/r187-sample/before-joinery.png) | [PNG](../reports/r187-sample/after-joinery.png) |
| 樱花追加修改 | [PNG](../reports/r187-sample/foliage-before-sakura.png) | [PNG](../reports/r187-sample/foliage-after-sakura.png) |
| 普通树林追加修改 | [PNG](../reports/r187-sample/foliage-before-grove.png) | [PNG](../reports/r187-sample/foliage-after-grove.png) |

截图和恢复包在本地被 Git 忽略的 reports 目录，未作为网站资源加入构建。樱花／树林的“修改前”已包含 r187 与神社样板，用于隔离树木改动。

## 下载与慢设备模拟

八个神社外景采用无量化 Meshopt：**26,623,412 → 18,250,244 字节，减少 31.45%（约 7.99 MiB）**。逐项比对了解码后的 accessor 数据、节点矩阵、纹理字节和材质／网格数量；原件保留。新增压缩件只有靠近神社时才下载。解码器独立分块，首屏不请求。樱花采用程序化花枝后，不再下载原来 **8,997,060 字节（8.58 MiB）** 的球冠 GLB。

成品冷加载检查条件：1280×800 窗口，设备 DPR 2，Chrome 网络模拟 **10 Mbps / 80 ms 延迟**、**4 倍 CPU 降速**，无 HTTP 缓存，本地静态服务器不压缩响应。CPU 降速**不模拟较弱 GPU**。这些是单次模拟值，不能当作真实公网、移动设备或 CDN 数据。

| 测量 | 实际值 |
| --- | --- |
| 首次画布绘制、加载遮罩消失 | 41.989 秒 |
| 全岛首屏完成的资源正文 | 10,125,179 字节（约 9.66 MiB），25 项，不含主文档 |
| 全岛首屏高精度 GLB 请求 | 0 |
| 靠近神社后新增资源正文 | 63,542,511 字节（约 60.60 MiB） |
| 神社及近邻资源下载完成并静默 | 53.946 秒，包含 2 秒静默窗口，不等同完整交互就绪时间 |
| 精模峰值下载并发 | 2 |
| 靠近后完成 GLB | 8 个神社压缩件 + 商店街、海崖、农场、学堂；未请求旧樱花 GLB |
| 流畅画质实际画布 | CSS 与缓冲区均 1280×690，DPR 1 |

**网页加载仍是明显瓶颈。** 首屏同步生成场景、材质编译和已有大纹理开销没有在这轮全面重构；神社近邻的其他 GLB 仍较大。不能声称首屏比旧版更快，因为本轮没有同条件测量旧版的冷启动时间。进一步的首页 CPU 分片、近邻资源体积、纹理尺寸和缓存上限可在用户确认效果后单独处理。

## 已做检查与未验证项

- 类型检查、编辑器 Vite 构建、`node scripts/build-viewer.mjs` 通过。构建仅有原依赖 zod 注释标注警告，无构建失败。
- 最终固定镜头及场景检查：pageerror、console error、console warning、非预期失败请求均为 0。原版出现的占位贴图尺寸更新警告已修复。
- 三处现有 `onBeforeCompile`（surface-material / feihua-art / stylized-materials）用实际 r187 WebGLRenderer 编译通过。水面着色器在实际场景中绘制通过。
- 水面开启后在近景一秒绘制 18 帧、阴影重算 0 次；返回全岛后水面停止、额外帧 0、挂载精模 0。轻微镜头调整后阴影重算 0。
- 神社漫游有 6 个可用地点、5,164 个原有碰撞盒；铃绳有 3 个互动部件，触发动画成功。
- 神社住居、基地卧室精修 GLB 加载成功，分别保留 4 / 6 个镜头，互动部件存在，能进入漫游并返回。未将此检查扩展为复杂回归。
- **未验证**：其他真实 GPU、手机触控、长时间显存／缓存行为、全部室内／琉璃塔楼层、全部布局变体、真实公网部署、WebGPU。近景纹理估算仍可达约 430 MiB（不含驱动与阴影等，非实际显存测量），低端设备尚未验收。

## 实际修改文件

| 范围 | 文件 |
| --- | --- |
| 依赖 | `package.json`、`pnpm-lock.yaml` |
| WebGL 兼容 | `src/render/lighting.ts`、`src/interiors/InteriorController.ts`、`src/generators/shrine.ts`、`src/exploration/CompoundController.ts`、`src/environment/nature-materials.ts` |
| 近景模型加载 | `src/models/RefinementManager.ts`、`src/models/loadAbortableGLB.ts`、`scripts/prepare-shrine-meshopt.mjs` |
| 新增压缩资产 | `src/assets/models-optimized/shrine_{main,torii,temizu,office,residence,court,path,garden}-exterior-meshopt-lossless.glb`（8 个） |
| 样板与水面 | `src/environment/shrine-sample.ts`、`src/environment/sample-water.ts`、`src/environment/environment.ts`、`src/environment/EnvironmentManager.ts`、`src/environment/time-state.ts`、`src/scene/SceneController.ts`、`src/components/EnvironmentControls.tsx` |
| 树冠与花枝 | `src/environment/nature-geometry.ts`、`src/generators/scenic.ts`、`src/generators/layout-buildings.ts`、`src/models/foliage-refinement.ts` |
| 检查与记录 | `scripts/capture-r187-sample.mjs`、`scripts/check-r187-sample.mjs`、本文件、`docs/r187-migration.md`；截图／JSON／对比 HTML 在本地 `reports/r187-sample/` |

重新预览：在项目目录执行 `node scripts/serve.mjs dist-viewer 4191`；固定截图／场景检查另需 4190 端口 Vite 开发服务器。采集脚本需本机 Chrome，可用 `BROWSER_PATH` 指定。原版基线必须在原提交运行，避免覆盖已有 before 记录。
