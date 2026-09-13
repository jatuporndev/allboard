import * as THREE from 'three';
import {mesh,makePiece,disposePiece} from './pieces.js';
import {bakeRigidParts} from './sculpture.js';
import {idlePose,resetPose} from './poses.js';
import {studioReflections} from './lighting.js';
import {ArmyBatches} from './army-batches.js';
export const boardPoint=i=>new THREE.Vector3((i%8-3.5)*1.12,.39,(3.5-Math.floor(i/8))*1.12);
export class World {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.4;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x121b1a);this.scene.fog=new THREE.FogExp2(0x121b1a,.026);this.camera=new THREE.PerspectiveCamera(43,1,.1,100);this.camera.position.set(10,12.8,13.8);this.camera.lookAt(0,0,0);
  this.environmentTarget=studioReflections(this.renderer,this.scene);this.renderer.toneMappingExposure=1.15;
  this.scene.add(new THREE.HemisphereLight(0xe7e0d2,0x302b23,.85));const sun=new THREE.DirectionalLight(0xffe2aa,3.4);sun.position.set(-5,12,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7.5,right:7.5,top:7.5,bottom:-7.5,near:.5,far:35});sun.shadow.bias=-.00012;sun.shadow.normalBias=.018;this.scene.add(sun);
  const rim=new THREE.DirectionalLight(0xc4d2dd,1.2);rim.position.set(4,7,-9);this.scene.add(rim);
  const stone=new THREE.MeshStandardMaterial({color:0x2e3531,roughness:.9});const trim=new THREE.MeshStandardMaterial({color:0x8c7549,metalness:.7,roughness:.4});const dark=new THREE.MeshStandardMaterial({color:0x141f1d,roughness:.6});
  mesh(new THREE.BoxGeometry(45,.5,45),stone,this.scene,0,-.95);
  for(let x=-20;x<=20;x+=2.5)for(let z=-20;z<=20;z+=2.5)mesh(new THREE.BoxGeometry(2.47,.035,2.47),((x+z)%5===0)?stone:dark,this.scene,x,-.677,z);
  mesh(new THREE.CylinderGeometry(7.2,7.5,.25,8),stone,this.scene,0,-.51).rotation.y=Math.PI/8;
  mesh(new THREE.BoxGeometry(10.35,.45,10.35),dark,this.scene,0,-.15);mesh(new THREE.BoxGeometry(10.1,.12,10.1),trim,this.scene,0,.13);mesh(new THREE.BoxGeometry(9.93,.19,9.93),dark,this.scene,0,.27);
  this.tiles=[];const lightTile=new THREE.MeshStandardMaterial({color:0xc0b18d,roughness:.53,metalness:.2}),darkTile=new THREE.MeshStandardMaterial({color:0x344943,roughness:.5,metalness:.3});
  for(let i=0;i<64;i++){const p=boardPoint(i);const tile=mesh(new THREE.BoxGeometry(1.105,.08,1.105),(i%8+Math.floor(i/8))%2===0?darkTile:lightTile,this.scene,p.x,.35,p.z);tile.userData.square=i;this.tiles.push(tile);}
  for(let i=0;i<8;i++){this.label('abcdefgh'[i],(i-3.5)*1.12,4.75,0);this.label(String(i+1),-4.75,(3.5-i)*1.12,0);this.label('abcdefgh'[i],(i-3.5)*1.12,-4.75,Math.PI);}
  this.colliders=[];
  for(const x of [-9,9])for(const z of [-12,-5,2]){
    this.colliders.push({x,z,r:1});mesh(new THREE.BoxGeometry(1.6,.5,1.6),dark,this.scene,x,-.4,z);mesh(new THREE.CylinderGeometry(.55,.75,9,8),stone,this.scene,x,4.2,z);
    for(const y of [.2,1,7.8,8.4])mesh(new THREE.CylinderGeometry(.76,.76,.18,8),trim,this.scene,x,y,z);
    mesh(new THREE.BoxGeometry(1.8,.5,1.8),trim,this.scene,x,8.8,z);
    for(let k=0;k<3;k++)mesh(new THREE.ConeGeometry(1.2-k*.22,.7,4),trim,this.scene,x,9.3+k*.48,z).rotation.y=Math.PI/4;
  }
  for(const x of [-10.4,10.4])mesh(new THREE.BoxGeometry(.6,12,35),stone,this.scene,x,5,-4);
  mesh(new THREE.BoxGeometry(22,12,.6),dark,this.scene,0,5,-16);
  for(let i=0;i<3;i++){const arch=mesh(new THREE.TorusGeometry(3.5+i*.38,.045,6,64,Math.PI),trim,this.scene,0,3.5,-15.6);arch.rotation.z=0;}
  const emblem=mesh(new THREE.TorusGeometry(1.45,.07,8,64),trim,this.scene,0,4,-15.5);mesh(new THREE.OctahedronGeometry(.65),trim,this.scene,0,4,-15.3);
  this.flames=[];for(const x of [-6.4,6.4])for(const z of [-6.2,6.2]){
    mesh(new THREE.CylinderGeometry(.3,.5,1.2,8),dark,this.scene,x,-.05,z);mesh(new THREE.CylinderGeometry(.55,.2,.28,10),trim,this.scene,x,.63,z);
    const flame=mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshBasicMaterial({color:0xffbb59}),this.scene,x,.98,z);flame.scale.y=1.8;this.flames.push(flame);const fire=new THREE.PointLight(0xffa34d,7,8,2);fire.position.set(x,1.3,z);this.scene.add(fire);
  }
  // Temple masonry is static: consolidate hundreds of floor and pillar meshes.
  const architecture=new THREE.Group();
  for(const object of [...this.scene.children])if(object.isMesh&&!this.tiles.includes(object)&&!this.flames.includes(object))architecture.add(object);
  bakeRigidParts(architecture);this.scene.add(architecture);
  this.pieces=new Map();this.armyBatches=new ArmyBatches(this.scene);this.markers=new THREE.Group();this.scene.add(this.markers);
  const positions=new Float32Array(180*3);for(let i=0;i<positions.length;i+=3){positions[i]=(Math.random()-.5)*27;positions[i+1]=Math.random()*10;positions[i+2]=(Math.random()-.5)*27;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));this.dust=new THREE.Points(geo,new THREE.PointsMaterial({color:0xe2bf77,size:.028,transparent:true,opacity:.55,depthWrite:false}));this.scene.add(this.dust);
 }
 label(text,x,z,rotation){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#c3aa70';ctx.font='50px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,64);const texture=new THREE.CanvasTexture(canvas);const m=mesh(new THREE.PlaneGeometry(.38,.38),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),this.scene,x,.372,z);m.rotation.set(-Math.PI/2,0,rotation);}
 sync(state,{resetFacing=false}={}){
  let changed=false;
  const remaining=new Map(state.board.filter(Boolean).map(p=>[p.id,p]));
  for(const [id,g] of this.pieces){
   if(!remaining.has(id)||remaining.get(id).type!==g.userData.piece.type){this.scene.remove(g);disposePiece(g);this.pieces.delete(id);changed=true;}
  }
  state.board.forEach((p,i)=>{if(!p)return;let g=this.pieces.get(p.id);
   if(!g){g=makePiece(p);this.scene.add(g);this.pieces.set(p.id,g);changed=true;}
   g.position.copy(boardPoint(i));g.visible=true;g.userData.square=i;g.userData.animated=false;
   if(g.userData.surrendered&&!state.result){g.userData.surrendered=false;resetPose(g);}
   if(resetFacing)g.rotation.y=p.color==='black'?Math.PI:0;
   Object.values(g.userData.bones).forEach(b=>b.visible=true);
   g.userData.palette.uniforms.fracture.value=0;g.userData.palette.uniforms.dissolve.value=0;
  });
  if(changed)this.armyBatches?.rebuild(this.pieces);
 }
 highlight(selected,moves,state){for(const child of [...this.markers.children]){child.geometry.dispose();child.material.dispose();this.markers.remove(child);}const add=(i,color,ring)=>{const m=new THREE.Mesh(ring?new THREE.RingGeometry(.39,.46,48):new THREE.CircleGeometry(.13,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.copy(boardPoint(i));m.position.y=.403;this.markers.add(m);};if(selected!==null)add(selected,0xf4cf78,true);moves.forEach(i=>add(i,state.board[i]?0xe79065:0xd9c17f,!!state.board[i]));}
 resize(){const {width,height}=this.renderer.domElement.getBoundingClientRect();this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
 update(t){this.dust.rotation.y=t*.007;this.flames.forEach((f,i)=>f.scale.y=1.6+Math.sin(t*7+i)*.3);for(const g of this.pieces.values())idlePose(g,t);}
 render(){this.armyBatches.prepare();try{this.renderer.render(this.scene,this.camera);}finally{this.armyBatches.restore();}}
}
