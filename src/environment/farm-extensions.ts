import * as T from 'three';
import type {Project} from '../data/model';
import type {Builder} from '../generators/shrine';
import type {TerrainSurface} from './surface';
import type {Obstacle,Route} from './paths';

/** Two compact features sit inside the existing farm's tree ring. */
export function addFarmExtensions(p:Project,b:Builder,_surface:TerrainSurface,_routes:Route[],_obstacles:Obstacle[],_crowded:(x:number,z:number,r:number)=>boolean){
 const farm=p.objects.find(o=>o.id==='scenic_farm');if(!farm)return [];
 const matrix=(o:{position:number[];rotation:number[];scale:number[]})=>new T.Matrix4().compose(new T.Vector3().fromArray(o.position),new T.Quaternion().setFromEuler(new T.Euler(o.rotation[0],o.rotation[1],o.rotation[2])),new T.Vector3().fromArray(o.scale));
 const m=matrix(farm),parent=p.groups?.find(g=>g.id===farm.parentId);if(parent)m.premultiply(matrix(parent));
 // The original four beds occupy x=-13..11 and z=-10..10. Leave the
 // centre channel and the south entrance open, using the two inner corners.
 const pond={x:13.8,y:0,z:0},pasture={x:-15.5,y:0,z:0};
 b.transformed(m,()=>{
  const {x,y,z}=pond;b.emit('farm-extra:pond',()=>new T.CylinderGeometry(1,1,1,32),'#76aaa8',[x,y+.14,z],[2.65,.18,2.05]);
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18;b.ball([x+Math.cos(a)*2.6,y+.27,z+Math.sin(a)*2],[.36,.27,.32],i%2?'#a3a99b':'#c0c3b0');}
  for(let i=0;i<3;i++)b.box([x-1+i*.75,y+.2,z+2.25],[.7,.12,.55],'#a9855f');
  for(let i=0;i<5;i++){const a=i*2.4;b.ball([x+Math.cos(a)*1.2,y+.25,z+Math.sin(a)*1.1],[.24,.04,.13],i%2?'#e8e3bf':'#f1bbc5');}
  const q=pasture,px=q.x,pz=q.z,hw=2.35,hd=1.9;b.box([px,.06,pz],[hw*2,.12,hd*2],'#91ac71');
  for(const side of [-1,1]){for(let i=0;i<5;i++)b.box([px-hw+i*hw/2,.5,pz+side*hd],[.12,1,.12],'#8b6b48');for(const h of [.35,.75])b.box([px,h,pz+side*hd],[hw*2,.10,.10],'#a8845f');}
  for(let i=0;i<5;i++)b.box([px-hw,.5,pz-hd+i*hd/2],[.12,1,.12],'#8b6b48');for(const h of [.35,.75])b.box([px-hw,h,pz],[.10,.10,hd*2],'#a8845f');
  // Gate on the inner side faces the central walking space.
  for(const zz of [-hd,-.6,.6,hd])b.box([px+hw,.5,pz+zz],[.12,1,.12],'#8b6b48');for(const h of [.35,.75])for(const side of [-1,1])b.box([px+hw,h,pz+side*(hd+.6)/2],[.1,.1,hd-.6],'#a8845f');
  for(let i=0;i<3;i++){const xx=px-1.2+i*1.1,zz=pz+(i%2?.45:-.45);b.ball([xx,.58,zz],[.43,.38,.3],'#f0eadc');b.ball([xx+.35,.62,zz],[.18,.18,.16],'#c9bea9');for(const dx of [-.22,.22])for(const dz of [-.15,.15])b.box([xx+dx,.16,zz+dz],[.08,.3,.08],'#867968');}
 });
 return [{kind:'pond',...new T.Vector3(pond.x,pond.y,pond.z).applyMatrix4(m).toArray().reduce((o,v,i)=>({...o,[['x','y','z'][i]]:v}),{} as {x:number;y:number;z:number})},{kind:'pasture',...new T.Vector3(pasture.x,pasture.y,pasture.z).applyMatrix4(m).toArray().reduce((o,v,i)=>({...o,[['x','y','z'][i]]:v}),{} as {x:number;y:number;z:number})}];
}
