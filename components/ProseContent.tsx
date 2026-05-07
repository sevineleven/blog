'use client';

import { useEffect, useRef } from 'react';

const LANG_CMD: Record<string, string> = {
  typescript: 'vim',
  tsx:        'vim',
  javascript: 'node',
  jsx:        'node',
  bash:       'zsh',
  shell:      'zsh',
  sh:         'zsh',
  css:        'vim',
  html:       'vim',
  json:       'cat',
  sql:        'psql',
  python:     'python3',
  java:       'javac',
  go:         'go run',
  rust:       'cargo run',
  yaml:       'cat',
  toml:       'cat',
};

export default function ProseContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.pre-header')) return;

      const code = pre.querySelector('code');
      const lang = code?.getAttribute('data-language') ?? '';
      const cmd = lang ? (LANG_CMD[lang] ?? 'cat') : null;

      const header = document.createElement('div');
      header.className = 'pre-header';

      const dots = document.createElement('span');
      dots.style.cssText = 'display:flex;gap:6px;align-items:center;flex-shrink:0;';
      ['#ff5f57', '#febc2e', '#28c840'].forEach((color) => {
        const dot = document.createElement('span');
        dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};display:block;flex-shrink:0;`;
        dots.appendChild(dot);
      });
      header.appendChild(dots);

      if (cmd && lang) {
        const label = document.createElement('span');
        label.className = 'lang-label';
        label.innerHTML = `<span class="lang-cmd">$ ${cmd}</span> <span class="lang-name">${lang}</span>`;
        header.appendChild(label);
      }

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'copy';
      btn.onclick = async () => {
        const text = code?.innerText ?? '';
        await navigator.clipboard.writeText(text);
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'copy';
          btn.classList.remove('copied');
        }, 2000);
      };
      header.appendChild(btn);

      pre.insertBefore(header, pre.firstChild);
    });
  }, [html]);

  return <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
