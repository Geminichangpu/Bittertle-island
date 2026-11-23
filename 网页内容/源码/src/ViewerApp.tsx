import {useEffect, useRef, useState} from 'react';
import {OrthographicCamera, Raycaster, Vector2} from 'three';
import islandLogo from './assets/branding/bittertle-logo-blue.png';
import {EnvironmentControls, TimeSelector} from './components/EnvironmentControls';
import {walkDestinations} from './components/InteriorEntry';
import {VisitPreview} from './components/VisitPreview';
import type {Marker, Project} from './data/model';
import {parseProject} from './data/validation';
import {useEnvironment} from './environment/time-state';
import type {VisitId} from './exploration/registry';
import {SceneController} from './scene/SceneController';
import './viewer-natural.css';

type Panel = 'places' | 'walk' | 'environment';
type View = 'all' | 'top' | 'free';
type DirectoryEntry = {id: string; name: string; actionLabel?: string; selected?: boolean; activate: () => void};
type IconName = 'overview' | 'pin' | 'walk' | 'camera' | 'settings' | 'close' | 'search' | 'orbit' | 'top';
const titles: Record<Panel, string> = {places: '岛上地点', walk: '步行漫游', environment: '环境设置'};
const iconPaths: Record<IconName, string> = {
  overview: 'm3 16 5-9 4.2 6.2L15 9l6 7H3ZM2.5 19c2 1 3.5 1 5.5 0s3.8-1 5.8 0 3.5 1 5.5 0',
  pin: 'M19.5 9.6c0 5.2-7.5 11.4-7.5 11.4S4.5 14.8 4.5 9.6a7.5 7.5 0 1 1 15 0ZM14.5 9.3a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  walk: 'M14.3 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM6 12l2.4-3 4.5-2.1 2.6 4.3 3.3 1.3M12.5 7.7l-1.8 6.1 3.6 2.8 1.4 4.5M10.8 13.7l-2.1 4.8L5 21',
  camera: 'M4 6.7h3.7L9.3 4h5.4l1.6 2.7H20a1.5 1.5 0 0 1 1.5 1.5v10.3A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V8.2A1.5 1.5 0 0 1 4 6.7ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  settings: 'M3 6h9m4 0h5M3 12h3m4 0h11M3 18h11m4 0h3M16 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-6 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  close: 'm6 6 12 12M18 6 6 18',
  search: 'M16.5 10a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15 15l5 5',
  orbit: 'M10.4 8.7A3.7 3.7 0 1 1 8.6 14m8.5-8.2c2-.2 3.5.1 4 .9 1.2 2-2 5.9-7 8.9-5.1 3-10.2 3.8-11.3 1.9-.8-1.3.3-3.6 2.7-6',
  top: 'm12 3 10 5.3L12 14 2 8.3 12 3ZM3.5 12.3l8.5 4.8 8.5-4.8M3.5 16l8.5 4.8 8.5-4.8',
};
function Icon({name}: {name: IconName}) {
  return <svg className="atlas-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPaths[name]}/></svg>;
}

const fieldNotes: Record<string, string> = {
  marker_shrine: '穿过鸟居，石径一直通到主殿。庭院旁的小路绕向后山，樱花树就在那一头。',
  marker_base: '办公室和卧室挨在一起，房前有一口鱼塘。沿着水边慢慢走，就能绕到仓库。',
  landmark_liuli_marker: '湾心的小岛上，银白色支翼托着一座蓝绿晶塔。进了大厅，还可以乘电梯去楼上。',
  landmark_library_marker: '北岸的图书馆面向内湾。白色廊柱环着蓝色穹顶，正门前是一段宽阔的石阶。',
  landmark_feihua_marker: '悬空木桥通往半山的石台。主楼和副楼沿山而建，温泉就藏在副楼后边。',
  layout_lighthouse_marker: '灯塔立在西北岸的岬角上。从塔下望出去，眼前就是外海。',
  layout_shopping_marker: '一排小店沿着东岸的街道开门。街面另一侧，可以望见内湾。',
  layout_market_marker: '各色摊棚聚在市集中央。路口就是公交站，从这里可以步行去岛上的居民区。',
  layout_treehouse_marker: '树干托起了木屋和平台。沿着树旁的梯子往上看，屋檐藏在枝叶之间。',
  scenic_sakura_marker: '神社后山的樱花树下，花瓣落了满地。顺着小径再走一段，就是海边的山崖。',
  scenic_cliff_marker: '沿石径向北走，右手边一直是海。崖边那块宽厚的望海石，是停下来听浪的地方。',
  scenic_academy_marker: '穿过门楼，围墙里是一座灰瓦木楼。学堂的小院靠着岛上的村落。',
  scenic_farm_marker: '林间空地被辟成一块块田畦，里面种着药草、模样奇特的瓜果和晶簇作物。',
  layout_villa_marker: '北岸的宅邸朝向沿海道路，正门前有庭院，绕过屋侧还有一座后院。',
};
// The original layout carries six production notes in its public description fields.
const originalProductionNotes: Record<string, string> = {
  marker_shrine: '神社建筑群以当前主殿为基准布置，原南侧院址改为生活基地。',
  landmark_liuli_marker: '湾中独立小岛上的琉璃塔。银白支翼环绕蓝青色晶体尖塔，悬浮感以静态几何表达。',
  layout_lighthouse_marker: '灯塔 · M1 布局模型',
  layout_shopping_marker: '商店街 · M1 布局模型',
  layout_market_marker: '市集 · M1 布局模型',
  layout_treehouse_marker: '树屋 · M1 布局模型',
};
function placeDescription(place: Marker) {
  const authored = place.description?.trim();
  if (authored && place.description !== originalProductionNotes[place.id]) return authored;
  return Object.hasOwn(fieldNotes, place.id) ? fieldNotes[place.id] : place.name;
}

