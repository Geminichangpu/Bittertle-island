import type {Point, Terrain} from '../data/model.ts';

type Edge = {a: Point; b: Point};

function clipX(polygon: Point[], x: number, keepRight: boolean): Point[] {
  const output: Point[] = [];
  let previous = polygon[polygon.length-1];
  for (const point of polygon) {
    const previousInside = keepRight ? previous[0] >= x : previous[0] <= x;
    const inside = keepRight ? point[0] >= x : point[0] <= x;
    if (inside !== previousInside) {
      const u = (x-previous[0])/(point[0]-previous[0]);
      output.push([x, previous[1]+(point[1]-previous[1])*u]);
    }
    if (inside) output.push(point);
    previous = point;
  }
  return output;
}

function unique(values: number[]) {
  const sorted = values.sort((a,b)=>a-b);
  return sorted.filter((v,i) => i===0 || v-sorted[i-1]>1e-6);
}

function firstCell(ticks: number[], coordinate: number) {
  let low = 0, high = ticks.length-1;
  while (low+1<high) {
    const mid = (low+high)>>>1;
    if (ticks[mid]<=coordinate) low=mid; else high=mid;
  }
  return low;
}

/** Clip a regular heightfield to the exact authored land rings and all building terrace edges. */
export function triangulateContours(t: Terrain, main: Point[], cuts: number[][]) {
  const xs: number[] = [], zs: number[] = [];
  const gridSize = t.size/(t.resolution-1);
  for (let i=0; i<t.resolution; i++) {
    const v = -t.size*.5 + i*gridSize;
    xs.push(v); zs.push(v);
  }
  for (const [axis,value] of cuts) (axis===0?xs:zs).push(value);
  const contours = t.topology==='open-bay'?[main,t.islet]:[main,t.bay,t.islet];
  const edges: Edge[] = [];
  for (const ring of contours) {
    xs.push(Math.min(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[0])));
    for (let i=0;i<ring.length;i++) {
      const a=ring[i], b=ring[(i+1)%ring.length];
      zs.push(a[1]);
      const last=ring[(i+ring.length-1)%ring.length];
      if ((last[1]-a[1])*(b[1]-a[1])>=0) xs.push(a[0]);
      if (Math.abs(b[1]-a[1])>1e-8) edges.push(a[1]<b[1]?{a,b}:{a:b,b:a});
    }
  }
  const xTicks=unique(xs), zTicks=unique(zs), points: Point[]=[], indices: number[]=[];
  const vertices=new Map<string,number>();
  function vertex(p: Point) {
    const key=Math.round(p[0]*1e6)+','+Math.round(p[1]*1e6);
    const known=vertices.get(key);
    if (known!==undefined) return known;
    const index=points.length; points.push(p); vertices.set(key,index); return index;
  }
  function emit(polygon: Point[]) {
    if (polygon.length<3) return;
    const a=polygon[0], ia=vertex(a);
    for (let i=1;i+1<polygon.length;i++) {
      const b=polygon[i], c=polygon[i+1];
      const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
      if (Math.abs(cross)>1e-9) indices.push(ia,vertex(c),vertex(b));
    }
  }
  for (let j=0;j+1<zTicks.length;j++) {
    const z0=zTicks[j], z1=zTicks[j+1], mid=(z0+z1)*.5;
    const crossings: {bottom:number; top:number; mid:number}[]=[];
    for (const {a,b} of edges) {
      if (mid<a[1] || mid>=b[1]) continue;
      const slope=(b[0]-a[0])/(b[1]-a[1]);
      const bottom=a[0]+(z0-a[1])*slope, top=a[0]+(z1-a[1])*slope;
      crossings.push({bottom,top,mid:(bottom+top)*.5});
    }
    crossings.sort((a,b)=>a.mid-b.mid);
    for (let k=0;k+1<crossings.length;k+=2) {
      const left=crossings[k], right=crossings[k+1];
      const start=firstCell(xTicks,Math.min(left.bottom,left.top));
      const limit=Math.max(right.bottom,right.top);
      const band: Point[]=[[left.bottom,z0],[right.bottom,z0],[right.top,z1],[left.top,z1]];
      for (let i=start;i+1<xTicks.length && xTicks[i]<limit-1e-8;i++) {
        const x0=xTicks[i], x1=xTicks[i+1];
        if (x0>=Math.max(left.bottom,left.top) && x1<=Math.min(right.bottom,right.top)) {
          emit([[x0,z0],[x1,z0],[x1,z1],[x0,z1]]);
        } else {
          emit(clipX(clipX(band,x0,true),x1,false));
        }
      }
    }
  }
  return {points,indices};
}
