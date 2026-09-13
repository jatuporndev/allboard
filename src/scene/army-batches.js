import * as THREE from 'three';
import { makePalette } from './sculpture.js';

// Repeated soldiers share sculpted geometry. Draw matching armor sections in a
// single GPU call, while the original articulated rigs still handle picking.
export class ArmyBatches {
  constructor(scene) {
    this.scene=scene;this.batches=[];this.palettes={white:makePalette('white'),black:makePalette('black')};
    this.zero=new THREE.Matrix4().makeScale(0,0,0);this.hidden=[];
  }
  rebuild(pieces) {
    for(const {mesh}of this.batches){this.scene.remove(mesh);mesh.dispose();}
    this.batches=[];
    const groups=new Map();
    for(const piece of pieces.values())piece.traverse(object=>{
      if(!object.isMesh)return;
      const color=piece.userData.piece.color,slot=object.userData.paletteSlot;
      const key=`${object.geometry.uuid}:${color}:${slot}`;
      if(!groups.has(key))groups.set(key,{geometry:object.geometry,color,slot,objects:[]});
      groups.get(key).objects.push({object,piece});
    });
    for(const {geometry,color,slot,objects}of groups.values()) {
      if(objects.length<2)continue;
      const mesh=new THREE.InstancedMesh(geometry,this.palettes[color][slot],objects.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.frustumCulled=false;this.scene.add(mesh);this.batches.push({mesh,objects});
    }
  }
  prepare() {
    this.scene.updateMatrixWorld(true);
    for(const {mesh,objects}of this.batches) {
      objects.forEach(({object,piece},i)=>{
        // Combat uses each warrior's own fracture material and detachable relics.
        let visible=!piece.userData.animated&&!piece.userData.surrendered;
        for(let parent=object;parent&&visible;parent=parent.parent)visible=parent.visible;
        mesh.setMatrixAt(i,visible?object.matrixWorld:this.zero);
        if(visible){this.hidden.push(object);object.visible=false;}
      });
      mesh.instanceMatrix.needsUpdate=true;
    }
  }
  restore(){for(const object of this.hidden)object.visible=true;this.hidden.length=0;}
}
