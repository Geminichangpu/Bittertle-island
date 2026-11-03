# 0.20.1 水面与环境控制

新增可选的动态水面、近岸倒影与地名显示控制。动态水面默认关闭；倒影仅在动态水面启用后可选。水面加载失败时回退到原水面。

动态水面接入 Ultra-Water 的 FFT、网格和岸浪求解，使用现有海岸线估算水深，仅启用垂直位移；近岸倒影使用 Three.js Reflector。上游来源和许可见 `src/vendor/ultra-water/`。

本机 Chrome / RTX 2060 SUPER 做过短时预览；移动设备、其他 GPU、长时间运行和自动帧率降级尚未验证。原始预览截图与测量记录保存在本机 `reports/ultra-water-preview-20261103/`。
