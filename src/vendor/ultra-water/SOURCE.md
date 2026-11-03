# Ultra-Water source

`water/OceanSim.js`, `water/OceanSurface.js`, `water/shoreMap.js`,
`scene/floaterShadow.js`, and `engine/fullscreen.js` are unmodified files from
https://github.com/Humpalumps/Ultra-Water at commit
`30ea65ecb0a66b137aa200d099965634bdd84d51`. See LICENSE and
THIRD_PARTY_NOTICES.md in this directory. The island adapter uses the upstream
FFT, adaptive mesh, displacement and shore-wave GLSL, and shore solver. It
supplies an approximate seabed based on coastline distance, an island-specific
surface material, and vertical displacement only. The full upstream optical
material, water-depth prepass and postprocessing are not included.
Optional near-shore reflections use the project's Three.js `Reflector` addon,
not Ultra-Water's perspective-only reflection pass.
