# r180 → r187 兼容升级（与样板美术分开）

基线：`main` / `d987c84`，开始时工作区干净。工作分支：`work/r187-shrine-sample`。
恢复包：本机 `reports/r187-sample/recovery-d987c84.zip`（原提交所有受 Git 管理文件；被忽略的原始纹理仍保留在原处）。未改动用户布局、Blender 母版或其他任务文件。

官方依据：[r187 发布说明](https://github.com/mrdoob/three.js/releases/tag/r187)、[Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)，逐段核对 180 → 187。

| 实际命中 | 处理 |
| --- | --- |
| three、@types/three 0.180.0 | 升级到 0.187.0；OrbitControls、TransformControls、GLTFLoader、MeshoptDecoder、OBB、几何 addons 均随同一 three 包升级 |
| r182 WebGL PCFSoftShadowMap 弃用 | 岛屿/漫游共享灯光和室内均改 PCFShadowMap，保留原分辨率和阴影缓存 |
| r185 手动 matrix + matrixAutoUpdate=false | Builder 单体和 CompoundController 碰撞代理显式设置 matrixWorldNeedsUpdate；InteractionManager 已设置，无需修改 |
| 三处 onBeforeCompile | surface-material、feihua-art、stylized-materials 未命中改名的 chunk/API；保留实现，实际场景检查编译 |
| ShaderMaterial 水面 | fog、tonemapping、colorspace chunks 仍有效；迁移阶段保留原水面 |
| 首次基线出现 GL_INVALID_VALUE 贴图警告 | 原有 1×1 占位升级为完整 JPG 时先 dispose GPU 存储再上传，保留共享 Texture 引用和失败占位；r187 类型显式声明 canvas/image 联合类型 |

未命中：TSL/WebGPU、PMREM/CubeUV、Sky、RoomEnvironment、Clock、FBX/PLY、原始 GL 像素存储、离屏 setViewport/setScissor、Object3D 子类自定义 dispose。未引入迁移补丁。

固定条件：Chrome Headless，RTX 2060 SUPER / ANGLE D3D11，1440×960 窗口、1440×850 画布、DPR 1、标准画质、白天。`scripts/capture-r187-sample.mjs` 保存固定 camera fixture、截图、renderer.info 和 12 次 render + gl.finish 的耗时样本。同步耗时不是 FPS，不代表其他显卡或网络。原始记录在本机 `reports/r187-sample/{before,compatibility}.json`。

| 镜头 | r180 / r187 调用 | r180 / r187 三角形 | 同步绘制中位 ms（r180 / r187） | 静止 1 秒新增帧 |
| --- | --- | --- | --- | --- |
| 入口 | 457 / 457 | 1,970,381 / 1,970,381 | 4.1 / 3.2 | 0 / 0 |
| 岸线 | 542 / 542 | 2,053,886 / 2,053,886 | 5.1 / 5.2 | 0 / 0 |
| 建筑细部 | 327 / 327 | 1,787,724 / 1,787,724 | 1.8 / 1.4 | 0 / 0 |

r187 这轮固定镜头采集：pageerror、console error/warning、失败资源请求均为 0。时间为单次采样，不能据此声称帧率提升。构建与最终场景验证见样板报告。
