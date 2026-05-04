'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GraphData, GraphNode } from '@/lib/graph';

interface SimNode extends GraphNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mesh: THREE.Mesh;
}

const REPULSION = 8000;
const ATTRACTION = 0.03;
const DAMPING = 0.88;
const REST_LENGTH = 180;
const STAR_COUNT = 1500;

export default function UniverseGraph({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 5000);
    camera.position.set(0, 0, 600);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // ── Lights ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pointLight = new THREE.PointLight(0x8888ff, 2, 1000);
    pointLight.position.set(0, 0, 300);
    scene.add(pointLight);

    // ── Stars ──────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 4000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Nodes ──────────────────────────────────────────────
    const nodeGeo = new THREE.SphereGeometry(6, 16, 16);
    const simNodes: SimNode[] = data.nodes.map((n) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4466ff,
        emissive: 0x2233aa,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.5,
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      mesh.position.set(x, y, z);
      mesh.userData = { slug: n.id, title: n.title };
      scene.add(mesh);
      return { ...n, x, y, z, vx: 0, vy: 0, vz: 0, mesh };
    });

    const nodeMap = Object.fromEntries(simNodes.map((n) => [n.id, n]));

    // ── Edges ──────────────────────────────────────────────
    const edgeLineMat = new THREE.LineBasicMaterial({ color: 0x334488, transparent: true, opacity: 0.4 });
    const edgeLines: THREE.Line[] = data.edges.map((e) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geo, edgeLineMat);
      scene.add(line);
      return line;
    });

    // ── Force simulation ───────────────────────────────────
    function simulate() {
      // Repulsion
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i], b = simNodes[j];
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
          const f = REPULSION / (dist * dist);
          const fx = (dx / dist) * f, fy = (dy / dist) * f, fz = (dz / dist) * f;
          a.vx -= fx; a.vy -= fy; a.vz -= fz;
          b.vx += fx; b.vy += fy; b.vz += fz;
        }
      }
      // Attraction along edges
      data.edges.forEach((e) => {
        const a = nodeMap[e.source], b = nodeMap[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
        const f = ATTRACTION * (dist - REST_LENGTH);
        const fx = (dx / dist) * f, fy = (dy / dist) * f, fz = (dz / dist) * f;
        a.vx += fx; a.vy += fy; a.vz += fz;
        b.vx -= fx; b.vy -= fy; b.vz -= fz;
      });
      // Integrate
      simNodes.forEach((n) => {
        n.vx *= DAMPING; n.vy *= DAMPING; n.vz *= DAMPING;
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
        n.mesh.position.set(n.x, n.y, n.z);
      });
      // Update edge positions
      data.edges.forEach((e, i) => {
        const a = nodeMap[e.source], b = nodeMap[e.target];
        if (!a || !b) return;
        const pts = [new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z)];
        edgeLines[i].geometry.setFromPoints(pts);
      });
    }

    // ── Mouse interaction ──────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh: THREE.Mesh | null = null;

    function onMouseMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = simNodes.map((n) => n.mesh);
      const hits = raycaster.intersectObjects(meshes);

      if (hits.length > 0) {
        const mesh = hits[0].object as THREE.Mesh;
        if (mesh !== hoveredMesh) {
          if (hoveredMesh) (hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
          hoveredMesh = mesh;
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
          container.style.cursor = 'pointer';
        }
        // Tooltip
        const pos = mesh.position.clone().project(camera);
        setTooltip({
          title: mesh.userData.title,
          x: ((pos.x + 1) / 2) * container.clientWidth,
          y: ((-pos.y + 1) / 2) * container.clientHeight - 30,
        });
      } else {
        if (hoveredMesh) {
          (hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
          hoveredMesh = null;
        }
        container.style.cursor = 'default';
        setTooltip(null);
      }
    }

    function onClick() {
      if (hoveredMesh?.userData.slug) {
        router.push(`/posts/${hoveredMesh.userData.slug}`);
      }
    }

    // ── Orbit (simple drag rotate) ─────────────────────────
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    function onMouseDown(e: MouseEvent) { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; }
    function onMouseUp() { isDragging = false; }
    function onDrag(e: MouseEvent) {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      const spherical = new THREE.Spherical().setFromVector3(camera.position);
      spherical.theta -= dx * 0.005;
      spherical.phi -= dy * 0.005;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
      prevMouse = { x: e.clientX, y: e.clientY };
    }
    function onWheel(e: WheelEvent) {
      camera.position.multiplyScalar(1 + e.deltaY * 0.001);
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onDrag);
    container.addEventListener('wheel', onWheel, { passive: true });

    // ── Resize ─────────────────────────────────────────────
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // ── Animation loop ─────────────────────────────────────
    let frame: number;
    let tick = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      if (tick < 120) simulate(); // 초기 120프레임 동안 시뮬레이션 빠르게 수렴
      else if (tick % 2 === 0) simulate(); // 이후 절반 속도로 유지
      tick++;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onDrag);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [data, router]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 13,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(100,120,255,0.4)',
          }}
        >
          {tooltip.title}
        </div>
      )}
      <a
        href="/"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#aaa',
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        ← 목록으로
      </a>
    </div>
  );
}
