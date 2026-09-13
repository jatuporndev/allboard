import * as THREE from 'three';
import { mesh, joint, ellipsoid, cylinder, tube, ring, flame, relief, bakeRigidParts, makePalette } from './sculpture.js';
import { face, breastplate, shoulder, skirt, sword, spear, staff, shield, cape } from './warrior-parts.js';
export { mesh } from './sculpture.js';

export const WARRIORS = {
  K: { name: 'Crowned sovereign', scale: 1, speed: 1.1, stride: .38, attack: 'royal-cleave', windup: .62, strike: .28, recovery: .40 },
  M: { name: 'Lotus oracle', scale: .91, speed: 1.04, stride: .31, attack: 'lotus-bolt', windup: .72, strike: .38, recovery: .46 },
  S: { name: 'Naga guardian', scale: .96, speed: 1.13, stride: .35, attack: 'shield-and-spear', windup: .50, strike: .28, recovery: .38 },
  N: { name: 'Sky cavalry', scale: 1, speed: 2, stride: .57, attack: 'mounted-sabre', windup: .48, strike: .30, recovery: .48 },
  R: { name: 'Barge sentinel', scale: 1.02, speed: 1.25, stride: .4, attack: 'anchor-smash', windup: .75, strike: .32, recovery: .5 },
  P: { name: 'Shell legionary', scale: .73, speed: 1.3, stride: .32, attack: 'spear-thrust', windup: .40, strike: .22, recovery: .32 },
  F: { name: 'Awakened legionary', scale: .82, speed: 1.25, stride: .34, attack: 'spirit-cut', windup: .5, strike: .3, recovery: .36 },
};

function makeLeg(parent, p, x, name, bones) {
  const hip = joint(parent, x, .52, 0);
  bones[`${name}Hip`] = hip;
  ellipsoid(hip, p.cloth, [0, -.12, 0], [.072, .16, .075]);
  relief(hip, p.armor, [[-.062, -.04], [-.067, -.19], [0, -.25], [.067, -.19], [.062, -.04]], .045, [0, 0, -.066]);
  const knee = joint(hip, 0, -.235, 0);
  bones[`${name}Knee`] = knee;
  ellipsoid(knee, p.gold, [0, -.015, -.043], [.067, .057, .052]);
  cylinder(knee, p.armor, .055, .041, .205, [0, -.115, 0]);
  tube(knee, p.gold, [[0, -.06, -.057], [0, -.2, -.047]], .009);
  ring(knee, p.gold, .051, .009, [0, -.185, 0]);
  const ankle = joint(knee, 0, -.215, 0);
  bones[`${name}Ankle`] = ankle;
  ellipsoid(ankle, p.armor, [0, -.02, -.05], [.065, .052, .115]);
  tube(ankle, p.gold, [[-.048, -.04, -.12], [0, -.04, -.15], [.048, -.04, -.12]], .008);
}

function makeArm(parent, p, sign, type, name, bones) {
  const arm = joint(parent, sign * .235, .35, 0);
  bones[`${name}Arm`] = arm;
  shoulder(arm, p, sign, type === 'S' || type === 'R');
  ellipsoid(arm, p.stone, [0, -.12, 0], [.062, .14, .066]);
  cylinder(arm, p.gold, .069, .064, .04, [0, -.16, 0]);
  const elbow = joint(arm, 0, -.235, 0);
  bones[`${name}Elbow`] = elbow;
  ellipsoid(elbow, p.armor, [0, -.1, 0], [.061, .12, .066]);
  tube(elbow, p.gold, [[0, -.035, -.065], [0, -.155, -.055]], .01);
  ring(elbow, p.gold, .059, .009, [0, -.15, 0]);
  const hand = joint(elbow, 0, -.21, 0);
  bones[`${name}Hand`] = hand;
  ellipsoid(hand, p.stone, [0, -.02, 0], [.046, .064, .041]);
  for (let i = 0; i < 3; i++) tube(hand, p.gold, [[-.036, -.008 - i * .019, -.033], [.026, -.008 - i * .019, -.034]], .004);
  return hand;
}

function humanoid(parent, p, type, bones, mounted = false) {
  const body = joint(parent);
  bones.body = body;
  makeLeg(body, p, -.105, 'left', bones);
  makeLeg(body, p, .105, 'right', bones);
  const waist = joint(body, 0, .53, 0);
  bones.waist = waist;
  skirt(waist, p, type === 'M');
  breastplate(waist, p, type);
  const neck = joint(waist, 0, .48, 0);
  bones.neck = neck;
  cylinder(neck, p.gold, .082, .082, .08, [0, -.015, 0]);
  const head = joint(neck, 0, .11, 0);
  bones.head = head;
  face(head, p, type);
  const leftHand = makeArm(waist, p, -1, type, 'left', bones);
  const rightHand = makeArm(waist, p, 1, type, 'right', bones);
  if (type === 'K' || type === 'M' || type === 'F') bones.cape = cape(waist, p, type === 'K');

  let armament;
  if (type === 'M') {
    armament = staff(rightHand, p);
    bones.focus = joint(leftHand, 0, -.025, -.08);
    mesh(new THREE.OctahedronGeometry(.06), p.glow, bones.focus);
  } else if (type === 'P' || type === 'S') {
    armament = spear(rightHand, p, type === 'S');
    bones.shield = shield(leftHand, p, type === 'S');
    ellipsoid(bones.shield, p.stone, [0, -.035, -.119], [.057, .085, .023]);
    tube(bones.shield, p.gold, [[0, -.10, -.146], [0, .028, -.146]], .006);
  } else if (type === 'R') {
    armament = spear(rightHand, p, false);
    for (const sign of [-1, 1]) {
      tube(armament.weapon, p.blade, [[0, .70, 0], [sign * .12, .62, 0], [sign * .23, .69, 0], [sign * .25, .83, 0]], .043);
      flame(armament.weapon, p.gold, sign * .20, .72, 0, .32, sign);
    }
    bones.shield = shield(leftHand, p, true);
    for (const sign of [-1, 1]) flame(waist, p.gold, sign * .16, .26, .16, .8, sign);
    for (let i = 0; i < 3; i++) relief(waist, p.armor, [[-.15,0],[-.18,-.09],[0,-.15],[.18,-.09],[.15,0]], .04, [0, .35 - i * .1, .10]);
  } else {
    armament = sword(rightHand, p, type === 'K');
    if (type === 'K') bones.shield = shield(leftHand, p);
  }
  bones.weapon = armament.weapon;
  bones.tip = armament.tip;
  if (mounted) {
    bones.leftHip.rotation.x = -.95; bones.rightHip.rotation.x = -.95;
    bones.leftHip.rotation.z = -.38; bones.rightHip.rotation.z = .38;
    bones.leftKnee.rotation.x = 1.45; bones.rightKnee.rotation.x = 1.45;
  }
  return body;
}

