import * as THREE from 'three';

export class Effects {
  constructor(scene) { this.scene = scene; this.transients = []; this.muted = true; }

  sound(kind = 'step', type = 'P') {
    if (this.muted) return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      this.audio.resume();
      const t = this.audio.currentTime;
      const heavy = type === 'R' || type === 'K';
      const notes = kind === 'impact' ? [[heavy ? 48 : 75, .13, .45], [240, .04, .2]]
        : kind === 'magic' ? [[440, .035, .8], [660, .018, .9], [880, .012, 1]]
        : kind === 'shatter' ? [[1200, .025, .4], [1800, .015, .6], [90, .07, .45]]
        : [[heavy ? 90 : 135, .024, .12], [280, .009, .065]];
      for (const [frequency, volume, duration] of notes) {
        const oscillator = this.audio.createOscillator(), gain = this.audio.createGain();
        oscillator.type = kind === 'shatter' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, t);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * .55, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + duration);
        oscillator.connect(gain).connect(this.audio.destination);
        oscillator.start(t); oscillator.stop(t + duration);
      }
    } catch { /* Visual combat remains available without Web Audio. */ }
  }

  add(object, duration, update, dispose = () => {}) {
    this.scene.add(object);
    this.transients.push({ object, age: 0, duration, update, dispose });
  }

  sparks(point, color, count = 32, power = 1) {
    const positions = new Float32Array(count * 3), velocity = [];
    for (let i = 0; i < count; i++) {
      positions.set([point.x, point.y, point.z], i * 3);
      velocity.push(new THREE.Vector3((Math.random() - .5) * 2.6, Math.random() * 2, (Math.random() - .5) * 2.6).multiplyScalar(power));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size: .035, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    this.add(points, .85, (age, dt) => {
      const attribute = geometry.attributes.position;
      velocity.forEach((v, i) => {
        v.y -= dt * 3;
        attribute.setXYZ(i, attribute.getX(i) + v.x * dt, attribute.getY(i) + v.y * dt, attribute.getZ(i) + v.z * dt);
      });
      attribute.needsUpdate = true; material.opacity = 1 - age / .85;
    }, () => { geometry.dispose(); material.dispose(); });
  }

  ring(point, color, size = 1, duration = .55) {
    const geometry = new THREE.RingGeometry(.92, 1, 48);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const object = new THREE.Mesh(geometry, material);
    object.rotation.x = -Math.PI / 2; object.position.copy(point); object.position.y = .414;
    this.add(object, duration, age => { const t = age / duration; object.scale.setScalar(.05 + t * size); material.opacity = (1 - t) * .65; }, () => { geometry.dispose(); material.dispose(); });
  }

  trail(from, to, color, thick = .018) {
    if (from.distanceToSquared(to) < .0005) return;
    const geometry = new THREE.CylinderGeometry(thick * .5, thick, from.distanceTo(to), 5);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .65, blending: THREE.AdditiveBlending, depthWrite: false });
    const object = new THREE.Mesh(geometry, material);
    object.position.copy(from).add(to).multiplyScalar(.5);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    this.add(object, .19, age => { material.opacity = .65 * (1 - age / .19); }, () => { geometry.dispose(); material.dispose(); });
  }

  bolt(from, to, color) {
    const geometry = new THREE.IcosahedronGeometry(.07, 1);
    const material = new THREE.MeshBasicMaterial({ color });
    const object = new THREE.Mesh(geometry, material);
    object.position.copy(from);
    this.add(object, .17, age => {
      const previous = object.position.clone(); object.position.lerpVectors(from, to, age / .17);
      this.trail(previous, object.position, color, .045);
    }, () => { geometry.dispose(); material.dispose(); });
    this.sound('magic');
  }

  impact(point, color, type) {
    this.sparks(point, color, type === 'R' ? 50 : 28, type === 'R' ? 1.5 : 1);
    this.ring(point, color, type === 'R' ? 1.1 : .55);
    const light = new THREE.PointLight(color, 5, 3);
    light.position.copy(point);
    this.add(light, .22, age => { light.intensity = 5 * (1 - age / .22); });
    this.sound('impact', type);
  }

  shatter(piece, direction) {
    const p = piece.position.clone(), type = piece.userData.piece.type;
    const color = piece.userData.piece.color === 'white' ? 0xe1c79a : 0x67baa2;
    const count = type === 'N' ? 90 : type === 'R' ? 75 : 52;
    const spiritual = type === 'M' || type === 'F';
    this.detachRelics(piece, direction, spiritual);
    const geometry = new THREE.TetrahedronGeometry(1);
    const material = new THREE.MeshStandardMaterial({ color: piece.userData.palette.stone.color, roughness: .72, metalness: .3, transparent: true });
    const chunks = new THREE.InstancedMesh(geometry, material, count);
    chunks.castShadow = true; chunks.frustumCulled = false;
    const parts = [], dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(p.x + (Math.random() - .5) * .4, p.y + .12 + Math.random() * (type === 'N' ? 1.1 : .85), p.z + (Math.random() - .5) * .4);
      const velocity = new THREE.Vector3((Math.random() - .5) * 1.5, .4 + Math.random() * 1.3, (Math.random() - .5) * 1.5).addScaledVector(direction, .45);
      parts.push({ pos, velocity, spin: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5), scale: .025 + Math.random() * .065 });
      dummy.position.copy(pos); dummy.scale.setScalar(parts[i].scale); dummy.updateMatrix(); chunks.setMatrixAt(i, dummy.matrix);
    }
    this.add(chunks, 1.55, (age, dt) => {
      parts.forEach((part, i) => {
        part.velocity.y += dt * (spiritual ? .7 : -5.5); part.pos.addScaledVector(part.velocity, dt);
        if (spiritual) { part.velocity.x += Math.sin(age * 4 + i) * dt * .5; part.velocity.z += Math.cos(age * 4 + i) * dt * .5; }
        if (part.pos.y < .43) { part.pos.y = .43; part.velocity.y *= -.24; part.velocity.x *= .72; part.velocity.z *= .72; }
        dummy.position.copy(part.pos); dummy.rotation.set(part.spin.x * age, part.spin.y * age, part.spin.z * age);
        dummy.scale.setScalar(part.scale * Math.min(1, (1.55 - age) * 3)); dummy.updateMatrix(); chunks.setMatrixAt(i, dummy.matrix);
      });
      chunks.instanceMatrix.needsUpdate = true; material.opacity = Math.min(1, (1.55 - age) * 2);
    }, () => { geometry.dispose(); material.dispose(); });
    this.sparks(p.clone().add(new THREE.Vector3(0, .6, 0)), color, 65, .6);
    this.sound('shatter', type);
  }

  detachRelics(piece, direction, spiritual) {
    piece.updateMatrixWorld(true);
    const bones = piece.userData.bones;
    for (const [i, bone] of [bones.head, bones.weapon, bones.shield].filter(Boolean).entries()) {
      const fragment = new THREE.Group(), resources = [];
      bone.traverse(object => {
        if (!object.isMesh) return;
        const geometry = object.geometry.clone();
        const material = new THREE.MeshStandardMaterial({ color: object.material.color, metalness: .5, roughness: .5, transparent: true });
        const part = new THREE.Mesh(geometry, material);
        part.applyMatrix4(object.matrixWorld); fragment.add(part);
        resources.push({ geometry, material });
      });
      // Center geometry at the bone origin so a dropped crown spins around itself.
      const origin = bone.getWorldPosition(new THREE.Vector3());
      for (const part of fragment.children) part.position.sub(origin);
      fragment.position.copy(origin); bone.visible = false;
      const velocity = direction.clone().multiplyScalar(.3).add(new THREE.Vector3((i - 1) * .36, .4, .05));
      this.add(fragment, 1.3, (age, dt) => {
        velocity.y += dt * (spiritual ? .4 : -4.5);
        fragment.position.addScaledVector(velocity, dt);
        if (fragment.position.y < .46) { fragment.position.y = .46; velocity.y = 0; velocity.multiplyScalar(.88); }
        fragment.rotation.x += dt * (i + .7); fragment.rotation.z += dt * (i - .8);
        resources.forEach(({ material }) => { material.opacity = Math.min(1, (1.3 - age) * 2.5); });
      }, () => resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); }));
    }
  }

  update(dt) {
    // Spawning a trail from another effect is safe: process only this frame's batch.
    const batch = this.transients; this.transients = [];
    for (const effect of batch) {
      effect.age += dt;
      if (effect.age >= effect.duration) { this.scene.remove(effect.object); effect.dispose(); }
      else { effect.update(effect.age, dt); this.transients.push(effect); }
    }
  }

  clear() {
    for (const effect of this.transients) { this.scene.remove(effect.object); effect.dispose(); }
    this.transients = [];
  }
}
