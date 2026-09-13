import * as THREE from 'three';
import { boardPoint } from './world.js';
import { smooth, lerpAngle, walkPose, attackPose, defendPose, resistPose, defeatPose, surrenderPose } from './poses.js';

const facing = direction => Math.atan2(-direction.x, -direction.z);

// Visual route planning affects only choreography, never Makruk move legality.
// Cavalry can ride around occupied squares instead of jumping through an army.
function cavalryRoute(start, end, world, attacker, victim) {
  const step = .28, bound = 18;
  const obstacles = [...world.pieces.values()].filter(p => p !== attacker && p !== victim).map(p => p.position);
  const clear = (x, z) => obstacles.every(p => Math.hypot(p.x - x, p.z - z) > .53);
  const key = (x, z) => `${x},${z}`;
  const sx = Math.round(start.x / step), sz = Math.round(start.z / step), ex = Math.round(end.x / step), ez = Math.round(end.z / step);
  const first = { x: sx, z: sz, g: 0, h: Math.hypot(ex - sx, ez - sz), parent: null };
  const open = [first], costs = new Map([[key(sx, sz), 0]]);
  let found;
  while (open.length) {
    open.sort((a, b) => a.g + a.h - b.g - b.h);
    const node = open.shift();
    if (node.x === ex && node.z === ez) { found = node; break; }
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const x = node.x + dx, z = node.z + dz, g = node.g + Math.hypot(dx, dz), id = key(x, z);
      if (Math.abs(x) > bound || Math.abs(z) > bound || g >= (costs.get(id) ?? Infinity)) continue;
      if (!clear(x * step, z * step) || !clear((node.x + dx * .5) * step, (node.z + dz * .5) * step)) continue;
      costs.set(id, g); open.push({ x, z, g, h: Math.hypot(ex - x, ez - z), parent: node });
    }
  }
  if (!found) return [start, end];
  const points = [];
  while (found) { points.unshift(new THREE.Vector3(found.x * step, start.y, found.z * step)); found = found.parent; }
  points[0] = start; points[points.length - 1] = end;
  return points;
}

export class Animator {
  constructor(world, effects, rig) { Object.assign(this, { world, effects, rig }); this.active = null; }
  get busy() { return !!this.active; }

  checkmate(state, done = () => {}) {
    if(this.busy||state.result?.reason!=='Checkmate'||!state.result.winner)return false;
    const king=[...this.world.pieces.values()].find(p=>p.userData.piece.type==='K'&&p.userData.piece.color!==state.result.winner);
    if(!king||king.userData.surrendered)return false;
    king.userData.animated=true;
    this.active={phase:'surrender',king,time:0,done};
    return true;
  }

  move(move, done) {
    const attacker = this.world.pieces.get(move.piece.id), victim = move.captured ? this.world.pieces.get(move.captured.id) : null;
    const start = boardPoint(move.from), end = boardPoint(move.to), direction = end.clone().sub(start).normalize();
    const reach = {M:.92,K:.82,F:.68,P:.82,S:1.02,R:1.1,N:.60}[move.piece.type];
    const approach = victim ? end.clone().addScaledVector(direction, -Math.min(reach, start.distanceTo(end) * .7)) : end;
    if (victim && move.piece.type === 'N') {
      const right = new THREE.Vector3(-direction.z, 0, direction.x);
      approach.copy(end).addScaledVector(direction, -.08).addScaledVector(right, -.48);
    }
    const points = move.piece.type === 'N' ? cavalryRoute(start, approach, this.world, attacker, victim) : [start, approach];
    const route = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const distance = route.getLength();
    const profile = attacker.userData.profile;
    attacker.userData.animated = true;
    if (victim) victim.userData.animated = true;
    this.active = {
      move, done, attacker, victim, start, end, direction, approach, route, distance, profile,
      phase: 'turn', time: 0, fromAngle: attacker.rotation.y, victimAngle: victim?.rotation.y,
      angle: facing(route.getTangent(0)), travelDuration: Math.max(.42, Math.min(3.7, distance / profile.speed)),
      contact: end.clone().add(new THREE.Vector3(0, Math.min(.95, .78 * (victim?.userData.profile.scale ?? 1)), 0)),
      footstep: -1, hit: false, shattered: false, deathTime: 0, lastTip: null,
      color: move.piece.color === 'white' ? 0xffcd7c : 0x70e3bf,
    };
  }

  next(phase) { this.active.phase = phase; this.active.time = 0; this.active.lastTip = null; }

  footsteps(a, distance) {
    const step = Math.floor(distance / a.profile.stride);
    if (step !== a.footstep) { a.footstep = step; this.effects.sound('step', a.move.piece.type); }
  }

