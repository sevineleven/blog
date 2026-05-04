# sevin.dev 블로그

Markdown 파일을 Git에 올리면 자동으로 블로그 포스팅이 되는 개인 기술 블로그.

📄 **[설계 문서 보기](docs/design.md)**

---

## 시작하기

```bash
npm install
npm run dev
```

## 새 포스트 작성

```bash
npm run new-post "포스트 제목"
```

`posts/` 폴더에 frontmatter가 채워진 MD 파일이 생성됩니다.  
작성 완료 후 `draft: false`로 변경하고 push하면 자동 발행됩니다.

## 기술 스택

- **Next.js 15** — App Router
- **Three.js** — 우주 그래프 뷰
- **Tailwind CSS** — 스타일링
- **Vercel** — 배포
