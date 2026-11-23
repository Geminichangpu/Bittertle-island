import {useEffect, useId, useRef, useState} from 'react';
import {TIME_PRESETS, type TimeMode} from '../environment/time-presets';
import {useEnvironment} from '../environment/time-state';
import waterLicense from '../vendor/ultra-water/LICENSE?raw';
import waterNotices from '../vendor/ultra-water/THIRD_PARTY_NOTICES.md?raw';
import aboAttribution from '../assets/abo-test/ATTRIBUTION.md?raw';
import cc0Attribution from '../assets/cc0-test/ATTRIBUTION.md?raw';

const times = Object.keys(TIME_PRESETS) as TimeMode[];

function TimeIcon({time}: {time: TimeMode}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {time === 'day' && <><circle cx="12" cy="12" r="3.6"/><path d="M12 2v2.6m0 14.8V22M2 12h2.6m14.8 0H22M4.9 4.9l1.8 1.8m10.6 10.6 1.8 1.8m0-14.2-1.8 1.8M6.7 17.3l-1.8 1.8"/></>}
    {time === 'dusk' && <><path d="M3 16h18M5 20h14M7 16a5 5 0 0 1 10 0M12 3v3M3.4 8.3l2.2 1.8M20.6 8.3l-2.2 1.8"/></>}
    {time === 'night' && <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.8 8.8 0 1 0 10.7 10.7Z"/>}
  </svg>;
}

export function TimeSelector({illustrated = false}: {illustrated?: boolean}) {
  const mode = useEnvironment(state => state.mode);
  const setMode = useEnvironment(state => state.setMode);
  return <div className={illustrated ? 'atlas-time' : 'time-buttons'} role="group" aria-label="时间档位">
    {times.map(time => <button key={time} type="button" aria-label={TIME_PRESETS[time].label} aria-pressed={time === mode}
      className={!illustrated && time === mode ? 'active' : undefined} title={TIME_PRESETS[time].label} onClick={() => setMode(time)}>
      {illustrated && <TimeIcon time={time}/>}<span>{TIME_PRESETS[time].label}</span>
    </button>)}
  </div>;
}

type ControlProps = {variant?: 'default' | 'panel'};

export function EnvironmentControls({variant = 'default'}: ControlProps) {
  const {fps, setFps, waterEffect, setWaterEffect, waterReflection, setWaterReflection, labelsVisible, setLabelsVisible} = useEnvironment();
  const [legal, setLegal] = useState<'license' | 'notices' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const panel = variant === 'panel';

  useEffect(() => {
    if (legal && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [legal]);

  const fpsSelect = <select aria-label="帧率上限" value={fps} onChange={event => setFps(Number(event.target.value) as 30 | 60)}>
    <option value={30}>{panel ? '30 FPS' : '最高 30 FPS'}</option><option value={60}>{panel ? '60 FPS' : '最高 60 FPS'}</option>
  </select>;
  const checkbox = (text: string, value: boolean, change: (value: boolean) => void, disabled = false) =>
    <label className={panel ? 'atlas-toggle' : undefined}>
      <input type="checkbox" checked={value} disabled={disabled} onChange={event => change(event.target.checked)}/><span>{text}</span>
    </label>;

  return <div className={panel ? 'atlas-environment' : 'environment-controls'} aria-label="环境氛围">
    {!panel && <TimeSelector/>}
    {panel ? <label className="atlas-select-row"><span>帧率上限</span>{fpsSelect}</label> : fpsSelect}
    {checkbox('水面效果', waterEffect, setWaterEffect)}
    {(panel || waterEffect) && checkbox('近岸倒影', waterReflection, setWaterReflection, !waterEffect)}
    {checkbox('地点标签', labelsVisible, setLabelsVisible)}
    <div className={panel ? 'atlas-credits' : undefined} style={panel ? undefined : {display: 'contents'}}> 
      <button type="button" onClick={() => setLegal('license')}>海浪许可</button>
      <button type="button" onClick={() => setLegal('notices')}>第三方声明</button>
    </div>
    <dialog ref={dialog} aria-labelledby={headingId} onClose={() => setLegal(null)} className={panel ? 'atlas-legal' : undefined}
      style={panel ? undefined : {width: 'min(720px, 90vw)', maxHeight: '80vh', overflow: 'auto', padding: 20, borderRadius: 12}}>
      <h2 id={headingId}>{legal === 'license' ? '海浪许可' : '第三方声明'}</h2>
      <pre style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', textAlign: 'left'}}>
        {legal === 'license' ? waterLicense : legal === 'notices' ? [waterNotices, aboAttribution, cc0Attribution].join('\n\n') : ''}
      </pre>
      <button type="button" onClick={() => dialog.current?.close()}>关闭</button>
    </dialog>
  </div>;
}
