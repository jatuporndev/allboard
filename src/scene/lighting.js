import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Generate reflection lighting locally; no downloaded HDR or model assets.
export function studioReflections(renderer, scene) {
  const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, .06);
  scene.environment = target.texture;
  scene.environmentIntensity = .32;
  room.dispose(); generator.dispose();
  return target;
}