function mountHorse(parent, p, bones) {
  const horse = joint(parent, 0, .03, 0);
  bones.horse = horse;
  ellipsoid(horse, p.stone, [0, .62, .02], [.225, .26, .40]);
  ellipsoid(horse, p.armor, [0, .67, -.19], [.25, .26, .20]);
  ellipsoid(horse, p.armor, [0, .66, .27], [.23, .22, .18]);
  for (let i = 0; i < 3; i++) {
    const belt = ring(horse, p.gold, .247, .012, [0, .63, -.11 + i * .13], true);
    belt.scale.x = .91;
  }
  for (const sign of [-1, 1]) for (let i = 0; i < 4; i++) {
    const panel = joint(horse, sign * .218, .7, -.16 + i * .105);
    panel.rotation.y = sign * Math.PI / 2;
    relief(panel, p.armor, [[-.055,0],[-.055,-.18],[0,-.25],[.055,-.18],[.055,0]], .025);
    flame(panel, p.gold, 0, -.19, .034, .27);
  }
  const neck = joint(horse, 0, .69, -.29);
  bones.horseNeck = neck;
  ellipsoid(neck, p.stone, [0, .19, -.07], [.13, .29, .16]).rotation.x = -.30;
  const head = joint(neck, 0, .41, -.12);
  bones.horseHead = head;
  ellipsoid(head, p.stone, [0, 0, -.045], [.125, .16, .20]);
  ellipsoid(head, p.stone, [0, -.09, -.19], [.105, .095, .11]);
  relief(head, p.gold, [[0,.13],[-.075,.02],[-.06,-.16],[0,-.20],[.06,-.16],[.075,.02]], .032, [0, 0, -.206]);
  for (const sign of [-1, 1]) {
    ellipsoid(head, p.glow, [sign * .12, .025, -.11], [.015, .012, .027]);
    ellipsoid(head, p.armor, [sign * .10, .17, .01], [.032, .11, .05]).rotation.z = -sign * .2;
    tube(horse, p.gold, [[sign*.10,1.09,-.49],[sign*.13,.92,-.35],[sign*.18,.94,.02]], .009);
  }
  for (let i = 0; i < 6; i++) flame(neck, p.gold, 0, .035 + i * .058, .065, .32);
  bones.tail = joint(horse, 0, .73, .37);
  tube(bones.tail, p.armor, [[0,0,0],[0,-.08,.12],[0,-.32,.18],[0,-.49,.13]], .049);
  for (let i = 0; i < 4; i++) {
    const front = i < 2, sign = i % 2 ? 1 : -1;
    const hip = joint(horse, sign * .15, .60, front ? -.25 : .26);
    bones[`horseHip${i}`] = hip;
    ellipsoid(hip, p.stone, [0, -.13, 0], [.064, .18, .075]);
    const knee = joint(hip, 0, -.265, 0);
    bones[`horseKnee${i}`] = knee;
    ellipsoid(knee, p.gold, [0, 0, -.005], [.069, .065, .066]);
    cylinder(knee, p.stone, .048, .033, .24, [0, -.12, 0]);
    ellipsoid(knee, p.armor, [0, -.245, -.025], [.068, .07, .092]);
    ring(knee, p.gold, .049, .009, [0, -.17, 0]);
  }
  ellipsoid(horse, p.cloth, [0, .83, .04], [.18, .06, .2]);
  const saddle = joint(horse, 0, .50, .03);
  saddle.scale.setScalar(.64);
  humanoid(saddle, p, 'N', bones, true);
}

export function makePiece(piece) {
  const root = new THREE.Group();
  const visual = joint(root);
  const bones = {};
  const palette = makePalette(piece.color);
  const profile = WARRIORS[piece.type];
  visual.scale.setScalar(profile.scale);
  if (piece.type === 'N') mountHorse(visual, palette, bones);
  else humanoid(visual, palette, piece.type, bones);
  root.rotation.y = piece.color === 'black' ? Math.PI : 0;
  bakeRigidParts(visual, new Set(Object.values(bones)));
  const rest = {};
  for (const [name, bone] of Object.entries(bones)) {
    rest[name] = { position: bone.position.clone(), rotation: bone.rotation.clone(), scale: bone.scale.clone() };
  }
  root.userData = { piece, body: visual, bones, rest, palette, profile, animated: false };
  return root;
}

export function disposePiece(piece) {
  piece.traverse(object => object.geometry?.dispose());
  for (const material of Object.values(piece.userData.palette)) if (material?.isMaterial) material.dispose();
}