const nearbyVisits: Record<string, {id: VisitId; label: string; object: string}> = {
  marker_shrine: {id: 'shrine_group', label: '漫游神社', object: 'shrine_main'},
  marker_base: {id: 'base_group', label: '漫游生活基地', object: 'base_office'},
  landmark_liuli_marker: {id: 'landmark_liuli', label: '进入琉璃塔大厅', object: 'landmark_liuli'},
  landmark_feihua_marker: {id: 'feihua_group', label: '漫游绯华楼', object: 'landmark_feihua'},
  scenic_cliff_marker: {id: 'coast_group', label: '走上海边山崖', object: 'scenic_cliff'},
};

function sceneErrorMessage(failure: unknown) {
  const message = failure instanceof Error ? failure.message : String(failure);
  if (/error creating webgl2? context|(?:could not|unable to|failed to) create (?:a |the )?webgl2? (?:rendering )?context|webgl(?: ?2(?:\.0)?)? (?:is )?(?:not supported|unavailable)/i.test(message)) {
    return '当前浏览器未启用 3D 加速。请在支持 WebGL 的浏览器中打开，或开启硬件加速后重试。';
  }
  return message;
}

function Cartouche() {
  return <div className="atlas-brand">
    <svg className="atlas-emblem" viewBox="159 173 1182 764" aria-hidden="true">
      <defs><mask id="atlas-logo-mask" x="0" y="0" width="1536" height="1024" maskUnits="userSpaceOnUse" style={{maskType: 'alpha'}}>
        <image href={islandLogo} width="1536" height="1024"/>
      </mask></defs>
      <rect width="1536" height="1024" fill="currentColor" mask="url(#atlas-logo-mask)"/>
    </svg>
    <div><h1>比特尔特岛</h1><span lang="en">Bittertle Island</span></div>
  </div>;
}

function Compass({needle, onNorth, disabled}: {needle: React.RefObject<SVGSVGElement | null>; onNorth: () => void; disabled: boolean}) {
  return <button className="atlas-compass" type="button" aria-label="镜头朝北" title="镜头朝北" onClick={onNorth} disabled={disabled}>
    <svg ref={needle} viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="21.5" stroke="currentColor" strokeWidth=".65" opacity=".65"/>
      <path d="M4.5 24h3m33 0h3M24 40.5v3" stroke="currentColor" opacity=".6"/>
      <text x="24" y="12.7" textAnchor="middle" fill="currentColor" fontFamily="Georgia,serif" fontSize="8">N</text>
      <path d="M24 15.3 28.3 29 24 26.5 19.7 29Z" fill="currentColor"/>
      <path d="m24 34.3-4.3-6 4.3-1.8 4.3 1.8Z" stroke="currentColor" strokeWidth=".8"/>
    </svg>
  </button>;
}

