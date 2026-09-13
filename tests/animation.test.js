import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makePiece, disposePiece, WARRIORS } from '../src/scene/pieces.js';
import { idlePose } from '../src/scene/poses.js';
import { Animator } from '../src/scene/animation.js';
import { Effects } from '../src/scene/effects.js';
import { boardPoint } from '../src/scene/world.js';

for (const type of Object.keys(WARRIORS)) {
  test(`${type}: articulated capture preserves approach, reaction, destruction and completion order`, () => {
    const scene = new THREE.Scene();
    const p = { id: 1, type, color: 'white' }, target = { id: 2, type: type === 'K' ? 'P' : type === 'P' ? 'K' : type, color: 'black' };
    const attacker = makePiece(p), victim = makePiece(target);
    attacker.position.copy(boardPoint(27)); victim.position.copy(boardPoint(36));
    idlePose(attacker, 0); idlePose(victim, 0);
    scene.add(attacker, victim);
    const effects = new Effects(scene), world = { scene, pieces: new Map([[1, attacker], [2, victim]]) };
    const animator = new Animator(world, effects, { cinematic() {} });
    let completed = 0, frames = 0, previousPhase = '', sawFracture = false, sawDebris = false, contactChecked = false;
    const phases = [];
    animator.move({ from: 27, to: 36, piece: p, captured: target }, () => completed++);
    assert.equal(completed, 0);
    while (animator.busy && frames++ < 1000) {
      const a = animator.active;
      if (a.phase !== previousPhase) { phases.push(a.phase); previousPhase = a.phase; }
      animator.update(1 / 60); effects.update(1 / 60);
      if (a.phase === 'approach') {
        assert.equal(victim.visible, true);
        assert.equal(attacker.position.y, boardPoint(27).y);
      }
      if (a.phase === 'windup') assert(attacker.position.distanceTo(victim.position) > .4);
      if (victim.userData.palette.uniforms.fracture.value > .1) sawFracture = true;
      if (a.shattered) { sawDebris = true; assert(a.hit); }
      if(a.hit && !contactChecked && type !== 'M') {
        contactChecked = true;
        scene.updateMatrixWorld(true);
        const tip = attacker.userData.bones.tip.getWorldPosition(new THREE.Vector3());
        assert(tip.distanceTo(a.contact) < .30, `${type} weapon must physically reach the target`);
      }
      if (!victim.visible) assert(sawFracture && sawDebris);
    }
    assert.equal(completed, 1);
    assert.deepEqual(phases, ['turn', 'approach', 'windup', 'strike', 'recover', 'claim', 'settle']);
    assert(attacker.position.distanceTo(boardPoint(36)) < 1e-8);
    assert.equal(attacker.userData.animated, false);
    assert(sawFracture && sawDebris);
    for (const bone of Object.values(attacker.userData.bones)) assert(bone.matrix.elements.every(Number.isFinite));
    for (let i = 0; i < 180; i++) effects.update(1 / 60);
    assert.equal(effects.transients.length, 0);
    assert.equal(scene.children.length, 2, 'all combat effects release their scene objects');
    effects.clear(); disposePiece(attacker); disposePiece(victim);
  });
}

test('idle keeps the root and feet grounded; animated rigs are not overwritten', () => {
  const piece = makePiece({ id: 0, type: 'K', color: 'white' });
  const position = piece.position.clone();
  idlePose(piece, 5);
  assert(piece.position.equals(position));
  assert.equal(piece.userData.bones.leftHip.rotation.x, 0);
  piece.userData.animated = true;
  piece.userData.bones.rightArm.rotation.x = .8;
  idlePose(piece, 8);
  assert.equal(piece.userData.bones.rightArm.rotation.x, .8);
  disposePiece(piece);
});
