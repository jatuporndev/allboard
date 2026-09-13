import * as THREE from 'three';

export const smooth = x => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
export const lerpAngle = (from, to, t) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * t;

export function resetPose(piece) {
  const { bones, rest } = piece.userData;
  for (const [name, bone] of Object.entries(bones)) {
    bone.position.copy(rest[name].position);
    bone.rotation.copy(rest[name].rotation);
    bone.scale.copy(rest[name].scale);
  }
}

function ready(piece) {
  const b = piece.userData.bones, type = piece.userData.piece.type;
  b.leftArm.rotation.z = -.12;
  b.rightArm.rotation.z = .14;
  b.leftElbow.rotation.x = -.38;
  b.rightElbow.rotation.x = -.38;
  if (type === 'M') { b.leftArm.rotation.x = -.20; b.leftElbow.rotation.x = -1.0; }
  if (type === 'K' || type === 'F' || type === 'N') {
    b.rightElbow.rotation.x = -.60;
    b.weapon.rotation.x = -.45;
  }
  if (type === 'R') { b.rightArm.rotation.x = -.25; b.rightElbow.rotation.x = -.65; b.weapon.rotation.x = .5; }
  if (type === 'N') { b.leftArm.rotation.x = -.45; b.leftElbow.rotation.x = -.72; }
}

export function idlePose(piece, time) {
  if (piece.userData.animated) return;
  resetPose(piece); ready(piece);
  const b = piece.userData.bones, type = piece.userData.piece.type;
  const phase = time * (type === 'R' ? .7 : 1.1) + piece.userData.piece.id * 1.73;
  const breath = Math.sin(phase);
  b.waist.rotation.x = breath * .012;
  b.neck.rotation.y = Math.sin(phase * .43) * .065;
  b.rightArm.rotation.x += breath * .014;
  b.leftArm.rotation.z += breath * .016;
  if (b.cape) b.cape.rotation.x = .035 + Math.sin(phase * .8) * .018;
  if (b.horse) {
    b.horseNeck.rotation.x = Math.sin(phase * .7) * .025;
    b.horseHead.rotation.y = Math.sin(phase * .6) * .05;
    b.tail.rotation.z = Math.sin(phase) * .10;
  }
  if (type === 'M') { b.leftHand.rotation.y = phase * .15; b.focus.rotation.y = time * .6; }
  if (type === 'S') b.leftElbow.rotation.x -= .1 + breath * .02;
}

