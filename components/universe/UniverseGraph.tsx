'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GraphData, GraphNode } from '@/lib/graph';

interface SimNode extends GraphNode {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  mesh: THREE.Sprite;
  baseScale: number;
  phase: number;   // 반짝임 위상 오프셋
  speed: number;   // 반짝임 속도
}

// 별 크기 (world unit)
const STAR_SCALE = { category: 60, tag: 28, post: 13 } as const;

// 성운 색상 — 카테고리 순서대로
const NEBULA_RGB: [number, number, number][] = [
  [90, 172, 240],   // 파랑
  [61, 214, 140],   // 초록
  [179, 136, 255],  // 보라
  [245, 197, 66],   // 노랑
];

// Force
const REPULSION = { category: 50000, tag: 12000, post: 2500 } as const;
const REST_LEN  = { 'category-tag': 240, 'tag-post': 130 } as const;
const ATTRACTION = 0.035;
const DAMPING    = 0.84;
const GRAVITY    = 0.0015;
const CAM_MIN = 200, CAM_MAX = 1800;

// ── 별 텍스처: 중심 흰빛 → 색상 glowing → 투명, + 십자 스파이크 ──
function makeStarTex(r: number, g: number, b: number, spikes: boolean): THREE.Texture {
  const S = 128, cx = S / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0,    'rgba(255,255,255,1)');
  grad.addColorStop(0.06, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.55)`);
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  if (spikes) {
    // 4방향 회절 스파이크
    [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4].forEach((angle) => {
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate(angle);
      const sg = ctx.createLinearGradient(0, -cx * 0.9, 0, cx * 0.9);
      sg.addColorStop(0,    'rgba(255,255,255,0)');
      sg.addColorStop(0.42, 'rgba(255,255,255,0.35)');
      sg.addColorStop(0.5,  'rgba(255,255,255,0.85)');
      sg.addColorStop(0.58, 'rgba(255,255,255,0.35)');
      sg.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(-1, -cx * 0.9, 2, cx * 1.8);
      ctx.restore();
    });
  }
  return new THREE.CanvasTexture(canvas);
}

// ── 성운 텍스처: 부드러운 방사형 안개 ──
function makeNebulaTex(r: number, g: number, b: number): THREE.Texture {
  const S = 256, cx = S / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0,   `rgba(${r},${g},${b},0.28)`);
  grad.addColorStop(0.35,`rgba(${r},${g},${b},0.1)`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},0.03)`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(canvas);
}

