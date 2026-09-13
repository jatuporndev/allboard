import * as THREE from 'three';
import { mesh, ellipsoid, tube } from './sculpture.js';

// Original cross-section sculptures. Each ring describes height, width, depth
// and its forward/back offset, so silhouettes are shaped rather than stacked spheres.
export function sculpt(parent, material, sections, segments = 20) {
  const positions = [], uv = [], indices = [];
  for (let row = 0; row < sections.length; row++) {
    const [y, width, depth, z = 0] = sections[row];
    for (let col = 0; col <= segments; col++) {
      const a = col / segments * Math.PI * 2;
      positions.push(Math.sin(a) * width, y, Math.cos(a) * depth + z);
      uv.push(col / segments, row / (sections.length - 1));
    }
  }
  for (let row = 0; row < sections.length - 1; row++) for (let col = 0; col < segments; col++) {
    const i = row * (segments + 1) + col, j = i + segments + 1;
    indices.push(i, i + 1, j, i + 1, j + 1, j);
  }
  // Sections run bottom to top. Close the ends without a visible open joint.
  for (const row of [0, sections.length - 1]) {
    const [y, , , z = 0] = sections[row], center = positions.length / 3;
    positions.push(0, y, z); uv.push(.5, row === 0 ? 0 : 1);
    for (let col = 0; col < segments; col++) {
      const i = row * (segments + 1) + col;
      indices.push(...(row === 0 ? [center, i + 1, i] : [center, i, i + 1]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return mesh(geometry, material, parent);
}

export function sculptFace(parent, p, guardian) {
  const head = sculpt(parent, p.skin, [
    [-.15, .043, .048, -.026], [-.13, .066, .070, -.013],
    [-.09, .089, .084, -.003], [-.045, .109, .097, .004],
    [.005, .117, .101, .006], [.055, .113, .099, .011],
    [.105, .100, .090, .015], [.145, .062, .063, .018],
    [.16, .014, .016, .018],
  ], 32);
  // Sculpt the front surface itself: sockets, brow, cheekbones, nose and chin.
  const a = head.geometry.attributes.position;
  const bump = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), y = a.getY(i), z = a.getZ(i);
    if (z >= -.025) continue;
    let relief = .029 * bump(x, y, 0, -.023, .023, .069);
    relief += .014 * bump(x, y, 0, -.117, .055, .028);
    for (const sign of [-1, 1]) {
      relief += .015 * bump(x, y, sign * .065, -.035, .038, .034);
      relief += .012 * bump(x, y, sign * .05, .039, .043, .02);
      relief -= .012 * bump(x, y, sign * .049, .016, .031, .017);
    }
    a.setZ(i, z - relief);
  }
  head.geometry.computeVertexNormals();
  if (guardian) head.scale.x = 1.12;
  // Separate eyelids and lips retain readable facial detail at close range.
  for (const sign of [-1, 1]) {
    ellipsoid(parent, p.armor, [sign * .048, .015, -.103], [.028, .010, .008]);
    ellipsoid(parent, p.blade, [sign * .048, .015, -.109], [.021, .006, .004]);
    ellipsoid(parent, p.glow, [sign * .048, .015, -.113], [.007, .006, .003]);
    tube(parent, p.skin, [[sign*.021,.018,-.108],[sign*.047,.027,-.113],[sign*.075,.016,-.102]], .005);
    tube(parent, p.armor, [[sign*.021,.044,-.110],[sign*.047,.052,-.111],[sign*.081,.039,-.094]], .004);
    ellipsoid(parent, p.skin, [sign * .119, -.027, .004], [.018, .034, .020]);
    ellipsoid(parent, p.armor, [sign * .13, -.027, -.010], [.007, .019, .006]);
    ellipsoid(parent, p.skin, [sign * .016, -.049, -.123], [.013, .010, .013]);
  }
  sculpt(parent, p.skin, [[-.051,.013,.011,-.129],[-.036,.018,.017,-.133],[.014,.010,.009,-.114],[.048,.006,.005,-.104]], 12);
  tube(parent, p.skin, [[-.032,-.079,-.101],[-.012,-.076,-.111],[0,-.080,-.114],[.012,-.076,-.111],[.032,-.079,-.101]], .005);
  tube(parent, p.armor, [[-.029,-.084,-.102],[0,-.086,-.113],[.029,-.084,-.102]], .0025);
  ellipsoid(parent, p.skin, [0, -.093, -.103], [.023, .006, .010]);
}

export function gauntlet(parent, p) {
  sculpt(parent, p.armor, [[-.066,.032,.023,-.006],[-.045,.042,.030,0],[0,.038,.028,0],[.026,.027,.024,0]], 16);
  // Curled, individually formed fingers wrap around the weapon grip.
  for (let i = 0; i < 4; i++) {
    const y = -.014 - i * .015;
    tube(parent, p.skin, [[-.028,y,-.019],[-.038,y,.002],[-.021,y,.024],[.005,y,.017]], .007);
    ellipsoid(parent, p.gold, [-.031, y, -.018], [.008, .007, .006]);
  }
  tube(parent, p.skin, [[.039,-.009,0],[.05,-.034,-.017],[.027,-.054,-.027]], .012);
}
