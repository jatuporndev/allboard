import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// All relief, armor, faces and blades are modeled here from mathematical shapes.
export function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function joint(parent, x = 0, y = 0, z = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

export function ellipsoid(parent, material, position, scale) {
  const object = mesh(new THREE.SphereGeometry(1, 14, 10), material, parent, ...position);
  object.scale.set(...scale);
  return object;
}

export function cylinder(parent, material, top, bottom, height, position, sides = 12) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material, parent, ...position);
}

export function tube(parent, material, points, radius = .014) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, Math.max(8, points.length * 4), radius, 5, false), material, parent);
}

export function relief(parent, material, points, depth, position = [0, 0, 0]) {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach(point => shape.lineTo(...point));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: .007, bevelSize: .007, bevelSegments: 1, steps: 1,
  });
  return mesh(geometry, material, parent, ...position);
}

// A curling kanok-inspired flame, used for crowns, shoulder wings and weapon guards.
export function flame(parent, material, x, y, z, size = 1, flip = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-.1, .07, -.1, .15, -.025, .22);
  shape.bezierCurveTo(.025, .28, .02, .36, -.015, .42);
  shape.bezierCurveTo(.17, .29, .14, .15, .045, .13);
  shape.bezierCurveTo(.11, .055, .065, .015, 0, 0);
  const object = mesh(new THREE.ExtrudeGeometry(shape, {
    depth: .026, bevelEnabled: true, bevelThickness: .007, bevelSize: .005, bevelSegments: 1, curveSegments: 8,
  }), material, parent, x, y, z);
  object.scale.set(size * flip, size, size);
  return object;
}

export function ring(parent, material, radius, thickness, position, vertical = false) {
  const object = mesh(new THREE.TorusGeometry(radius, thickness, 5, 24), material, parent, ...position);
  if (!vertical) object.rotation.x = Math.PI / 2;
  return object;
}

// Merge the static detail on each bone. Articulated child groups stay independent.
// Hundreds of sculptural components become only a few material batches per bone.
export function bakeRigidParts(group, articulated = new Set()) {
  for (const child of [...group.children]) if (child.isGroup) {
    bakeRigidParts(child, articulated);
    if (!articulated.has(child)) {
      child.updateMatrix();
      for (const detail of [...child.children]) {
        detail.applyMatrix4(child.matrix);
        group.add(detail);
      }
      group.remove(child);
    }
  }
  const batches = new Map();
  for (const child of [...group.children]) {
    if (!child.isMesh) continue;
    child.updateMatrix();
    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    geometry.applyMatrix4(child.matrix);
    if (!batches.has(child.material)) batches.set(child.material, []);
    batches.get(child.material).push(geometry);
    child.geometry.dispose();
    group.remove(child);
  }
  for (const [material, geometries] of batches) {
    const combined = mergeGeometries(geometries, false);
    mesh(combined, material, group);
    geometries.forEach(g => g.dispose());
  }
}

export function makePalette(color) {
  const white = color === 'white';
  const uniforms = { fracture: { value: 0 }, dissolve: { value: 0 } };
  function stone(hex, metalness, roughness) {
    const material = new THREE.MeshStandardMaterial({ color: hex, metalness, roughness });
    material.onBeforeCompile = shader => {
      shader.uniforms.uFracture = uniforms.fracture;
      shader.uniforms.uDissolve = uniforms.dissolve;
      shader.vertexShader = 'varying vec3 vSculpturePosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvSculpturePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = `varying vec3 vSculpturePosition;
uniform float uFracture;
uniform float uDissolve;
float stoneHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec3 stoneP = vSculpturePosition * 15.0;
float grain = stoneHash(floor(stoneP * 19.0));
diffuseColor.rgb *= 0.92 + grain * 0.12;
if (uDissolve > stoneHash(floor(stoneP * 2.0)) && uDissolve > 0.0) discard;
`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
vec3 seams = abs(fract(stoneP + sin(stoneP.yzx * 1.8) * 0.16) - 0.5);
float crack = 1.0 - smoothstep(0.012, 0.045, min(seams.x, min(seams.y, seams.z)));
totalEmissiveRadiance += vec3(${white ? '1.0, 0.52, 0.12' : '0.12, 0.95, 0.74'}) * crack * uFracture * 3.0;
`);
    };
    material.customProgramCacheKey = () => `sculpted-stone-${color}`;
    return material;
  }
  const palette = {
    stone: stone(white ? 0xc9bfa4 : 0x30534e, .32, .56),
    armor: stone(white ? 0xada282 : 0x223832, .62, .4),
    gold: stone(white ? 0xb98b42 : 0x7c9a80, .78, .34),
    cloth: stone(white ? 0x50695b : 0x162722, .18, .85),
    blade: stone(white ? 0xe2d7b5 : 0x8ba995, .83, .27),
    glow: new THREE.MeshStandardMaterial({ color: white ? 0xffd383 : 0x72dec0, emissive: white ? 0xf9b747 : 0x30c79f, emissiveIntensity: 1.3, roughness: .3 }),
    uniforms,
  };
  return palette;
}
