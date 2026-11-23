import type {Point, Terrain} from '../data/model.ts';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function ease(low: number, high: number, value: number) {
  const u = clamp((value - low) / (high - low));
  return u * u * (3 - 2 * u);
}

function lattice(x: number, z: number) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Continuous seeded value noise, shared by the relief, terrain colours and woods. */
export function landscapeNoise(x: number, z: number) {
  const i = Math.floor(x), j = Math.floor(z);
  const u = ease(0, 1, x - i), v = ease(0, 1, z - j);
  const a = lattice(i, j), b = lattice(i + 1, j);
  const c = lattice(i, j + 1), d = lattice(i + 1, j + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

function cove(x: number, z: number, cx: number, cz: number, rx: number, rz: number) {
  return 1 - ease(.35, 1, Math.hypot((x - cx) / rx, (z - cz) / rz));
}

/** The two bathing beaches and the lee sides of the western spits collect fine sediment. */
export function beachAffinity(x: number, z: number) {
  return Math.max(
    cove(x, z, 43, -123, 53, 26), cove(x, z, 111, 137, 57, 27),
    cove(x, z, -125, -62, 40, 18) * .85, cove(x, z, -5, 62, 57, 16) * .82,
    cove(x, z, -69, 132, 43, 21) * .68,
  );
}

// The shorter segments around the eastern cliff belong to the authored cliff mesh.
const northArc: Point[] = [
  [-159,-78],[-167,-87],[-155,-93],[-146,-105],[-132,-110],[-121,-106],
  [-105,-120],[-80,-129],[-64,-138],[-53,-146],[-43,-143],[-25,-134],
  [-12,-135],[4,-144],[15,-141],[28,-131],[44,-132],[58,-138],[75,-126],[117,-104],
];
const southArc: Point[] = [
  [183,9],[179,21],[185,34],[176,54],[160,78],[156,98],[145,111],[138,136],
  [126,145],[104,139],[86,142],[69,151],[49,144],[26,154],[7,152],[-10,144],
  [-30,150],[-54,140],[-78,132],[-99,117],[-120,106],[-135,90],[-153,71],
  [-149,56],[-165,41],[-161,29],[-170,18],[-157,6],
];
const inlet: Point[] = [
  [-149,-72],[-139,-70],[-128,-64],[-119,-63],[-109,-55],[-99,-55],[-91,-59],
  [-77,-65],[-68,-64],[-59,-57],[-50,-54],[-45,-47],[-34,-47],[-23,-57],
  [-17,-63],[-3,-66],[11,-69],[26,-64],[40,-61],[55,-53],[66,-46],[76,-38],
  [83,-24],[85,-15],[89,1],[85,17],[80,27],[69,38],[57,48],[47,52.0625],[25,61],
  [12,62.5294],[-2,64.1765],[-9,65],[-23,64],[-36,57],[-46,57],[-59,49],[-69,38],
  [-76,33],[-85,20],[-95,13],[-110,14],[-119,10],[-129,8],[-136,11],[-148,13],
];

// Long and cross-ridge radii are measured in metres. The overlapping shoulders form saddles.
const hills = [
  [-124,-98, 12,28,13,-23], [-94,-107, 25,31,18,-16], [-58,-117, 36,26,16,-12],
  [-36,-115, 32,30,19,10], [-10,-110, 23,23,15,23], [18,-107, 8,21,12,8],
  [96,-103, 10,26,12,15], [128,-92, 12,23,12,27], [152,-75, 13,24,17,52],
  [-141,24, 26,23,16,-15], [-124,38, 32,22,17,54], [-137,57, 17,25,15,61],
  [-118,77, 16,30,18,32], [-91,95, 16,30,18,23], [-61,104, 21,24,17,15],
  [-35,116, 17,25,19,27], [-8,126, 9,21,14,-15], [49,128, 7,27,14,-7],
  [78,116, 8,21,17,-17], [151,90, 12,25,16,-64], [163,61, 14,29,14,-76],
].map(([x,z,height,length,width,angle]) => ({x,z,height,length,width,
  cos: Math.cos(angle*Math.PI/180), sin: Math.sin(angle*Math.PI/180)}));

function ridgeRelief(x: number, z: number) {
  const xx = x + (landscapeNoise(x/52+11, z/52-9) - .5) * 12;
  const zz = z + (landscapeNoise(x/43-8, z/43+6) - .5) * 11;
  let sum = 0;
  for (const h of hills) {
    const dx = xx - h.x, dz = zz - h.z;
    const along = (dx*h.cos + dz*h.sin) / h.length;
    const across = (dz*h.cos - dx*h.sin) / h.width;
    const d2 = along*along + across*across;
    if (d2 < 8) sum += (h.height * Math.exp(-d2)) ** 3;
  }
  return Math.cbrt(sum);
}

export function isNaturalLandform(t: Terrain) {
  if ((t as Terrain & {naturalLandformRevision?: number}).naturalLandformRevision===1) return true;
  if (t.topology!=='open-bay' || t.size!==400 || !t.campus || !t.scenicCoast) return false;
  // Imports from the original editor keep only recognised schema fields. Multiple
  // editable headlands identify a saved remaster even after moving one of them.
  const landmarks=[northArc[1],northArc[9],southArc[12],southArc[25],inlet[0],inlet[45]];
  const existing=[...t.outer,...t.bay];
  return landmarks.filter(([x,z])=>existing.some(q=>Math.abs(q[0]-x)<.1&&Math.abs(q[1]-z)<.1)).length>=3;
}

// Keep the historic terrain under the foundations and their approach roads. The transformed
// hot-spring compound is graded by a local mountain model rather than by rectangular pads.
function editableReliefWeight(t: Terrain,x: number,z: number) {
  let weight=1;
  for (const pad of t.pads??[]) {
    const dx=Math.max(pad.minX-x,0,x-pad.maxX), dz=Math.max(pad.minZ-z,0,z-pad.maxZ);
    if (dx>=17||dz>=17) continue;
    weight=Math.min(weight,ease(3.5,17,Math.hypot(dx,dz)));
    if (!weight) return 0;
  }
  const f=t.feihua;
  if (f) {
    const dx=x-f.origin[0], dz=z-f.origin[2], c=Math.cos(f.rotationY), s=Math.sin(f.rotationY);
    const lx=(c*dx-s*dz)/f.scale[0], lz=(s*dx+c*dz)/f.scale[2];
    const ox=Math.max(-1.53*f.width-lx,0,lx-.88*f.width)*f.scale[0];
    const oz=Math.max(-2.20*f.depth-lz,0,lz-2.65*f.depth)*f.scale[2];
    weight=Math.min(weight,ease(3.8,18,Math.hypot(ox,oz)));
  }
  // The small wooden ferry landing shares the original gently submerged foreshore.
  const harbour=Math.hypot((x-6)/22,(z-66)/16);
  return Math.min(weight,ease(.53,1.35,harbour));
}

/** Only used when making the bundled default or starting a fresh authored island in the editor. */
export function sculptReferenceIsland(t: Terrain) {
  const versioned = t as Terrain & {naturalLandformRevision?: number};
  const original = t.topology === 'open-bay' && t.size === 400 && t.resolution === 161 &&
    t.outer.length === 36 && Math.abs(t.outer[0][0]+160) < .01 &&
    Math.abs(t.bay[0][0]+95) < .01 && t.campus && t.scenicCoast?.revision === 3;
  if (versioned.naturalLandformRevision === 1 || !original) return t;

  const cliff = t.outer.slice(8,23);
  t.outer = [...northArc, ...cliff, ...southArc].map(([x,z]) => [x,z]);
  t.bay = inlet.map(([x,z]) => [x,z]);
  const {size, resolution, campus} = t;
  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const x = (i/(resolution-1)-.5)*size, z = (j/(resolution-1)-.5)*size;
      const islandDistance = Math.hypot(x-campus!.center[0], z-campus!.center[1]);
      if (islandDistance < campus!.radius + 5) continue;
      const k = j*resolution+i, old = t.heights[k], ridge = ridgeRelief(x,z);
      const broad = landscapeNoise(x/35+14, z/35-13);
      const fine = landscapeNoise(x/12-5, z/12+3);
      const relief = ridge * (.91+.12*broad) + (fine-.5) * Math.min(4, ridge*.16);
      const dunes = (1-beachAffinity(x,z)) * (1.1 + 2.6*broad) + .65*fine;
      const next = .16*old + .84*(.9 + dunes + relief);
      const weight=editableReliefWeight(t,x,z);
      t.heights[k] = Math.round((old+(next-old)*weight)*1000) / 1000;
    }
  }
  versioned.naturalLandformRevision = 1;
  return t;
}