export default function UniverseGraph({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);
  const selectedRef = useRef<string | null>(null);    // 선택된 태그/카테고리 id
  const highlightRef = useRef<Set<string>>(new Set()); // 강조할 포스트 id

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 6000);
    camera.position.set(0, 0, 820);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // ── 배경 별 파티클 ───────────────────────────────────────
    const bgPos = new Float32Array(2200 * 3);
    for (let i = 0; i < bgPos.length; i++) bgPos[i] = (Math.random() - 0.5) * 5500;
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.65, sizeAttenuation: true,
      transparent: true, opacity: 0.55,
    })));

    // ── 별 텍스처 캐시 ───────────────────────────────────────
    const TEX = {
      category: makeStarTex(61, 214, 140, true),  // 초록, 스파이크 있음
      tag:      makeStarTex(90, 172, 240, false),  // 파랑
      post:     makeStarTex(245, 197, 66, false),  // 노랑
    };

    // ── 노드 스프라이트 ──────────────────────────────────────
    const simNodes: SimNode[] = data.nodes.map((n) => {
      const mat = new THREE.SpriteMaterial({
        map: TEX[n.type],
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const spread = n.type === 'category' ? 700 : n.type === 'tag' ? 450 : 260;
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread;
      sprite.position.set(x, y, z);
      sprite.scale.setScalar(STAR_SCALE[n.type]);
      sprite.userData = { id: n.id, title: n.title, type: n.type };
      scene.add(sprite);
      return {
        ...n, x, y, z, vx: 0, vy: 0, vz: 0,
        mesh: sprite,
        baseScale: STAR_SCALE[n.type],
        phase: Math.random() * Math.PI * 2,
        speed: 0.018 + Math.random() * 0.028,
      };
    });

    const nodeMap = Object.fromEntries(simNodes.map((n) => [n.id, n]));

    // ── 카테고리별 성운 ──────────────────────────────────────
    const nebulaItems: { sprite: THREE.Sprite; nodeId: string }[] = [];
    simNodes
      .filter((n) => n.type === 'category')
      .forEach((n, i) => {
        const [r, g, b] = NEBULA_RGB[i % NEBULA_RGB.length];
        const mat = new THREE.SpriteMaterial({
          map: makeNebulaTex(r, g, b),
          transparent: true,
          opacity: 0.13,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const spr = new THREE.Sprite(mat);
        spr.scale.setScalar(360);
        spr.position.set(n.x, n.y, n.z);
        scene.add(spr);
        nebulaItems.push({ sprite: spr, nodeId: n.id });
      });

    // ── 엣지 ────────────────────────────────────────────────
    const edgeColors = { 'category-tag': 0x1e4433, 'tag-post': 0x14203a } as const;
    const edgeLines = data.edges.map((e) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const mat = new THREE.LineBasicMaterial({
        color: edgeColors[e.type], transparent: true,
        opacity: e.type === 'category-tag' ? 0.55 : 0.28,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return line;
    });

    // ── Force simulation ─────────────────────────────────────
    function simulate() {
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i], b = simNodes[j];
          const rep = Math.max(REPULSION[a.type], REPULSION[b.type]);
          const dx = b.x-a.x, dy = b.y-a.y, dz = b.z-a.z;
          const dist = Math.sqrt(dx*dx+dy*dy+dz*dz) + 0.1;
          const f = rep / (dist * dist);
          const nx = dx/dist, ny = dy/dist, nz = dz/dist;
          a.vx -= nx*f; a.vy -= ny*f; a.vz -= nz*f;
          b.vx += nx*f; b.vy += ny*f; b.vz += nz*f;
        }
      }
      data.edges.forEach((e) => {
        const a = nodeMap[e.source], b = nodeMap[e.target];
        if (!a || !b) return;
        const rest = REST_LEN[e.type];
        const dx = b.x-a.x, dy = b.y-a.y, dz = b.z-a.z;
        const dist = Math.sqrt(dx*dx+dy*dy+dz*dz) + 0.1;
        const f = ATTRACTION * (dist - rest);
        const nx = dx/dist, ny = dy/dist, nz = dz/dist;
        a.vx += nx*f; a.vy += ny*f; a.vz += nz*f;
        b.vx -= nx*f; b.vy -= ny*f; b.vz -= nz*f;
      });
      simNodes.forEach((n) => {
        n.vx -= n.x*GRAVITY; n.vy -= n.y*GRAVITY; n.vz -= n.z*GRAVITY;
        n.vx *= DAMPING; n.vy *= DAMPING; n.vz *= DAMPING;
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
        n.mesh.position.set(n.x, n.y, n.z);
      });
      data.edges.forEach((e, i) => {
        const a = nodeMap[e.source], b = nodeMap[e.target];
        if (!a || !b) return;
        edgeLines[i].geometry.setFromPoints([
          new THREE.Vector3(a.x, a.y, a.z),
          new THREE.Vector3(b.x, b.y, b.z),
        ]);
      });
    }

    // ── Raycasting ───────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredNode: SimNode | null = null;

    function onMouseMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(simNodes.map((n) => n.mesh));
      if (hits.length > 0) {
        const sprite = hits[0].object as THREE.Sprite;
        const node = simNodes.find((n) => n.mesh === sprite) ?? null;
        if (node !== hoveredNode) {
          hoveredNode = node;
          if (container) container.style.cursor = (node?.type === 'post' || node?.type === 'tag' || node?.type === 'category') ? 'pointer' : 'default';
        }
        if (node?.type === 'post') {
          const pos = sprite.position.clone().project(camera);
          setTooltip({
            title: node.title,
            x: ((pos.x + 1) / 2) * container!.clientWidth,
            y: ((-pos.y + 1) / 2) * container!.clientHeight - 32,
          });
        } else { setTooltip(null); }
      } else {
        hoveredNode = null;
        if (container) container.style.cursor = 'default';
        setTooltip(null);
      }
    }

    function onClick() {
      const target = clickTarget;
      if (!target) {
        // 빈 공간 클릭 → 선택 해제
        selectedRef.current = null;
        highlightRef.current = new Set();
        return;
      }
      if (target.type === 'post') {
        router.push(`/posts/${target.id}`);
        return;
      }
      // 태그 또는 카테고리 클릭
      if (selectedRef.current === target.id) {
        // 같은 노드 다시 클릭 → 해제
        selectedRef.current = null;
        highlightRef.current = new Set();
      } else {
        selectedRef.current = target.id;
        const highlighted = new Set<string>();
        if (target.type === 'tag') {
          data.edges.filter((e) => e.source === target.id && e.type === 'tag-post')
            .forEach((e) => highlighted.add(e.target));
        } else if (target.type === 'category') {
          const childTags = data.edges
            .filter((e) => e.source === target.id && e.type === 'category-tag')
            .map((e) => e.target);
          data.edges
            .filter((e) => childTags.includes(e.source) && e.type === 'tag-post')
            .forEach((e) => highlighted.add(e.target));
        }
        highlightRef.current = highlighted;
      }
      if (container) container.style.cursor = 'default';
    }

    // ── 드래그 회전 ──────────────────────────────────────────
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    let dragDist = 0;
    let clickTarget: SimNode | null = null; // mousedown 시점의 hoveredNode
    function onMouseDown(e: MouseEvent) {
      isDragging = true;
      dragDist = 0;
      clickTarget = hoveredNode;
      prevMouse = { x: e.clientX, y: e.clientY };
    }
    function onMouseUp() { isDragging = false; }
    function onDrag(e: MouseEvent) {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x, dy = e.clientY - prevMouse.y;
      dragDist += Math.sqrt(dx * dx + dy * dy);
      if (dragDist < 4) return; // 4px 미만 이동은 드래그로 처리 안 함
      const sph = new THREE.Spherical().setFromVector3(camera.position);
      sph.theta -= dx * 0.005;
      sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - dy * 0.005));
      camera.position.setFromSpherical(sph);
      camera.lookAt(0, 0, 0);
      prevMouse = { x: e.clientX, y: e.clientY };
    }
    function onWheel(e: WheelEvent) {
      camera.position.multiplyScalar(1 + e.deltaY * 0.001);
      const d = camera.position.length();
      if (d < CAM_MIN) camera.position.setLength(CAM_MIN);
      if (d > CAM_MAX) camera.position.setLength(CAM_MAX);
    }
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') router.push('/'); }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onDrag);
    container.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // ── Animation ────────────────────────────────────────────
    const labelNodes = simNodes;
    let frame: number, tick = 0;

    function animate() {
      frame = requestAnimationFrame(animate);
      if (tick < 160 || tick % 2 === 0) simulate();
      tick++;

      // 반짝임 — 각 별마다 랜덤 위상/속도
      const hasSelection = selectedRef.current !== null;
      simNodes.forEach((n) => {
        const t = tick * n.speed + n.phase;
        const twinkle = 0.6 + 0.4 * Math.sin(t);
        const isHighlighted = n.type === 'post' && highlightRef.current.has(n.id);
        const isDimmed = hasSelection && n.type === 'post' && !isHighlighted;

        (n.mesh.material as THREE.SpriteMaterial).opacity = isDimmed ? twinkle * 0.2 : twinkle;

        if (n.type !== 'post') {
          n.mesh.scale.setScalar(n.baseScale * (0.88 + 0.12 * Math.sin(t * 0.8)));
        } else if (isHighlighted) {
          // 강조된 포스트는 크게 + 맥동
          n.mesh.scale.setScalar(n.baseScale * 3 * (0.9 + 0.1 * Math.sin(t * 1.2)));
        } else {
          n.mesh.scale.setScalar(n.baseScale);
        }
      });

      // 성운은 카테고리 위치 따라이동
      nebulaItems.forEach(({ sprite, nodeId }) => {
        const n = nodeMap[nodeId];
        if (n) sprite.position.set(n.x, n.y, n.z);
      });

      // 라벨: 줌 거리별 페이드
      const camDist = camera.position.length();
      labelNodes.forEach((n) => {
        const el = document.getElementById(`ulbl-${n.id}`);
        if (!el) return;
        const threshold = n.type === 'category' ? 1400 : n.type === 'tag' ? 1100 : 480;
        const fade = n.type === 'category' ? 200 : n.type === 'tag' ? 150 : 100;
        const vis = Math.max(0, Math.min(1, (threshold - camDist) / fade));
        const pos = n.mesh.position.clone().project(camera);
        if (pos.z >= 1 || tick < 40 || vis <= 0) { el.style.opacity = '0'; return; }
        el.style.opacity = String(vis);
        el.style.left = `${((pos.x + 1) / 2) * container!.clientWidth}px`;
        el.style.top = `${((-pos.y + 1) / 2) * container!.clientHeight + (n.type === 'category' ? 20 : 12)}px`;
      });

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [data, router]);

  const labelNodes = data.nodes;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* 카테고리·태그 상시 라벨 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {labelNodes.map((n) => (
          <span
            key={n.id}
            id={`ulbl-${n.id}`}
            style={{
              position: 'absolute',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--round)',
              fontSize: n.type === 'category' ? 14 : n.type === 'tag' ? 12 : 11,
              fontWeight: 400,
              color: n.type === 'category' ? 'var(--green)' : n.type === 'tag' ? 'var(--blue)' : 'var(--yellow)',
              opacity: 0,
              whiteSpace: 'nowrap',
              textShadow: '0 0 12px rgba(0,0,0,1)',
              letterSpacing: n.type === 'category' ? '0.05em' : '0',
              transition: 'opacity 0.5s',
              pointerEvents: 'none',
            }}
          >
            {n.title}
          </span>
        ))}
      </div>

      {/* 포스트 hover 툴팁 */}
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          transform: 'translateX(-50%)',
          background: 'rgba(8,8,16,0.92)',
          color: 'var(--text)', padding: '5px 12px', borderRadius: 6,
          fontFamily: 'var(--mono)', fontSize: 12, pointerEvents: 'none',
          whiteSpace: 'nowrap', border: '1px solid rgba(245,197,66,0.45)',
          backdropFilter: 'blur(8px)',
        }}>
          {tooltip.title}
        </div>
      )}

      {/* 범례 */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {([
          { color: 'var(--green)', label: 'category' },
          { color: 'var(--blue)',  label: 'tag'      },
          { color: 'var(--yellow)', label: 'post'     },
        ] as const).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
