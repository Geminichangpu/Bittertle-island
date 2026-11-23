import {useState} from 'react';
import type {Project} from '../data/model';
import {INTERIORS} from '../interiors/registry';
import {COMPOUNDS,compoundMembers,type VisitId} from '../exploration/registry';

type WalkDestination = {id: VisitId; name: string; entry: string; optionLabel?: string};

export function walkDestinations(project: Project | null): WalkDestination[] {
  const island: WalkDestination = {id: 'island_walk', name: '全岛第一人称漫游', entry: '进入全岛第一人称漫游'};
  if (!project) return [island];
  const compounds = COMPOUNDS.filter(place => compoundMembers(project, place.id).length > 0).map(place => ({
    id: place.id, name: place.name, entry: '漫游' + place.name,
    optionLabel: place.name + (place.id === 'coast_group' ? ' · 漫游' : ' · 整体漫游'),
  }));
  const rooms = INTERIORS.filter(place => project.objects.some(object => object.id === place.id));
  return [island, ...compounds, ...rooms];
}

/** Separate navigation controls never select or transform an exterior object. */
export function InteriorEntry({project, ready, onEnter}: {project: Project | null; ready: boolean; onEnter: (id: VisitId) => void}) {
  const [choice, setChoice] = useState<VisitId>('base_office');
  const [island, ...available] = walkDestinations(project);
  const selected = available.find(place => place.id === choice) || available[0];
  return <div className="interior-entry-section">
    <button className="interior-entry" disabled={!ready} onClick={() => onEnter(island.id)}>{island.entry}</button>
    <span>室内 / 岛屿漫游</span>
    <select aria-label="选择漫游地点" value={selected?.id || ''} disabled={!ready || !selected} onChange={event => setChoice(event.target.value as VisitId)}>
      {!selected && <option value="">没有可进入的建筑</option>}
      {available.map(place => <option key={place.id} value={place.id}>{place.optionLabel ?? place.name}</option>)}
    </select>
    <button className="interior-entry" disabled={!ready || !selected} onClick={() => selected && onEnter(selected.id)}>{selected?.entry || '进入室内'}</button>
  </div>;
}