export function walkPose(piece, distance, weight = 1) {
  resetPose(piece); ready(piece);
  const { bones: b, profile } = piece.userData;
  const cycle = distance / profile.stride * Math.PI;
  const phase = Math.sin(cycle);
  if (b.horse) {
    for (let i = 0; i < 4; i++) {
      const step = Math.sin(cycle + (i === 0 || i === 3 ? 0 : Math.PI));
      b[`horseHip${i}`].rotation.x = step * .48 * weight;
      b[`horseKnee${i}`].rotation.x = Math.max(0, -step) * .75 * weight;
    }
    b.horse.position.y += Math.abs(Math.cos(cycle)) * .022 * weight;
    b.waist.rotation.x = -.08 * weight;
    b.horseNeck.rotation.x = phase * .04 * weight;
    b.tail.rotation.x = .13 * weight;
  } else {
    // Two-link leg IK: stance feet stay on the stone; only the swing foot lifts.
    for (const [name, offset] of [['left', 0], ['right', Math.PI]]) {
      const f = ((cycle + offset) / (Math.PI * 2) % 1 + 1) % 1;
      const swing = f >= .5, u = swing ? (f - .5) * 2 : f * 2;
      const z = (swing ? .11 - .22 * smooth(u) : -.11 + .22 * u) * weight;
      const lift = swing ? Math.sin(u * Math.PI) * .075 * weight : 0;
      const y = .443 - lift, l1 = .235, l2 = .215;
      const distance = Math.min(.449, Math.hypot(y, z));
      const knee = Math.acos(THREE.MathUtils.clamp((distance * distance - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1));
      const hip = Math.atan2(-z, y) - Math.atan2(l2 * Math.sin(knee), l1 + l2 * Math.cos(knee));
      b[`${name}Hip`].rotation.x = hip * weight;
      b[`${name}Knee`].rotation.x = knee * weight;
      b[`${name}Ankle`].rotation.x = -(hip + knee) * weight;
    }
    b.waist.rotation.y = phase * .055 * weight;
    b.waist.rotation.x = -.04 * weight;
    b.leftArm.rotation.x += -phase * .15 * weight;
    b.rightArm.rotation.x += phase * .11 * weight;
    if (b.cape) b.cape.rotation.x = .12 * weight + Math.sin(cycle + .8) * .045 * weight;
  }
}

export function attackPose(piece, phase, progress) {
  resetPose(piece); ready(piece);
  const b = piece.userData.bones, type = piece.userData.piece.type;
  const charge = phase === 'windup' ? smooth(progress) : phase === 'strike' ? 1 : 1 - smooth(progress);
  const strike = phase === 'strike' ? smooth(progress) : phase === 'recover' ? 1 - smooth(progress) : 0;
  if (type === 'P' || type === 'S') {
    b.waist.rotation.y = -.18 * charge + .32 * strike;
    b.rightArm.rotation.x = -.15 - .8 * charge - .52 * strike;
    b.rightElbow.rotation.x = -.4 - .65 * charge + .78 * strike;
    b.weapon.rotation.x = -.82 * charge + .06 * strike;
    b.rightArm.position.z += .06 * charge - .18 * strike;
    b.leftArm.rotation.x = -.2 - (type === 'S' ? .7 : .35) * charge;
    b.leftElbow.rotation.x = -.65;
    if (type === 'S') {
      b.leftArm.position.z -= Math.sin(charge * Math.PI) * .14;
      b.leftArm.rotation.y = -.22 * charge;
    }
    b.leftHip.rotation.x = -.15 * strike;
    b.rightKnee.rotation.x = .22 * strike;
    b.waist.rotation.x = -.1 * strike;
  } else if (type === 'M') {
    b.rightArm.rotation.x = -.35 - .35 * charge;
    b.rightElbow.rotation.x = -.55;
    b.weapon.rotation.x = .65 * charge;
    b.leftArm.rotation.x = -.2 - .9 * charge;
    b.leftElbow.rotation.x = -1.2 + 1.0 * strike;
    b.leftHand.rotation.z = Math.PI * .5 * charge;
    b.neck.rotation.x = -.12 * charge;
    b.waist.rotation.y = -.13 * charge + .27 * strike;
    b.focus.scale.setScalar(1 + charge * .8);
  } else if (type === 'R') {
    b.rightArm.rotation.x = -.25 - 2.4 * charge + 2.15 * strike;
    b.rightElbow.rotation.x = -.5 - .45 * charge + .5 * strike;
    b.weapon.rotation.x = .5 - 1.05 * charge;
    b.waist.rotation.x = -.12 * charge + .37 * strike;
    b.body.position.y -= .065 * strike;
    b.leftKnee.rotation.x = .22 * strike;
    b.rightKnee.rotation.x = .18 * strike;
    b.leftArm.rotation.z = -.3 * charge;
  } else {
    b.waist.rotation.y = -.5 * charge + .98 * strike;
    b.rightArm.rotation.x = -.35 - 1.7 * charge + 1.5 * strike;
    b.rightArm.rotation.z = .12 + .55 * charge - .9 * strike;
    b.rightElbow.rotation.x = -.65 - .55 * charge + .95 * strike;
    b.weapon.rotation.x = -.5 - .3 * charge;
    b.weapon.rotation.z = -.25 * charge;
    b.waist.rotation.x = -.05 * charge + .12 * strike;
    if (type === 'N') {
      b.horse.rotation.x = -.13 * charge + .13 * strike;
      b.horseNeck.rotation.x = .16 * charge;
      for (let i = 0; i < 2; i++) {
        b[`horseHip${i}`].rotation.x = -.42 * charge;
        b[`horseKnee${i}`].rotation.x = .65 * charge;
      }
    }
    if (b.cape) b.cape.rotation.y = -.18 * charge + .3 * strike;
    if (type === 'F') {
      b.waist.rotation.y = .32 * charge - .7 * strike;
      b.rightArm.rotation.x = -.35 - .5 * charge - .85 * strike;
      b.rightArm.rotation.z = .12 + .38 * charge - .48 * strike;
      b.leftArm.rotation.z = -.4 * charge;
    }
  }
}

export function defendPose(piece, amount) {
  resetPose(piece); ready(piece);
  const b = piece.userData.bones;
  b.neck.rotation.x = -.08 * amount;
  b.leftArm.rotation.x -= .55 * amount;
  b.leftElbow.rotation.x -= .3 * amount;
  b.waist.rotation.y = .14 * amount;
  b.rightKnee.rotation.x += .1 * amount;
}

export function defeatPose(piece, progress) {
  resetPose(piece); ready(piece);
  const b = piece.userData.bones, type = piece.userData.piece.type;
  const recoil = Math.sin(Math.min(1, progress * 3) * Math.PI * .8);
  const collapse = smooth((progress - .18) / .82);
  b.neck.rotation.x = -.30 * recoil + .35 * collapse;
  b.waist.rotation.x = -.27 * recoil + (type === 'R' ? .32 : .68) * collapse;
  b.waist.rotation.z = .18 * collapse;
  b.leftArm.rotation.z = -.32 * recoil;
  b.rightArm.rotation.z = .4 * recoil;
  b.rightElbow.rotation.x = -.4 + .3 * collapse;
  b.leftKnee.rotation.x += .85 * collapse;
  b.rightKnee.rotation.x += .72 * collapse;
  b.leftHip.rotation.x -= .42 * collapse;
  b.rightHip.rotation.x -= .32 * collapse;
  b.body.position.y -= .24 * collapse;
  b.weapon.rotation.z = -.45 * collapse;
  if (b.horse) { b.horse.rotation.z = .32 * collapse; b.horse.position.y -= .17 * collapse; b.horseNeck.rotation.x = .45 * collapse; }
  if (type === 'M' || type === 'F') {
    // The oracle and awakened infantry lose their binding enchantment upward.
    b.body.position.y += .22 * collapse;
    b.leftArm.rotation.x -= .65 * recoil;
    b.waist.rotation.y = collapse * .45;
    if (b.focus) b.focus.scale.setScalar(1 + recoil);
  }
  if (type === 'S') { b.leftArm.rotation.z -= .3 * collapse; b.leftElbow.rotation.x = .5 * collapse; }
  if (type === 'K') { b.rightKnee.rotation.x += .35 * collapse; b.waist.rotation.x *= .6; }
  if (type === 'R') { b.body.position.y -= .12 * collapse; b.waist.rotation.z = -.16 * collapse; }
  if (b.cape) b.cape.rotation.x = .22 * collapse;
  piece.userData.palette.uniforms.fracture.value = smooth(progress * 3);
}
