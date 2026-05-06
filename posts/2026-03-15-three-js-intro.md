---
title: "Three.js로 3D 그래프 만들기"
date: 2026-03-15T01:33:00Z
category: 프론트엔드
tags: [프론트엔드]
excerpt: "이 블로그 universe 뷰 만들면서 처음 Three.js를 제대로 써봤다."
draft: false
---

이 블로그의 universe 페이지를 만들면서 Three.js를 처음 제대로 써봤다. 예전에 한 번 튜토리얼 따라한 적은 있었는데 그건 그냥 큐브 돌린 거라 뭔가 만든 느낌이 없었고.

## 기본 구조는 세 줄

```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
```

Scene에 물체 넣고, Camera로 보고, Renderer가 그린다. 이 세 개가 항상 같이 다닌다.

## 구 하나 만드는 법

```javascript
const geometry = new THREE.SphereGeometry(6, 24, 24);
const material = new THREE.MeshStandardMaterial({
  color: 0x3dd68c,
  emissive: 0x1a6040,
  emissiveIntensity: 0.9,
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
```

`emissive`가 스스로 빛나는 색이다. 이게 있으면 조명이 약해도 존재감이 생긴다. Universe 뷰에서 노드들이 그냥 공처럼 안 보이는 게 이것 때문이다.

## 별 파티클

```javascript
const positions = new Float32Array(1500 * 3);
for (let i = 0; i < positions.length; i++) {
  positions[i] = (Math.random() - 0.5) * 4000;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.9 })));
```

처음엔 `Geometry`로 만들었다가 deprecated인 거 알고 `BufferGeometry`로 바꿨다. 점 1500개 찍는데 생각보다 간단하다.

## 애니메이션

```javascript
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

`setInterval` 쓰면 안 된다. `requestAnimationFrame`이 브라우저 렌더링 타이밍에 맞춰서 호출해준다.

그리고 컴포넌트 언마운트할 때 `renderer.dispose()` 안 하면 메모리 누수가 난다. React에서 쓸 때 cleanup 꼭 챙겨야 한다.
