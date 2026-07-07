---
name: push
description: Use this skill whenever the user wants to commit and push blog changes — typed as "/push", "푸시해줘", "올려줘", "publish", "발행", or any context where current changes (especially posts/*.md edits) need to reach origin/main. This blog's primary goal is external search and AI engine traffic, so pre-push SEO/AEO validation is critical and should never be skipped, even for what looks like a small edit. Always invoke before any blog-related git push, including title tweaks and typo fixes.
---

# /push — Blog publish workflow

This blog (Next.js, posts in `posts/*.md`, deployed via Vercel on push to `main`) optimizes for **external search traffic (Google) and AI engine indexing (Claude/GPT/Perplexity citation)**. Every push must pass SEO/AEO validation. The cost of a bad title or stale `llms.txt` reference is real: search ranking drops are slow to reverse.

## Workflow

When invoked:

1. **Detect changes** — `git status --porcelain` and `git diff --name-only`. If nothing staged or unstaged, stop and tell the user.
2. **Validate** — run block-level and warn-level checks against changed posts (see Validation below).
3. **Print report** — markdown format, one block per check group.
4. **Confirm with user** — if any blocks fail, stop. If only warns, ask the user to proceed/abort.
5. **Regenerate date manifest** — if any `posts/*.md` was added or modified, run `npm run gen-post-dates` and stage `lib/post-dates.json` into the post commit. This bakes each post's git first-commit(발행)·latest-commit(업데이트) time so Vercel (shallow clone, no full git history at build) shows accurate dates instead of falling back to frontmatter. Skip if no post files changed.
6. **Classify and commit** — group changed files by type, generate commit messages following repo style.
7. **Push** — `git push origin main`. Never use `--no-verify`. Never force push.

## Validation

### Block-level (stop if any fail)

For each changed `posts/*.md`:

- **Frontmatter required**: `title`, `date`, `category`, `tags`, `excerpt` all present and non-empty. Parse the YAML between `---` markers.
- **Draft → published transition**: if the file is changing `draft: true` → `draft: false` (or removing the field), this is a publish event. Confirm with the user explicitly: "정말 발행해? (slug)" before continuing.

### Warn-level SEO (proceed after confirm)

For each changed `posts/*.md`:

- **`title` length**: 50–70 characters. Korean characters count as 1. Search SERP truncates around 60-65 — outside this range hurts CTR.
- **`excerpt` length**: 120–160 characters. This becomes the meta description; Google often shows it under the title. Too short = under-described, too long = truncated.
- **`slug`** (filename minus `.md` and `YYYY-MM-DD-` prefix): English letters/digits/hyphens, ≤60 characters. Korean slugs hurt URL readability and some crawlers.
- **External links**: extract `https?://...` URLs from body. Run a HEAD request on each. Warn on 4xx/5xx. Skip this check if the user passed `--no-link-check` or if there are >20 links (probably noise).
- **Internal `/posts/<slug>` links**: if a slug doesn't match any file in `posts/`, warn — broken internal link.
- **Image `alt`**: scan for `![](...)` (empty alt). Warn on each — image search and screen readers both rely on alt.

### Warn-level AEO (proceed after confirm)

- **`/llms.txt` freshness**: read `app/llms.txt/route.ts` (and `app/llms-full.txt/route.ts`). If they iterate `getAllPosts()` dynamically, no action needed (new published posts auto-included). If they hard-list posts, check the changed/new post is in the list.
- **`BlogPosting` JSON-LD**: `app/posts/[slug]/page.tsx` already injects `@type`, `headline`, `datePublished`, `author`, `description`, `keywords`, `url`, `publisher`. If a change touches that file, verify these fields still exist.
- **First paragraph vs excerpt**: extract the first body paragraph (after frontmatter, skipping blank lines). If it's a 1:1 match with `excerpt`, warn — LLMs that quote the page get duplicated content, lowering citation value. Recommend rephrasing the first paragraph to add new info.

### Optional checks (only if user requests or in autonomous loop mode)

- **Local render check**: if dev server is running on :3000 (`lsof -i :3000`), `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/posts/<slug>` to confirm 200. Useful for catching template errors before push.

## Commit classification

Group changed files into commit-shaped buckets:

| File pattern | Prefix | Notes |
|---|---|---|
| `posts/*.md` | `post:` | Single post → use the title or "발행" / "수정" in subject. Multiple posts → comma-list. |
| `app/`, `components/`, `lib/` | `fix:` / `refactor:` / `feat:` / `style:` | Infer from change shape. New file or new functionality → `feat:`. Tightening or restructuring → `refactor:`. Bug-shaped (small, "stop X happening") → `fix:`. CSS-only or visual tweak → `style:`. |
| `public/`, root config files | `chore:` | |

**If the change crosses categories** (e.g., a new feature in `app/` plus a post that demonstrates it), make 2 separate commits in logical order — usually code first, then post. The user has confirmed in past pushes that splitting is preferred (see commit `b64b577` + `5616d81` for a precedent: a SeriesBox guard fix landed separately from the post that exposed it).

For the commit subject, mimic recent style — run `git log --oneline -10` to see. Subject ≤72 chars, lowercase prefix, Korean body OK.

Do NOT add an assistant/AI co-author trailer (e.g. `Co-Authored-By: <assistant> <noreply@...>`), and do NOT reference the AI assistant by name anywhere in the commit subject or body. The user does not want the AI assistant appearing in repo history at all. Preserve genuine human/bot co-authors (e.g. Vercel bot) if already present.

Use HEREDOC with `git commit -m "$(cat <<'EOF' ... EOF)"` to preserve newlines.

## Report format

Print this before asking for confirm:

```
## /push report

**Changed files:**
- posts/<slug>.md
- app/<path>.tsx

### Block ✓ / ✗
- frontmatter (<slug>): ✓ all required fields present
- draft transition: <none | "발행 예정" with confirm>

### SEO
- title (<n> chars, <slug>): ✓ / ⚠ <reason>
- excerpt (<n> chars, <slug>): ✓ / ⚠ <reason>
- slug (<n> chars): ✓ / ⚠ <reason>
- external links (<m>/<total>): ✓ / ⚠ <list of dead URLs>
- internal /posts links: ✓ / ⚠ <list>
- image alt: ✓ / ⚠ <count> 빈 alt

### AEO
- llms.txt freshness: ✓ auto-enumerated / ⚠ <slug> 미포함
- BlogPosting JSON-LD: ✓ / ⚠ <missing fields>
- first paragraph ≠ excerpt: ✓ / ⚠ <slug>

### Commit plan
1. `<prefix>: <subject>` (<files>)
2. `<prefix>: <subject>` (<files>)
```

Then: "이대로 진행할까? (블록 0개, 경고 N개)"

## Reasoning (why this skill exists)

The blog's value is search/AI-engine discovery. Most posts will get more views from organic search than from direct visits. That means:

- A bad title is worse than a typo in the body — title is what Google shows in SERP.
- A missing `excerpt` means Google auto-generates from page content, often picking the wrong sentence.
- A stale `llms.txt` means Claude/GPT can't cite the post when users ask related questions.
- An identical first-paragraph and excerpt means LLMs cite the same sentence twice — dilutes the post's unique signal.

The validation isn't bureaucracy — each check maps to a concrete way the post could underperform. Surface the issues, let the user decide. Don't auto-fix without consent — the author's voice matters more than rigid character limits.

## Anti-patterns (don't do this)

- **Don't auto-edit posts** to fix excerpt length etc. Surface, don't mutate. The author's wording is intentional.
- **Don't skip validation** because "it's just a typo". The skill exists *because* small edits are where SEO regressions sneak in.
- **Don't bundle SEO + AEO + commit + push into one giant commit message**. Use the commit classifier — separation aids future `git log` review.
- **Don't push to remote if any block fails or user declines confirm.** Never `--no-verify`. Never force push.
- **Don't warn on Korean characters in title/body**. Title length check uses character count (Korean chars = 1), not bytes. The blog is a Korean tech blog.