export default function ViewerApp() {
  const host = useRef<HTMLDivElement>(null);
  const canvasScene = useRef<SceneController | null>(null);
  const compassNeedle = useRef<SVGSVGElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const panelTitle = useRef<HTMLHeadingElement>(null);
  const placesButton = useRef<HTMLButtonElement | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [phase, setPhase] = useState<'layout' | 'landscape' | 'ready'>('layout');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [modelError, setModelError] = useState('');
  const [panel, setPanel] = useState<Panel | null>(null);
  const [interior, setInterior] = useState<VisitId | null>(null);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [queries, setQueries] = useState({places: '', walk: ''});
  const [view, setView] = useState<View>('all');
  const [projection, setProjection] = useState<'orthographic' | 'perspective'>('orthographic');
  const time = useEnvironment(state => state.mode);
  const ready = phase === 'ready' && !error;

  function focusMarker(place: Marker) {
    const scene = canvasScene.current;
    if (!scene) return;
    scene.focus(scene.markerPosition(place));
    setMarker(place);
    setView('free');
    setPanel(null);
  }

  useEffect(() => {
    const element = host.current!;
    const aborter = new AbortController();
    const options = {signal: aborter.signal};
    let island: SceneController | undefined;
    let observedControls: SceneController['controls'] | undefined;
    const markFreeView = () => setView('free');
    function observeControls(controls: SceneController['controls']) {
      if (observedControls === controls) return;
      observedControls?.removeEventListener('start', markFreeView);
      observedControls = controls;
      controls.addEventListener('start', markFreeView);
    }
    setProject(null);
    setPhase('layout');
    setError('');
    setModelError('');
    setPanel(null);
    setMarker(null);
    setView('all');
    element.addEventListener('scene-error', event => setError(sceneErrorMessage((event as CustomEvent).detail)), options);
    element.addEventListener('refinement-error', event => setModelError((event as CustomEvent).detail.message), options);
    element.addEventListener('refinement-retry', () => setModelError(''), options);
    async function loadIsland() {
      try {
        const response = await fetch(new URL('./project.json', document.baseURI), {cache: 'no-cache', signal: aborter.signal});
        if (!response.ok) throw new Error(`岛屿布局读取失败（HTTP ${response.status}）`);
        if (Number(response.headers.get('content-length')) > 8_000_000) throw new Error('岛屿布局文件超过 8 MB');
        const layout = parseProject(await response.text());
        if (matchMedia('(max-width: 700px)').matches) layout.settings.quality = 'low';
        if (aborter.signal.aborted) return;
        setProject(layout);
        setPhase('landscape');
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (aborter.signal.aborted) return;
        const scene = new SceneController(element, layout);
        island = scene;
        canvasScene.current = scene;
        observeControls(scene.controls);
        setProjection(scene.camera instanceof OrthographicCamera ? 'orthographic' : 'perspective');
        let firstDraw = true;
        let lastHeading: number | undefined;
        const reportStats = scene.onStats;
        scene.onStats = stats => {
          reportStats(stats);
          observeControls(scene.controls);
          if (firstDraw) { firstDraw = false; setPhase('ready'); }
          const angle = scene.controls.getAzimuthalAngle();
          if (lastHeading !== angle && compassNeedle.current) {
            lastHeading = angle;
            compassNeedle.current.style.transform = `rotate(${angle}rad)`;
          }
        };
        const canvas = scene.renderer.domElement;
        canvas.setAttribute('aria-label', '比特尔特岛三维实景');
        let pointer: {id: number; x: number; y: number} | null = null;
        canvas.addEventListener('pointerdown', event => {
          pointer = event.isPrimary && event.button === 0 ? {id: event.pointerId, x: event.clientX, y: event.clientY} : null;
        }, options);
        canvas.addEventListener('pointercancel', () => { pointer = null; }, options);
        canvas.addEventListener('pointerup', event => {
          const down = pointer;
          pointer = null;
          if (!down || down.id !== event.pointerId || !scene.labels.visible || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
          const bounds = canvas.getBoundingClientRect();
          const ray = new Raycaster();
          ray.setFromCamera(new Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2), scene.camera);
          const hit = ray.intersectObjects(scene.labels.children, true)[0];
          const place = layout.markers.find(item => item.id === hit?.object.userData.markerId);
          if (place) focusMarker(place);
        }, options);
        scene.requestRender();
      } catch (failure) {
        if (!aborter.signal.aborted) setError(sceneErrorMessage(failure));
      }
    }
    void loadIsland();
    return () => {
      aborter.abort();
      canvasScene.current = null;
      observedControls?.removeEventListener('start', markFreeView);
      island?.dispose();
      element.replaceChildren();
    };
  }, [attempt]);

  useEffect(() => { if (panel) panelTitle.current?.focus({preventScroll: true}); }, [panel]);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || interior || document.querySelector('dialog[open]')) return;
      if (panel) { setPanel(null); opener.current?.focus({preventScroll: true}); }
      else if (marker) { setMarker(null); placesButton.current?.focus({preventScroll: true}); }
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [panel, marker, interior]);

  function togglePanel(chosen: Panel, button: HTMLButtonElement | null) {
    opener.current = button;
    setPanel(current => current === chosen ? null : chosen);
  }
  function closePanel() {
    setPanel(null);
    opener.current?.focus({preventScroll: true});
  }
  function preset(choice: 'all' | 'top') {
    const scene = canvasScene.current;
    if (!scene) return;
    scene.preset(choice);
    setProjection(scene.camera instanceof OrthographicCamera ? 'orthographic' : 'perspective');
    setView(choice);
    setPanel(null);
    setMarker(null);
  }
  function chooseProjection(next: typeof projection) {
    const scene = canvasScene.current;
    if (!scene || (scene.camera instanceof OrthographicCamera) === (next === 'orthographic')) return;
    scene.toggleProjection();
    setProjection(next);
  }
  function setQuality(quality: Project['settings']['quality']) {
    const scene = canvasScene.current;
    if (!scene || !project) return;
    const next = {...project, settings: {...project.settings, quality}};
    scene.setQuality(quality);
    scene.project = next;
    setProject(next);
  }
  function enter(place: VisitId) { setPanel(null); setView('free'); setInterior(place); }
  function north() {
    const scene = canvasScene.current;
    if (!scene) return;
    const target = scene.controls.target;
    const eye = scene.camera.position;
    const radius = Math.hypot(eye.x - target.x, eye.z - target.z);
    eye.x = target.x; eye.z = target.z + radius;
    scene.controls.update(); scene.requestRender();
  }
  const directory = panel === 'walk' ? 'walk' : 'places';
  const entries: DirectoryEntry[] = directory === 'walk'
    ? walkDestinations(project).map(place => ({
        id: place.id, name: place.id === 'landmark_liuli' ? '琉璃塔大厅' : place.name,
        actionLabel: place.entry, activate: () => enter(place.id),
      }))
    : (project?.markers ?? []).filter(place => place.visible).map(place => ({
        id: place.id, name: place.name, selected: marker?.id === place.id, activate: () => focusMarker(place),
      }));
  const query = queries[directory];
  const term = query.trim().toLowerCase();
  const filtered = entries.filter(entry => (entry.name + ' ' + (entry.actionLabel ?? '')).toLowerCase().includes(term));
  const searchLabel = directory === 'walk' ? '查找漫游地点' : '查找地点';
  const visit = marker && nearbyVisits[marker.id];
  const explorationLinks = [
    {panel: 'places', icon: 'pin', label: '地点'}, {panel: 'walk', icon: 'walk', label: '漫游'},
  ] as const;
  function chooseCameraPreset(id: string) {
    const shot = project?.cameraPresets.find(item => item.id === id), scene = canvasScene.current;
    if (!shot || !scene) return;
    scene.restoreView(shot);
    setProjection(shot.perspective ? 'perspective' : 'orthographic');
    setView('free'); setMarker(null); setPanel(null);
  }

  return <><main className="island-atlas" data-time={time} inert={!!interior} aria-label="比特尔特岛交互沙盘">
    <div className="atlas-canvas" ref={host} onPointerDown={() => setPanel(null)}/>
    <Cartouche/>
    <div className="atlas-sky-controls" role="group" aria-label="时间与环境">
      <TimeSelector illustrated/>
      <button className="atlas-settings-button" type="button" title="环境设置" aria-label="环境设置" aria-expanded={panel === 'environment'}
        aria-controls="atlas-environment" onClick={event => togglePanel('environment', event.currentTarget)}><Icon name="settings"/></button>
      <div className="atlas-environment-host" id="atlas-environment" data-open={panel === 'environment'}>
        {panel === 'environment' && <div className="atlas-panel-head atlas-environment-head"><div className="atlas-panel-title"><h2 ref={panelTitle} tabIndex={-1}>环境设置</h2></div>
          <button type="button" className="atlas-icon-button" aria-label="收起环境设置" onClick={closePanel}><Icon name="close"/></button></div>}
        <EnvironmentControls variant="panel"/>
      </div>
    </div>
    <nav className="atlas-exploration" aria-label="地点与漫游">
      {explorationLinks.map(item => <button key={item.panel} type="button" ref={item.panel === 'places' ? placesButton : undefined} disabled={!ready}
        aria-controls="atlas-panel" aria-expanded={panel === item.panel} data-selected={panel === item.panel || (!panel && item.panel === 'places' && !!marker)}
        onClick={event => togglePanel(item.panel, event.currentTarget)}><Icon name={item.icon}/><span>{item.label}</span></button>)}
    </nav>
    <Compass needle={compassNeedle} onNorth={north} disabled={!ready}/>
    <nav className="atlas-dock" aria-label="相机与画质">
      <button type="button" disabled={!ready} aria-pressed={view === 'all'} onClick={() => preset('all')}><Icon name="overview"/><span>全岛</span></button>
      <button type="button" disabled={!ready} aria-pressed={view === 'top'} onClick={() => preset('top')}><Icon name="top"/><span>正俯视</span></button>
      <button className="atlas-projection" type="button" disabled={!ready} aria-label="正交 / 透视" aria-description={projection === 'orthographic' ? '当前为正交投影' : '当前为透视投影'} title={projection === 'orthographic' ? '当前为正交，点击切换到透视' : '当前为透视，点击切换到正交'}
        onClick={() => chooseProjection(projection === 'orthographic' ? 'perspective' : 'orthographic')}><Icon name="camera"/>
        <span><b data-current={projection === 'orthographic'}>正交</b> / <b data-current={projection === 'perspective'}>透视</b></span></button>
      <select className="atlas-quality" aria-label="画质" disabled={!ready || !project} value={project?.settings.quality ?? 'low'} onChange={event => setQuality(event.target.value as Project['settings']['quality'])}>
        <option value="standard">标准画质</option><option value="low">流畅画质</option>
      </select>
    </nav>
    <div className="atlas-gesture"><Icon name="orbit"/><span className="atlas-desktop-gesture">拖动旋转 <i/> 右键平移 <i/> 滚轮缩放</span><span className="atlas-touch-gesture">单指旋转 <i/> 双指平移或缩放</span></div>

    {panel && panel !== 'environment' && <section className={`atlas-panel atlas-panel-${panel}`} id="atlas-panel" aria-labelledby="atlas-panel-title">
      <div className="atlas-panel-head"><div className="atlas-panel-title"><h2 ref={panelTitle} tabIndex={-1} id="atlas-panel-title">{titles[panel]}</h2>
        <span>{entries.length} 处</span></div><button className="atlas-icon-button" type="button" onClick={closePanel} aria-label="收起面板"><Icon name="close"/></button></div>
      <label className="atlas-search"><Icon name="search"/>
        <input type="search" autoComplete="off" aria-label={searchLabel} placeholder={searchLabel} value={query}
          onChange={event => setQueries({...queries, [directory]: event.target.value})}/>
      </label>
      <div key={directory} className="atlas-place-list" role="group" aria-label={titles[panel]}>
        {filtered.map(entry => <button type="button" key={entry.id} disabled={!ready} aria-label={entry.actionLabel} aria-pressed={entry.selected} onClick={entry.activate}>
          <Icon name={directory === 'walk' ? 'walk' : 'pin'}/><span>{entry.name}</span></button>)}
        {!filtered.length && <p role="status">没有找到这个地点。</p>}
      </div>
      {!!project?.cameraPresets.length && <label className="atlas-select-row atlas-saved-views"><span>预设机位</span>
        <select aria-label="预设机位" disabled={!ready} value="" onChange={event => chooseCameraPreset(event.target.value)}><option value="">选择机位</option>
          {project.cameraPresets.map(shot => <option key={shot.id} value={shot.id}>{shot.name}</option>)}</select></label>}
    </section>}
    {!panel && marker && <section className="atlas-place-card" aria-label="地点说明" aria-live="polite">
      <div className="atlas-panel-head"><div className="atlas-panel-title"><Icon name="pin"/><h2>{marker.name}</h2></div><button type="button" className="atlas-icon-button" aria-label="关闭地点说明" onClick={() => setMarker(null)}><Icon name="close"/></button></div>
      <p>{placeDescription(marker)}</p>
      {visit && project?.objects.some(object => object.id === visit.object) && <button className="atlas-place-enter" type="button" onClick={() => enter(visit.id)}>{visit.label}</button>}
    </section>}
    {phase !== 'ready' && !error && <div className="atlas-loading" role="status"><span className="atlas-spinner"/>{phase === 'layout' ? '正在读取岛屿地图…' : '正在绘制岛屿…'}</div>}
    {error && <div className="atlas-notice" role="alert"><strong>暂时无法打开岛屿</strong><p>{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>重新加载</button></div>}
    {!error && modelError && <div className="atlas-notice atlas-model-notice" role="alert"><p>{modelError}</p><button type="button" onClick={() => {setModelError(''); canvasScene.current?.refinement.retryFailed();}}>重试精修模型</button></div>}
  </main>{interior && canvasScene.current && <VisitPreview island={canvasScene.current} buildingId={interior} onClose={() => setInterior(null)}/>}</>;
}
