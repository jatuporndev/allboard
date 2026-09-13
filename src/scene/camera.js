import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export class CameraRig{
 constructor(world,onLock){this.world=world;this.camera=world.camera;this.canvas=world.renderer.domElement;this.mode='orbit';this.speed=5;this.velocity=new THREE.Vector3();this.keys=new Set();this.euler=new THREE.Euler(0,0,0,'YXZ');this.orbit=new OrbitControls(this.camera,this.canvas);this.orbit.target.set(0,.3,0);this.orbit.enableDamping=true;this.orbit.dampingFactor=.065;this.orbit.minDistance=4;this.orbit.maxDistance=55;this.orbit.maxPolarAngle=Math.PI/2-.08;this.orbit.update();
  window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||document.querySelector('dialog[open]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ControlLeft','ControlRight','ShiftLeft','ShiftRight'].includes(e.code)){if(this.mode==='fly'||(this.orbit.enabled&&/^(Key[WASD]|Arrow)/.test(e.code)))e.preventDefault();this.keys.add(e.code);}});window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.keys.clear());
  document.addEventListener('pointerlockchange',()=>{this.keys.clear();this.euler.setFromQuaternion(this.camera.quaternion);onLock(document.pointerLockElement===this.canvas);});document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==this.canvas)return;this.euler.y-=e.movementX*.002;this.euler.x=THREE.MathUtils.clamp(this.euler.x-e.movementY*.002,-1.5,1.5);this.camera.quaternion.setFromEuler(this.euler);});this.canvas.addEventListener('wheel',e=>{if(this.mode==='fly'){e.preventDefault();this.speed=THREE.MathUtils.clamp(this.speed*Math.exp(-e.deltaY*.001),1,18);}},{passive:false});
 }
 setMode(mode){this.mode=mode;this.orbit.enabled=mode==='orbit';this.velocity.set(0,0,0);if(mode==='orbit'){document.exitPointerLock?.();this.orbit.target.set(0,.3,0);this.orbit.update();}else this.euler.setFromQuaternion(this.camera.quaternion);}
 async lock(){try{await this.canvas.requestPointerLock();}catch{ /* Drag-free selection remains available if browser refuses pointer lock. */ }}
 home(){this.transition={start:this.camera.position.clone(),end:this.camera.aspect<.8?new THREE.Vector3(0,Math.max(22,12/this.camera.aspect),9):new THREE.Vector3(10,12.8,13.8).multiplyScalar(Math.max(1,.95/this.camera.aspect)),time:0};this.orbit.target.set(0,.3,0);}
 panOrbit(dt){
  if(!this.orbit.enabled||this.transition)return;
  const has=(...codes)=>codes.some(code=>this.keys.has(code));
  const x=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft'));
  const z=Number(has('KeyW','ArrowUp'))-Number(has('KeyS','ArrowDown'));
  if(!x&&!z)return;
  // Move both the viewpoint and its pivot across the temple floor.
  const forward=this.orbit.target.clone().sub(this.camera.position).setY(0).normalize();
  if(!forward.lengthSq())forward.set(0,0,-1);
  const right=new THREE.Vector3(-forward.z,0,forward.x);
  const step=forward.multiplyScalar(z).addScaledVector(right,x).normalize().multiplyScalar(this.speed*dt*(has('ShiftLeft','ShiftRight')?2.5:1));
  step.x=THREE.MathUtils.clamp(this.orbit.target.x+step.x,-9,9)-this.orbit.target.x;
  step.z=THREE.MathUtils.clamp(this.orbit.target.z+step.z,-12,12)-this.orbit.target.z;
  this.camera.position.add(step);this.orbit.target.add(step);
 }
 cinematic(){if(this.mode==='orbit')this.pulse=.7;}
 update(dt,t){if(this.mode==='orbit'){if(this.transition){this.transition.time+=dt;const f=Math.min(this.transition.time/1.1,1),s=f*f*(3-2*f);this.camera.position.lerpVectors(this.transition.start,this.transition.end,s);if(f===1)this.transition=null;}this.panOrbit(dt);this.orbit.update();}else{
   const has=(...codes)=>codes.some(c=>this.keys.has(c));const movement=new THREE.Vector3(Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),Number(has('Space'))-Number(has('ControlLeft','ControlRight')),Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp')));if(movement.lengthSq())movement.normalize();movement.applyAxisAngle(new THREE.Vector3(0,1,0),this.euler.y).multiplyScalar(this.speed*(has('ShiftLeft','ShiftRight')?2.5:1));this.velocity.lerp(movement,1-Math.exp(-dt*6));this.camera.position.addScaledVector(this.velocity,dt);this.camera.position.y+=Math.sin(t*1.5)*dt*.025;
   const p=this.camera.position;p.x=THREE.MathUtils.clamp(p.x,-9.5,9.5);p.z=THREE.MathUtils.clamp(p.z,-14.8,15);p.y=THREE.MathUtils.clamp(p.y,-.05,15);if(Math.abs(p.x)<5.45&&Math.abs(p.z)<5.45)p.y=Math.max(p.y,2.25);for(const c of this.world.colliders){const dx=p.x-c.x,dz=p.z-c.z,dist=Math.hypot(dx,dz);if(dist<c.r){p.x=c.x+(dx/(dist||1))*c.r;p.z=c.z+(dz/(dist||1))*c.r;}}
  }
  if(this.pulse>0){this.pulse-=dt;this.camera.fov=43-Math.sin(Math.max(0,this.pulse)/.7*Math.PI)*1.4;this.camera.updateProjectionMatrix();}
 }
}
