import * as T from 'three';

/** The baked room has merged meshes. Rotate only the two side chairs, leaving
 * the round meeting table and the other two correctly facing chairs in place. */
export function turnOwnerMeetingChairs(input:T.BufferGeometry,name:string){
 if(!name.startsWith('furniture_'))return input;
 const geometry=input.index?input.toNonIndexed():input.clone();
 const p=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');let changed=false;
 for(let i=0;i<p.count;i+=3){
  const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;
  const cx=x<-6?-8.3:-3.7;
  if(Math.abs(x-cx)>.72||Math.abs(z+3.5)>.72||y<.045||y>2.15)continue;
  // The table top extends slightly into the chair's projected footprint.
  if(y>1.32&&y<1.57&&Math.hypot(x+6,z+3.5)<1.85)continue;
  for(let j=i;j<i+3;j++){
   p.setXYZ(j,2*cx-p.getX(j),p.getY(j),-7-p.getZ(j));
   if(normal)normal.setXYZ(j,-normal.getX(j),normal.getY(j),-normal.getZ(j));
  }
  changed=true;
 }
 if(!changed){geometry.dispose();return input;}
 input.dispose();p.needsUpdate=true;if(normal)normal.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
