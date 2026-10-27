import type {Terrain} from '../data/model.ts';

const smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};

/** Local mountain shoulder and a genuine low gap beneath the level suspended bridge. */
export function feihuaMountainHeight(t:Terrain,x:number,z:number,height:number){
 const f=t.feihua;if(!f)return height;
 const dx=x-f.origin[0],dz=z-f.origin[2],c=Math.cos(f.rotationY),s=Math.sin(f.rotationY);
 const lx=(c*dx-s*dz)/f.scale[0],lz=(s*dx+c*dz)/f.scale[2];
 const left=-f.width*1.26,right=f.width*.66,back=-f.depth*1.8,front=f.depth*1.005,landing=front+f.depth*1.35;
 const footprintX=Math.max(left-lx,0,lx-right),footprintZ=Math.max(back-lz,0,lz-(landing+10));
 if(Math.hypot(footprintX,footprintZ)>50)return height;
 // Other authored building foundations keep their own grade.
 if(t.pads?.some(p=>!p.ownerId.startsWith('feihua_')&&p.ownerId!=='landmark_feihua'&&x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ))return height;
 const outsideX=Math.max(left-lx,0,lx-right),outsideZ=Math.max(back-lz,0,lz-front);
 const influence=smooth(1-Math.hypot(outsideX,outsideZ)/24);
 const shoulder=f.origin[1]-2.05*f.scale[1],ridge=Math.max(0,Math.min(1,(back-lz)/22));
 let result=height*(1-influence)+(shoulder+ridge*12)*influence;
 // Back slope rises above the shelf, front slope drops away to expose the retaining wall.
 const hillWeight=smooth(1-Math.abs(lx+(f.width*.3))/(f.width*1.1))*smooth((back+8-lz)/20)*smooth((lz-(back-46))/22);
 if(hillWeight>0)result=Math.max(result,height*(1-hillWeight)+(shoulder+15)*hillWeight);
 // No broad filled pad under the span: lower the ground across a narrow ravine.
 if(lz>=front&&lz<=landing){
  const u=(lz-front)/(landing-front),weight=smooth((10-Math.abs(lx))/6);
  const deck=f.origin[1]+(2.3+.15)*f.scale[1],valley=shoulder*(1-u)+(deck-.12)*u-Math.sin(Math.PI*u)*7;
  result=result*(1-weight)+Math.max(.9,valley)*weight;
 }
 // A separate compact far abutment joins the surrounding hillside at bridge deck height.
 const landingWeight=smooth((10-Math.abs(lx))/5)*smooth(1-Math.max(0,lz-(landing+4))/40);
 if(lz>=landing-1)result=result*(1-landingWeight)+(f.origin[1]+2.45*f.scale[1]-.12)*landingWeight;
 return result;
}

/** Additional mesh cuts keep the abutment and shoulder visible in the rendered height mesh. */
export function feihuaMountainCuts(t:Terrain):number[][]{
 const f=t.feihua;if(!f)return [];
 const c=Math.cos(f.rotationY),s=Math.sin(f.rotationY),points:number[][]=[];
 for(const x of [-f.width*1.26,0,f.width*.66])for(const z of [-f.depth*1.8,f.depth*1.005,f.depth*2.355]){
  points.push([f.origin[0]+c*x*f.scale[0]+s*z*f.scale[2],f.origin[2]-s*x*f.scale[0]+c*z*f.scale[2]]);
 }
 return [...new Set(points.map(p=>p[0]))].map(v=>[0,v]).concat([...new Set(points.map(p=>p[1]))].map(v=>[1,v]));
}