  aimWeapon(a, amount) {
    if (a.move.piece.type === 'M') return;
    const hand = a.attacker.userData.bones.rightHand;
    a.attacker.updateMatrixWorld(true);
    const localTarget = hand.parent.worldToLocal(a.contact.clone()).sub(hand.position).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), localTarget);
    hand.quaternion.slerp(rotation, amount);
  }

  update(dt) {
    const a = this.active;
    if (!a) return;
    // A short impact pause sells contact without delaying the whole animation.
    if(a.hitPause>0){a.hitPause=Math.max(0,a.hitPause-dt);return;}
    a.time += dt;
    if(a.phase==='surrender') {
      surrenderPose(a.king,Math.min(a.time,4.4));
      if(a.time>=4.4) {
        a.king.userData.surrendered=true;a.king.userData.animated=false;
        this.active=null;a.done();
      }
      return;
    }
    const { attacker, victim, profile } = a;
    if (a.hit && victim) {
      a.deathTime += dt;
      defeatPose(victim, Math.min(1, a.deathTime / .8));
      if (a.deathTime > .48 && !a.shattered) { a.shattered = true; this.effects.shatter(victim, a.direction); }
      if (a.deathTime > .48) victim.userData.palette.uniforms.dissolve.value = smooth((a.deathTime - .48) / .35);
      if (a.deathTime > .85) victim.visible = false;
    }

    if (a.phase === 'turn') {
      const t = Math.min(1, a.time / .28);
      walkPose(attacker, t * .1, Math.sin(t * Math.PI) * .35);
      attacker.rotation.y = lerpAngle(a.fromAngle, a.angle, smooth(t));
      if (victim) { defendPose(victim, t); victim.rotation.y = lerpAngle(a.victimAngle, facing(a.direction) + Math.PI, smooth(t)); }
      if (t === 1) this.next('approach');
    } else if (a.phase === 'approach') {
      const t = Math.min(1, a.time / a.travelDuration), progress = smooth(t);
      attacker.position.copy(a.route.getPointAt(progress));
      attacker.rotation.y = lerpAngle(attacker.rotation.y, facing(a.route.getTangentAt(Math.min(.999, progress))), Math.min(1, dt * 12));
      walkPose(attacker, progress * a.distance, Math.min(1, t * 6, (1 - t) * 6));
      this.footsteps(a, progress * a.distance);
      if (victim) defendPose(victim, 1);
      if (t === 1) { attacker.rotation.y = facing(a.direction); this.next(victim ? 'windup' : 'settle'); }
    } else if (a.phase === 'windup') {
      const t = Math.min(1, a.time / profile.windup);
      attackPose(attacker, 'windup', t); resistPose(victim,t*.35);
      if (a.move.piece.type === 'M' && a.time <= dt * 1.01) this.effects.ring(attacker.position, a.color, .5, profile.windup);
      if (t === 1) { this.next('strike'); this.rig.cinematic(); }
    } else if (a.phase === 'strike') {
      const t = Math.min(1, a.time / profile.strike);
      // Accelerate out of the windup, then follow through after contact.
      const strike=t<.68?Math.pow(t/.68,1.7)*.68:t;
      attackPose(attacker, 'strike', strike);
      if(!a.hit)resistPose(victim,t);
      if(t>=.32&&!a.parried) {
        a.parried=true;
        if(a.move.piece.type!=='M') {
          this.effects.sparks(a.contact,a.color,8,.22);
          a.hitPause=.035;
        }
      }
      attacker.position.copy(a.approach).addScaledVector(a.direction, Math.sin(t * Math.PI) * (a.move.piece.type==='R'?.13:.09));
      this.aimWeapon(a, smooth(t / .65));
      attacker.updateMatrixWorld(true);
      const tip = attacker.userData.bones.tip.getWorldPosition(new THREE.Vector3());
      if (a.lastTip) this.effects.trail(a.lastTip, tip, a.color);
      a.lastTip = tip;
      if (a.move.piece.type === 'M' && t > .1 && !a.bolt) {
        a.bolt = true;
        const palm = attacker.userData.bones.focus.getWorldPosition(new THREE.Vector3());
        this.effects.bolt(palm, a.contact, a.color);
      }
      if (t >= .68 && !a.hit) {
        a.hit = true;
        a.hitPause=a.move.piece.type==='R'?.085:.055;
        this.effects.impact(a.contact, a.color, a.move.piece.type);
      }
      if (t === 1) { attacker.position.copy(a.approach); this.next('recover'); }
    } else if (a.phase === 'recover') {
      attackPose(attacker, 'recover', Math.min(1, a.time / profile.recovery));
      this.aimWeapon(a, 1 - smooth(a.time / profile.recovery));
      if (a.time >= Math.max(profile.recovery, .85)) this.next('claim');
    } else if (a.phase === 'claim') {
      const t = Math.min(1, a.time / .65), progress = smooth(t), distance = a.approach.distanceTo(a.end);
      attacker.position.lerpVectors(a.approach, a.end, progress);
      attacker.rotation.y = lerpAngle(attacker.rotation.y, facing(a.end.clone().sub(a.approach)), Math.min(1, dt * 8));
      walkPose(attacker, a.distance + distance * progress, Math.sin(t * Math.PI));
      this.footsteps(a, a.distance + distance * progress);
      if (t === 1) this.next('settle');
    } else if (a.phase === 'settle') {
      walkPose(attacker, a.distance, 0);
      if (a.time > .12) {
        attacker.position.copy(a.end); attacker.userData.animated = false;
        if (a.move.promoted) { this.effects.ring(a.end, a.color, .75, .8); this.effects.sparks(a.end.clone().add(new THREE.Vector3(0, .8, 0)), a.color, 40, .4); }
        this.active = null; a.done();
      }
    }
  }
}
