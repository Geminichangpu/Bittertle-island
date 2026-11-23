import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {Builder, type Cache} from '../generators/shrine';
import type {InteriorRoom, V} from './room-kit';

function receptionDisplay() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e6efee';
  ctx.fillRect(0, 0, 512, 288);
  ctx.fillStyle = '#254958';
  ctx.fillRect(0, 0, 91, 288);
  ctx.fillStyle = '#dcebea';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('琉璃塔', 15, 38);
  ctx.font = '13px sans-serif';
  ctx.fillText('前台', 17, 92);
  ctx.fillStyle = '#91b2b8';
  ctx.fillText('记录', 17, 132);
  ctx.fillStyle = '#2e505a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('接待登记', 113, 42);
  ctx.fillStyle = '#c5d9d6';
  ctx.fillRect(113, 59, 371, 2);
  ['访客登记', '到访时间', '来访记录'].forEach((label, row) => {
    const y = 76 + row * 60;
    ctx.fillStyle = '#f8faf7';
    ctx.fillRect(113, y, 371, 47);
    ctx.fillStyle = ['#72a89e', '#9bb5c1', '#c8ac7b'][row];
    ctx.fillRect(113, y, 5, 47);
    ctx.fillStyle = '#48616a';
    ctx.font = '16px sans-serif';
    ctx.fillText(label, 133, y + 29);
    ctx.fillStyle = '#d1e1df';
    ctx.fillRect(353, y + 20, 102 - row * 13, 7);
  });
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

/** The terminals stay on the same countertop while the room swaps its original furniture for the GLB. */
export function addReceptionWorkstations(room: InteriorRoom, cache: Cache) {
  const b = new Builder(cache);
  const graphite = '#343c42', silver = '#a3adae', keys = '#41494c', ports = '#222b30';
  cache.mat(silver).metalness = .48;
  cache.mat(silver).roughness = .38;
  const map = receptionDisplay();
  const screen = new T.MeshBasicMaterial({map, toneMapped: false});
  const rounded = (at: V, size: V, color: string) => {
    b.emit('reception:rounded-shell', () => new RoundedBoxGeometry(1, 1, 1, 2, .055), color, at, size);
  };
  const letters = (count: number) => Array<number>(count).fill(1);
  const keyRows = [
    [...letters(12), 2],
    [1.5, ...letters(11), 1.5],
    [1.7, ...letters(10), 2.3],
    [2.1, ...letters(9), 2.9],
    [1.4, 1.2, 1.2, 6.2, 1.3, 1.3, 1.4],
  ];

  for (const [x, yaw] of [[3.14, Math.PI + .23], [6.5, Math.PI - .12]]) {
    b.scoped([x, 2.005, -3.15], yaw, () => {
      rounded([0, .028, -.015], [.46, .056, .31], silver);
      b.beam([0, .04, -.04], [0, .49, -.115], .105, silver);
      b.cylinder([-.126, .48, -.108], [.126, .48, -.108], .051, graphite, 16);

      const tilt = new T.Matrix4().makeRotationX(-.065).setPosition(0, .603, 0);
      b.transformed(tilt, () => {
        rounded([0, 0, 0], [1.17, .69, .075], graphite);
        rounded([0, 0, -.045], [1.15, .67, .031], silver);
        rounded([0, -.082, -.074], [.32, .24, .068], silver);
        b.emit('reception:screen', () => new T.PlaneGeometry(1, 1), 'display', [0, .012, .0385], [1.105, .622, 1], new T.Quaternion(), screen);
        b.box([.49, -.317, .0385], [.025, .006, .003], '#8dbdb2');
        for (const side of [-1, 1]) {
          for (let i = 0; i < 5; i++) b.box([side * (.268 + i * .047), -.185, -.062], [.024, .011, .003], ports);
        }
      });

      b.scoped([-.035, 0, .53], 0, () => {
        rounded([0, .024, 0], [.90, .048, .304], silver);
        keyRows.forEach((widths, row) => {
          const z = -.105 + row * .052;
          let left = -.412;
          for (const units of widths) {
            const width = units * .046;
            b.box([left + width / 2, .056, z], [width - .007, .016, .042], keys);
            left += width;
          }
          for (let col = 0; col < 3; col++) b.box([.285 + col * .049, .056, z], [.041, .016, .042], keys);
        });
      });
      b.emit('reception:mouse', () => new T.SphereGeometry(1, 18, 10), graphite, [.563, .036, .525], [.079, .055, .121]);
      rounded([.563, .087, .502], [.012, .013, .036], silver);

      rounded([-.765, .177, -.025], [.174, .354, .355], graphite);
      for (const y of [.145, .193]) b.box([-.765, y, .153], [.067, .014, .008], ports);
      b.ball([-.765, .273, .155], [.012, .012, .006], '#92bdb4');
    });
  }

  const group = b.finish();
  group.name = '琉璃塔前台电脑';
  group.userData.noCollision = true;
  group.traverse(node => {
    if (node instanceof T.Mesh) {
      node.castShadow = node.material !== screen;
      node.receiveShadow = node.material !== screen;
    }
  });
  room.root.add(group);
  return () => { screen.dispose(); map.dispose(); };
}
