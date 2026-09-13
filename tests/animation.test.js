import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makePiece, disposePiece, WARRIORS } from '../src/scene/pieces.js';
import { idlePose, walkPose, attackPose, defendPose, resistPose } from '../src/scene/poses.js';
import { Animator } from '../src/scene/animation.js';
import { Effects } from '../src/scene/effects.js';
import { World, boardPoint } from '../src/scene/world.js';
import { ArmyBatches } from '../src/scene/army-batches.js';

for (const type of Object.keys(WARRIORS)) {
  test(`${type}: articulated capture preserves approach, reaction, destruction and completion order`, () => {
    const scene = new THREE.Scene();
    const p = { id: 1, type, color: 'white' }, target = { id: 2, type: type === 'K' ? 'P' : type === 'P' ? 'K' : type, color: 'black' };
    const attacker = makePiece(p), victim = makePiece(target);
    attacker.position.copy(boardPoint(27)); victim.position.copy(boardPoint(36));
    idlePose(attacker, 0); idlePose(victim, 0);
    const idleGuard=victim.userData.bones.rightArm.quaternion.clone();
    scene.add(attacker, victim);
    const effects = new Effects(scene), world = { scene, pieces: new Map([[1, attacker], [2, victim]]) };
    const animator = new Animator(world, effects, { cinematic() {} });
    let completed = 0, frames = 0, previousPhase = '', sawFracture = false, sawDebris = false, contactChecked = false, sawResistance = false, sawImpactPause = false;
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
      if(a.phase==='strike'&&!a.hit&&victim.userData.bones.rightArm.quaternion.angleTo(idleGuard)>.1)sawResistance=true;
      if(a.hit&&a.hitPause>0)sawImpactPause=true;
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
    assert(sawResistance&&sawImpactPause,'defender resists before the final impact pause');
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

for(const loser of ['white','black'])test(`${loser} king places crown on board after checkmate and resets on undo`,()=>{
 const king=makePiece({id:1,type:'K',color:loser});king.position.copy(boardPoint(28));
 const world={pieces:new Map([[1,king]]),scene:new THREE.Scene()};world.scene.add(king);
 const animator=new Animator(world,{},{}),state={result:{reason:'Checkmate',winner:loser==='white'?'black':'white'}};
 const before=king.userData.bones.crown.position.clone();let done=0;
 assert.equal(animator.checkmate({result:{reason:'Stalemate',winner:null}}),false);
 assert(animator.checkmate(state,()=>done++));assert.equal(animator.checkmate(state),false);
 for(let i=0;i<280;i++)animator.update(1/60);
 assert.equal(done,1);assert.equal(animator.busy,false);assert(king.userData.surrendered);
 king.updateMatrixWorld(true);
 const crown=king.userData.bones.crown.getWorldPosition(new THREE.Vector3());
 assert(Math.abs(crown.y-(king.position.y+.012))<.015,'crown rests on board');
 idlePose(king,15);king.updateMatrixWorld(true);
 assert(king.userData.bones.crown.getWorldPosition(new THREE.Vector3()).distanceTo(crown)<1e-8);
 assert.equal(animator.checkmate(state),false,'duplicate room snapshots must not replay surrender');
 const board=Array(64).fill(null);board[28]=king.userData.piece;
 World.prototype.sync.call(world,{board,result:null});idlePose(king,16);
 assert(king.userData.bones.crown.position.equals(before));assert(king.userData.bones.weapon.visible);
 assert(!king.userData.surrendered);disposePiece(king);
});

test('shared soldier geometry preserves independent poses, colors and combat rendering',()=>{
 const a=makePiece({id:50,type:'P',color:'white'}),b=makePiece({id:51,type:'P',color:'white'}),c=makePiece({id:52,type:'P',color:'black'});
 const first=p=>{let mesh;p.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});return mesh;};
 assert.equal(first(a).geometry,first(b).geometry);assert.equal(first(a).geometry,first(c).geometry);
 a.userData.bones.rightArm.rotation.x=.7;assert.notEqual(b.userData.bones.rightArm.rotation.x,.7);
 a.userData.palette.uniforms.fracture.value=1;assert.equal(b.userData.palette.uniforms.fracture.value,0);
 assert.notEqual(first(a).material,first(b).material);assert.notEqual(first(a).material.color.getHex(),first(c).material.color.getHex());
 const scene=new THREE.Scene();scene.add(a,b,c);const batch=new ArmyBatches(scene);batch.rebuild(new Map([[50,a],[51,b],[52,c]]));
 assert(batch.batches.length>0);a.userData.animated=true;batch.prepare();
 assert(first(a).visible,'combat uses its own meshes');assert(!first(b).visible,'idle clone uses instances');
 batch.restore();assert(first(b).visible,'picking sees original meshes after rendering');
 let disposed=0;first(a).geometry.addEventListener('dispose',()=>disposed++);
 disposePiece(a);assert.equal(disposed,0);disposePiece(b);assert.equal(disposed,0);disposePiece(c);assert.equal(disposed,1);
 batch.rebuild(new Map());for(const palette of Object.values(batch.palettes))for(const material of Object.values(palette))material.dispose?.();
});

for(const type of Object.keys(WARRIORS))test(`${type}: held weapon clears the chest and face through movement and combat poses`,()=>{
 const piece=makePiece({id:80,type,color:'white'}),b=piece.userData.bones;
 const poses=[()=>idlePose(piece,1),()=>defendPose(piece,1),()=>resistPose(piece,.5)];
 for(let i=0;i<=10;i++) {
  poses.push(()=>walkPose(piece,i*.08,1));
  for(const phase of ['windup','strike','recover'])poses.push(()=>attackPose(piece,phase,i/10));
 }
 for(const pose of poses) {
  pose();piece.updateMatrixWorld(true);
  for(let i=0;i<32;i++) {
   const y=THREE.MathUtils.lerp(['P','S','R'].includes(type)?-.4:-.07,b.tip.position.y,i/31);
   const point=b.weapon.localToWorld(new THREE.Vector3(0,y,0));
   const chest=b.waist.worldToLocal(point.clone()),head=b.head.worldToLocal(point.clone());
   assert((chest.x/.20)**2+((chest.y-.23)/.21)**2+((chest.z+.005)/.12)**2>=1,'weapon intersects breastplate');
   assert((head.x/.115)**2+(head.y/.155)**2+(head.z/.11)**2>=1,'weapon intersects face');
  }
 }
 disposePiece(piece);
});
