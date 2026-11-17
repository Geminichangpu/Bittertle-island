import type {Terrain} from '../data/model.ts';
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

/** Gentle settlement-side grading; authored footprints, shore, shrine and eastern cliff remain authoritative. */
export function gradeSettlement(t:Terrain,x:number,z:number,height:number,shore:number){
 const village=t.village,grade=t.grading,scenic=t.scenicCoast;if(t.settlementGradeRevision!==1||!village||!grade||!scenic)return height;
 const dx=x-village.center[0],dz=z-village.center[1];if(dx< -60||dx>60||dz< -110||dz>155)return height;
 // East edge follows the red-line side: north woods, academy, shopping, farm and base.
 const keys:[number,number][]=[[-110,50],[-65,48],[-25,40],[5,36],[35,36],[75,40],[115,46],[155,52]];
 let edge=keys[0][1];for(let i=1;i<keys.length;i++)if(dz<=keys[i][0]){const a=keys[i-1],b=keys[i],u=Math.max(0,Math.min(1,(dz-a[0])/(b[0]-a[0])));edge=a[1]+(b[1]-a[1])*u;break;}else edge=keys[i][1];
 let w=smooth(-60,-38,dx)*(1-smooth(edge-20,edge,dx))*smooth(-110,-88,dz)*(1-smooth(135,155,dz))*smooth(2,10,shore);
 w*=smooth(18,30,Math.hypot(x-scenic.sakura[0],z-scenic.sakura[1]));
 w*=smooth(27,40,Math.hypot(x-grade.hill[0],z-grade.hill[1]));
 w*=smooth(42,54,Math.hypot(x-scenic.center[0],z-scenic.center[1]));
 if(w<=.001)return height;
 // Do not change building foundations or their immediate approaches.
 for(const pad of t.pads||[]){const px=Math.max(pad.minX-x,0,x-pad.maxX),pz=Math.max(pad.minZ-z,0,z-pad.maxZ),r=Math.hypot(px,pz);if(r<2)return height;if(r<14)w*=smooth(2,14,r);if(w<=.001)return height;}
 const ids=['layout_shopping','scenic_academy','island-town:bay','scenic_farm','layout_market'];let sum=0,weight=0;
 for(const id of ids){const pad=t.pads?.find(q=>q.ownerId===id);if(!pad)continue;const cz=(pad.minZ+pad.maxZ)*.5,dz2=z-cz,weightHere=1/(900+dz2*dz2);sum+=pad.level*weightHere;weight+=weightHere;}
 const db=z-grade.base[1],bw=1/(900+db*db);sum+=grade.baseLevel*bw;weight+=bw;if(!weight)return height;
 const target=sum/weight,change=Math.max(-3,Math.min(3,target-height));return height+change*w*.82;
}
