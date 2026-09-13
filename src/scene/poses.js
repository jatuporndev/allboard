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
  const type=piece.userData.piece.type;
  armTarget(piece,'right',new THREE.Vector3(type==='N'?.39:.31,.08,-.17));
  armTarget(piece,'left',new THREE.Vector3(-.31,.07,-.19));
  gripDirection(piece,new THREE.Vector3(...(['P','S','R'].includes(type)?[.07,.98,-.16]:type==='N'?[.55,.15,-.82]:type==='K'?[.14,-.78,-.61]:[.26,-.43,-.86])));
}

// Solve the elbow from a hand position, keeping hands outside the breastplate.
function armTarget(piece,name,target) {
  const b=piece.userData.bones,arm=b[`${name}Arm`],elbow=b[`${name}Elbow`];
  const delta=target.clone().sub(arm.position),distance=THREE.MathUtils.clamp(delta.length(),.035,.444);
  const upper=.235,fore=.21;
  const bend=Math.acos(THREE.MathUtils.clamp((distance*distance-upper*upper-fore*fore)/(2*upper*fore),-1,1));
  const offset=Math.atan2(fore*Math.sin(bend),upper+fore*Math.cos(bend));
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),delta.normalize());
  arm.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-offset));
  elbow.rotation.set(bend,0,0);
  if(name==='left'&&b.shield)b.leftHand.quaternion.copy(arm.quaternion).multiply(elbow.quaternion).invert();
}

function gripDirection(piece,direction) {
  const b=piece.userData.bones;
  const forearm=b.rightArm.quaternion.clone().multiply(b.rightElbow.quaternion).invert();
  direction.normalize().applyQuaternion(forearm);
  b.rightHand.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
  b.weapon.rotation.set(0,0,0);
}

function combatHands(piece,charge,strike) {
  const type=piece.userData.piece.type;
  const spear=type==='P'||type==='S',mounted=type==='N';
  const rest=new THREE.Vector3(mounted?.39:.31,.08,-.17);
  const windup=new THREE.Vector3(mounted?.40:.34,spear?.18:.57,spear?.015:-.045);
  const contact=new THREE.Vector3(mounted?.39:.30,.17,-.34);
  if(type==='M') {
    armTarget(piece,'right',rest);
    armTarget(piece,'left',new THREE.Vector3(-.28,.15+.12*charge,-.20-.12*strike));
    gripDirection(piece,new THREE.Vector3(.26,-.43,-.86));return;
  }
  armTarget(piece,'right',rest.lerp(windup,charge).lerp(contact,strike));
  armTarget(piece,'left',new THREE.Vector3(-.32,.10+.14*charge,-.19-.05*strike));
  const upright=spear?new THREE.Vector3(.06,.22,-1):new THREE.Vector3(.24,.97,-.06);
  gripDirection(piece,upright.lerp(new THREE.Vector3(.05,-.18,-1),strike));
}

function drape(b, phase, motion = 0) {
  for(let i=0;i<4;i++) {
    const panel=b[`cape${i}`];if(!panel)continue;
    // Successive cloak joints lag behind the shoulders and one another.
    panel.rotation.x=.012+motion*.04+Math.sin(phase*1.6-i*.72)*(.012+motion*.025);
    panel.rotation.z=Math.sin(phase-i*.65)*(.008+motion*.014);
  }
}

export function idlePose(piece, time) {
  if (piece.userData.animated || piece.userData.surrendered) return;
  resetPose(piece); ready(piece);
  const b = piece.userData.bones, type = piece.userData.piece.type;
  const phase = time * (type === 'R' ? .7 : 1.1) + piece.userData.piece.id * 1.73;
  const breath = Math.sin(phase);
  b.waist.rotation.x = breath * .012;
  b.waist.scale.z = 1 + breath * .009;
  b.neck.rotation.y = Math.sin(phase * .43) * (type==='K'?.022:.065);
  if(type==='K'){b.neck.rotation.x=.018;b.waist.rotation.x*=.4;}
  b.rightArm.rotation.x += breath * .014;
  b.leftArm.rotation.z += breath * .016;
  if (b.cape) b.cape.rotation.x = .035 + Math.sin(phase * .8) * .018;
  drape(b,phase);
  if (b.horse) {
    b.horseNeck.rotation.x = Math.sin(phase * .7) * .025;
    b.horseHead.rotation.y = Math.sin(phase * .6) * .05;
    b.tail.rotation.z = Math.sin(phase) * .10;
    b.tail.rotation.x = .035 + Math.sin(phase * .7) * .045;
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
    b.waist.rotation.z = Math.cos(cycle) * .018 * weight;
    b.neck.rotation.y = -phase * .025 * weight;
    b.waist.rotation.x = -.04 * weight;
    b.leftArm.rotation.x += -phase * .15 * weight;
    b.rightArm.rotation.x += phase * .11 * weight;
    if (b.cape) b.cape.rotation.x = .12 * weight + Math.sin(cycle + .8) * .045 * weight;
  }
  drape(b,cycle,weight);
}

