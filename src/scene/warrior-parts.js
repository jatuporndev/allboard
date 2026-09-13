import * as THREE from 'three';
import { mesh, joint, ellipsoid, cylinder, tube, relief, flame, ring } from './sculpture.js';

export function crown(parent, p, type) {
  const royal = type === 'K', sage = type === 'M' || type === 'F';
  ellipsoid(parent, p.armor, [0, .06, .015], [.148, .12, .135]);
  ring(parent, p.gold, .145, .012, [0, .01, 0]);
  const tiers = royal ? 5 : sage ? 3 : type === 'S' ? 2 : 1;
  for (let i = 0; i < tiers; i++) {
    const r = .135 - i * .019;
    cylinder(parent, p.gold, r * .65, r, .065, [0, .14 + i * .065, .01]);
    ring(parent, p.armor, r * .84, .007, [0, .12 + i * .065, .01]);
  }
  cylinder(parent, p.gold, 0, .045, royal ? .19 : .13, [0, .17 + tiers * .065, .01]);
  if (type !== 'P') {
    for (const sign of [-1, 1]) {
      flame(parent, p.gold, sign * .125, -.025, -.015, royal ? .65 : .46, sign);
      ellipsoid(parent, p.gold, [sign * .148, -.055, .015], [.025, .095, .045]);
    }
  }
  mesh(new THREE.OctahedronGeometry(.03), p.glow, parent, 0, .06, -.135);
}

export function face(parent, p, type) {
  const guardian = type === 'S' || type === 'R';
  ellipsoid(parent, p.stone, [0, 0, 0], [guardian ? .145 : .122, .163, .112]);
  ellipsoid(parent, p.stone, [0, -.08, -.042], [.094, .072, .087]);
  for (const sign of [-1, 1]) {
    ellipsoid(parent, p.stone, [sign * .075, -.025, -.08], [.045, .052, .044]);
    ellipsoid(parent, p.armor, [sign * .052, .025, -.109], [.044, .017, .012]);
    ellipsoid(parent, p.glow, [sign * .053, .027, -.119], [.023, .007, .009]);
    tube(parent, p.gold, [[sign * .014, .06, -.113], [sign * .055, .064, -.119], [sign * .093, .047, -.095]], .01);
    ring(parent, p.gold, .03, .008, [sign * .145, -.07, 0], true);
    if (guardian) cylinder(parent, p.blade, .003, .019, .074, [sign * .052, -.067, -.132]);
  }
  relief(parent, p.stone, [[-.025, .012], [0, .042], [.025, -.03], [0, -.045]], .035, [0, -.005, -.14]);
  tube(parent, p.armor, [[-.042, -.076, -.113], [0, -.081, -.13], [.042, -.076, -.113]], .008);
  crown(joint(parent, 0, .09, 0), p, type);
}

export function breastplate(parent, p, type) {
  const broad = type === 'R' || type === 'S';
  ellipsoid(parent, p.armor, [0, .21, 0], [broad ? .24 : .20, .23, .125]);
  relief(parent, p.gold, [[-.18,.1],[-.20,.3],[-.11,.34],[0,.24],[.11,.34],[.20,.3],[.18,.1],[0,.02]], .025, [0, .06, -.113]);
  relief(parent, p.armor, [[-.125,.12],[-.13,.28],[0,.21],[.13,.28],[.125,.12],[0,.055]], .025, [0, .06, -.145]);
  flame(parent, p.gold, 0, .13, -.18, .46);
  mesh(new THREE.OctahedronGeometry(.038), p.glow, parent, 0, .29, -.18);
  for (const sign of [-1, 1]) for (let i = 0; i < 3; i++) {
    tube(parent, p.gold, [[sign * .045, .12 + i * .048, -.143], [sign * .11, .15 + i * .048, -.147], [sign * .17, .19 + i * .04, -.125]], .005);
  }
  cylinder(parent, p.gold, .18, .175, .047, [0, .025, 0]);
  mesh(new THREE.OctahedronGeometry(.045), p.gold, parent, 0, .025, -.18);
}

export function shoulder(parent, p, sign, large = false) {
  ellipsoid(parent, p.armor, [0, -.015, 0], [large ? .135 : .105, .087, .14]);
  flame(parent, p.gold, sign * .055, -.04, -.09, large ? .7 : .46, sign);
  for (let i = 0; i < 2; i++) {
    relief(parent, p.gold, [[-.07, 0], [-.065, -.065], [0, -.095], [.065, -.065], [.07, 0]], .02, [0, -.05 - i * .05, -.105]);
  }
}

