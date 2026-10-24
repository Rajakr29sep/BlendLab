import React,{ useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ProteinScene({ compact = false }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer;
    let raf = 0;
    let alive = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = compact ? 13.5 : 11.5;
    const group = new THREE.Group();
    scene.add(group);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      host.classList.add('scene-fallback');
      return () => host.classList.remove('scene-fallback');
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    const ambient = new THREE.AmbientLight(0xa9c7ff, 1.8);
    scene.add(ambient);
    const point = new THREE.PointLight(0x8aefce, 42, 35);
    point.position.set(3, 3, 7);
    scene.add(point);

    const atomGeometry = new THREE.IcosahedronGeometry(compact ? 0.07 : 0.09, 1);
    const atomMaterialA = new THREE.MeshStandardMaterial({ color: 0x7cebd0, metalness: 0.35, roughness: 0.25, emissive: 0x174b4b, emissiveIntensity: 0.45 });
    const atomMaterialB = new THREE.MeshStandardMaterial({ color: 0xa3baff, metalness: 0.3, roughness: 0.28, emissive: 0x243b79, emissiveIntensity: 0.45 });
    const atomCount = compact ? 42 : 78;
    const positions = [];
    const atoms = [];
    for (let i = 0; i < atomCount; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const v = Math.random() * 2 - 1;
      const radius = (compact ? 2.2 : 3.1) * Math.cbrt(Math.random());
      const phi = Math.acos(v);
      const position = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi) * 0.65,
      );
      const atom = new THREE.Mesh(atomGeometry, i % 4 === 0 ? atomMaterialB : atomMaterialA);
      atom.position.copy(position);
      atom.scale.setScalar(0.65 + Math.random() * 1.5);
      atom.userData = { phase: Math.random() * Math.PI * 2, base: position.clone(), drift: 0.12 + Math.random() * 0.2 };
      group.add(atom);
      atoms.push(atom);
      positions.push(position);
    }

    const edgePositions = [];
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        if (positions[i].distanceTo(positions[j]) < (compact ? 0.9 : 1.08)) {
          edgePositions.push(...positions[i].toArray(), ...positions[j].toArray());
        }
      }
    }
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
    const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0x5dc9b8, transparent: true, opacity: compact ? 0.24 : 0.33 }));
    group.add(edges);

    const ringGeometry = new THREE.TorusGeometry(compact ? 3.2 : 4.35, 0.006, 5, 160);
    const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: 0x6d8eff, transparent: true, opacity: 0.38 }));
    ring.rotation.set(0.85, 0.2, 0.4);
    group.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(compact ? 2.7 : 3.75, 0.004, 4, 160), new THREE.MeshBasicMaterial({ color: 0x7cebd0, transparent: true, opacity: 0.2 }));
    ring2.rotation.set(1.3, 0.8, 0.7);
    group.add(ring2);

    const resize = () => {
      if (!alive) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const clock = new THREE.Clock();
    const animate = () => {
      if (!alive) return;
      const t = clock.getElapsedTime();
      atoms.forEach((atom) => {
        atom.position.y = atom.userData.base.y + Math.sin(t * 0.7 + atom.userData.phase) * atom.userData.drift;
        atom.position.x = atom.userData.base.x + Math.cos(t * 0.43 + atom.userData.phase) * atom.userData.drift * 0.4;
      });
      group.rotation.y = Math.sin(t * 0.12) * 0.18 + t * 0.025;
      group.rotation.x = Math.cos(t * 0.15) * 0.08;
      ring.rotation.z += 0.0008;
      ring2.rotation.x -= 0.0005;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      atoms.forEach((atom) => atom.geometry.dispose());
      atomGeometry.dispose(); atomMaterialA.dispose(); atomMaterialB.dispose();
      edgeGeometry.dispose(); edges.material.dispose(); ringGeometry.dispose(); ring.material.dispose();
      ring2.geometry.dispose(); ring2.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [compact]);

  return <div aria-hidden="true" className={`protein-scene ${compact ? 'protein-scene--compact' : ''}`} ref={hostRef} />;
}