export function attackPose(piece, phase, progress) {
  resetPose(piece); ready(piece);
  const b = piece.userData.bones, type = piece.userData.piece.type;
  const charge = phase === 'windup' ? smooth(progress) : phase === 'strike' ? 1 : 1 - smooth(progress);
  const strike = phase === 'strike' ? smooth(progress) : phase === 'recover' ? 1 - smooth(progress) : 0;
  drape(b,charge*2+strike*3,charge+strike);
  if (type === 'P' || type === 'S') {
    b.waist.rotation.y = -.18 * charge + .32 * strike;
    if (type === 'S') {
    }
    b.leftHip.rotation.x = -.15 * strike;
    b.rightKnee.rotation.x = .22 * strike;
    b.waist.rotation.x = -.1 * strike;
  } else if (type === 'M') {
    b.leftHand.rotation.z = Math.PI * .5 * charge;
    b.neck.rotation.x = -.12 * charge;
    b.waist.rotation.y = -.13 * charge + .27 * strike;
    b.focus.scale.setScalar(1 + charge * .8);
  } else if (type === 'R') {
    b.waist.rotation.x = -.12 * charge + .37 * strike;
    b.body.position.y -= .065 * strike;
    b.leftKnee.rotation.x = .22 * strike;
    b.rightKnee.rotation.x = .18 * strike;
  } else {
    b.waist.rotation.y = -.5 * charge + .98 * strike;
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
    }
  }
  combatHands(piece,charge,strike);
}

export function defendPose(piece, amount) {
  resetPose(piece); ready(piece);
  const b = piece.userData.bones;
  b.neck.rotation.x = -.08 * amount;
  b.leftArm.rotation.x -= .55 * amount;
  b.leftElbow.rotation.x -= .3 * amount;
  b.waist.rotation.y = .14 * amount;
  b.rightKnee.rotation.x += .1 * amount;
  armTarget(piece,'left',new THREE.Vector3(-.28,.15+.10*amount,-.24));
  armTarget(piece,'right',new THREE.Vector3(.32,.12+.12*amount,-.23));
  gripDirection(piece,new THREE.Vector3(.12,.82,-.55));
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
  gripDirection(piece,new THREE.Vector3(.45,.25-.8*collapse,-.8));
  piece.userData.palette.uniforms.fracture.value = smooth(progress * 3);
}

export function resistPose(piece, progress) {
  defendPose(piece,1);
  const b=piece.userData.bones;
  const brace=Math.sin(Math.min(1,progress/.68)*Math.PI/2);
  b.waist.rotation.x=-.09*brace;
  b.waist.rotation.y+=.16*brace;
  b.leftArm.rotation.x-=.25*brace;
  b.leftElbow.rotation.x-=.18*brace;
  b.rightArm.rotation.x-=.75*brace;
  b.rightElbow.rotation.x-=.3*brace;
  b.weapon.rotation.x-=.55*brace;
  b.neck.rotation.x-=.08*brace;
  if(!b.horse){b.body.position.y-=.035*brace;b.leftKnee.rotation.x+=.12*brace;b.rightKnee.rotation.x+=.16*brace;}
  armTarget(piece,'left',new THREE.Vector3(-.27,.23,-.28));
  armTarget(piece,'right',new THREE.Vector3(.31,.22,-.25-.04*brace));
  gripDirection(piece,new THREE.Vector3(.15,.70,-.7));
}

// A quiet surrender after the rules have already declared checkmate.
// The crown stays in its original hierarchy, so undo/reset needs no reparenting.
export function surrenderPose(piece, time) {
  resetPose(piece);ready(piece);
  const b=piece.userData.bones;
  const kneel=smooth(time/.9),reach=smooth((time-.55)/.8);
  const lift=smooth((time-1.35)/.55),lower=smooth((time-1.9)/1.5);
  const release=smooth((time-3.4)/.65),bow=smooth((time-3.75)/.65);
  b.body.position.y-=.25*kneel;
  b.leftHip.rotation.x=-.85*kneel;b.rightHip.rotation.x=-.85*kneel;
  b.leftKnee.rotation.x=1.7*kneel;b.rightKnee.rotation.x=1.7*kneel;
  b.leftAnkle.rotation.x=-.85*kneel;b.rightAnkle.rotation.x=-.85*kneel;
  b.waist.rotation.x=-.6*lower-.10*bow;
  b.neck.rotation.x=-.12*kneel-.38*bow;
  b.weapon.visible=false;if(b.shield)b.shield.visible=false;
  if(b.cape)b.cape.rotation.x=.12*kneel;
  drape(b,time,.2*(1-bow));
  piece.updateMatrixWorld(true);
  const visual=piece.userData.body;
  const headwear=visual.worldToLocal(b.crown.getWorldPosition(new THREE.Vector3()));
  const raised=headwear.clone().add(new THREE.Vector3(0,.10*lift,-.04*lift));
  const ground=new THREE.Vector3(0,.012,-.43);
  const crownPosition=raised.lerp(ground,lower);
  b.crown.position.copy(b.crown.parent.worldToLocal(visual.localToWorld(crownPosition.clone())));
  // Keep the crown upright as the king leans down to place it.
  const worldRotation=visual.getWorldQuaternion(new THREE.Quaternion());
  b.crown.quaternion.copy(b.crown.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldRotation));
  piece.updateMatrixWorld(true);
  for(const [name,sign]of [['left',-1],['right',1]]) {
    const arm=b[`${name}Arm`],elbow=b[`${name}Elbow`];
    const grip=crownPosition.clone().add(new THREE.Vector3(sign*.14,.035,0));
    grip.lerp(new THREE.Vector3(sign*.18,.22,-.21),release);
    const target=arm.parent.worldToLocal(visual.localToWorld(grip)).sub(arm.position);
    const distance=THREE.MathUtils.clamp(target.length(),.035,.444);
    const upper=.235,fore=.21;
    const knee=Math.acos(THREE.MathUtils.clamp((distance*distance-upper*upper-fore*fore)/(2*upper*fore),-1,1));
    const offset=Math.atan2(fore*Math.sin(knee),upper+fore*Math.cos(knee));
    const aim=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),target.normalize());
    aim.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),offset));
    arm.quaternion.slerp(aim,reach);elbow.rotation.x=THREE.MathUtils.lerp(elbow.rotation.x,-knee,reach);
  }
}
