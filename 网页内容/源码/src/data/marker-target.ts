import type {Marker,Project} from './model.ts';

/** Known building titles follow their stable scene IDs, including old saved markers. */
export function markerTargetId(project:Project,marker:Marker):string|undefined {
 const known:Record<string,string>={marker_shrine:'shrine_main',marker_base:'base_group'};
 const candidate=marker.followId||known[marker.id]||(/^(landmark_|layout_).+_marker$/.test(marker.id)?marker.id.slice(0,-7):undefined);
 if(candidate&&(project.objects.some(o=>o.id===candidate)||project.groups?.some(g=>g.id===candidate)))return candidate;
 return undefined;
}