export function skirt(parent, p, long = false) {
  cylinder(parent, p.cloth, .16, .235, long ? .42 : .20, [0, long ? -.17 : -.075, .015]);
  for (let i = 0; i < 8; i++) {
    const panel = joint(parent);
    panel.rotation.y = i * Math.PI / 4;
    relief(panel, p.armor, [[-.065, 0], [-.075, -.17], [0, -.22], [.075, -.17], [.065, 0]], .025, [0, 0, -.17]);
    tube(panel, p.gold, [[-.055, -.03, -.185], [0, -.185, -.2], [.055, -.03, -.185]], .006);
  }
}

export function sword(parent, p, heavy = false) {
  const weapon = joint(parent, 0, -.025, 0);
  cylinder(weapon, p.cloth, .025, .025, .14, [0, 0, 0]);
  ring(weapon, p.gold, .035, .013, [0, -.075, 0]);
  ellipsoid(weapon, p.gold, [0, .07, 0], [.115, .025, .043]);
  const width = heavy ? .072 : .038, length = heavy ? .6 : .52;
  relief(weapon, p.blade, [[-width, .1], [-width, length * .8], [0, length + .12], [width * 1.5, length * .83], [width, .1]], .018, [0, 0, -.008]);
  tube(weapon, p.gold, [[0, .1, -.014], [.006, length * .75, -.014], [0, length + .1, -.014]], .004);
  flame(weapon, p.gold, .075, .058, 0, .23);
  return { weapon, tip: joint(weapon, 0, length + .12, 0) };
}

export function spear(parent, p, ornate = false) {
  const weapon = joint(parent);
  cylinder(weapon, p.armor, .019, .023, 1.12, [0, .16, 0]);
  for (const y of [-.34, .02, .09, .16, .58]) ring(weapon, p.gold, .024, .008, [0, y, 0]);
  relief(weapon, p.blade, [[0, .95], [-.062, .73], [0, .66], [.062, .73]], .018, [0, 0, -.009]);
  if (ornate) for (const sign of [-1, 1]) flame(weapon, p.gold, sign * .025, .60, 0, .42, sign);
  return { weapon, tip: joint(weapon, 0, .95, 0) };
}

export function staff(parent, p) {
  const weapon = joint(parent);
  cylinder(weapon, p.armor, .024, .03, 1.0, [0, .15, 0]);
  for (let i = 0; i < 7; i++) ring(weapon, p.gold, .028, .008, [0, -.25 + i * .13, 0]);
  ring(weapon, p.gold, .12, .02, [0, .77, 0], true);
  for (const sign of [-1, 1]) flame(weapon, p.gold, sign * .08, .66, 0, .45, sign);
  mesh(new THREE.OctahedronGeometry(.085), p.glow, weapon, 0, .77, 0);
  return { weapon, tip: joint(weapon, 0, .77, 0) };
}

export function shield(parent, p, tower = false) {
  const object = joint(parent, 0, -.02, -.035);
  const w = tower ? .18 : .14, h = tower ? .5 : .32;
  const outline = [[0, h * .6], [-w, h * .38], [-w, -h * .25], [0, -h * .6], [w, -h * .25], [w, h * .38]];
  relief(object, p.gold, outline, .03, [0, 0, -.03]);
  const inner = relief(object, p.armor, outline, .03, [0, 0, -.055]);
  inner.scale.set(.86, .87, 1);
  ellipsoid(object, p.gold, [0, 0, -.095], [.058, .07, .025]);
  flame(object, p.gold, 0, .055, -.095, tower ? .5 : .32);
  for (const x of [-w * .7, w * .7]) for (const y of [-h * .18, h * .25]) ellipsoid(object, p.gold, [x, y, -.096], [.012, .012, .01]);
  return object;
}

export function cape(parent, p, king = false) {
  const object = joint(parent, 0, .37, .13);
  const vertices = [], indices = [], rows = 10, columns = 10;
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const t = row / rows, u = col / columns;
    vertices.push((u - .5) * (.30 + t * .28), -t * (king ? .80 : .64), .04 + t * .1 + Math.sin(u * Math.PI * 6) * .025 * t);
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const i = row * (columns + 1) + col;
    indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(vertices.flatMap((_, i) => i % 3 === 0 ? [0, 0] : []), 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  // Duplicate reverse faces so the sculpted cloak has a visible inner surface.
  const reverse = indices.slice().reverse(); geometry.setIndex([...indices, ...reverse]);
  mesh(geometry, p.cloth, object);
  for (const sign of [-1, 1]) tube(object, p.gold, [[sign * .15, 0, .04], [sign * .21, -.35, .09], [sign * .29, king ? -.80 : -.64, .14]], .009);
  return object;
}
