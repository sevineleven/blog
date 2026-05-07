---
title: "블로그 개발기 - Obsidian처럼, universe 뷰 만들기"
date: 2026-05-05T01:33:00Z
category: 일상
tags: [블로그, 프론트엔드]
excerpt: "Obsidian graph view 보고 이걸 블로그에 넣고 싶었다. Three.js로 포스트들을 3D 공간에 띄운 과정."
draft: false
series: "블로그 개발기"
---

Obsidian의 graph view를 처음 봤을 때부터 이걸 블로그에 넣고 싶었다. 포스트들이 태그로 연결되는 걸 3D로 시각화하면 재밌겠다 싶어서. 근데 2D로 하기엔 아쉬워서 Three.js로 3D로 만들어봤다. 그렇게 만든 게 이 블로그의 universe 페이지다.

Three.js를 여기서 처음 제대로 써봤다. 예전에 한 번 튜토리얼 따라한 적은 있었는데 그건 그냥 큐브 돌린 거라 뭔가 만든 느낌이 없었고.

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
