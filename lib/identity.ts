const ADJECTIVES = [
  '용감한', '느긋한', '귀여운', '엉뚱한', '수줍은',
  '씩씩한', '졸린', '배고픈', '신나는', '조용한',
  '재빠른', '덩치큰', '작은', '똑똑한', '게으른',
  '활발한', '진지한', '웃긴', '멋진', '따뜻한',
];

const ANIMALS: { name: string; emoji: string }[] = [
  { name: '사자',     emoji: '🦁' },
  { name: '하마',     emoji: '🦛' },
  { name: '펭귄',     emoji: '🐧' },
  { name: '판다',     emoji: '🐼' },
  { name: '여우',     emoji: '🦊' },
  { name: '고양이',   emoji: '🐱' },
  { name: '강아지',   emoji: '🐶' },
  { name: '토끼',     emoji: '🐰' },
  { name: '곰',       emoji: '🐻' },
  { name: '호랑이',   emoji: '🐯' },
  { name: '코끼리',   emoji: '🐘' },
  { name: '기린',     emoji: '🦒' },
  { name: '원숭이',   emoji: '🐵' },
  { name: '오리',     emoji: '🦆' },
  { name: '부엉이',   emoji: '🦉' },
  { name: '고슴도치', emoji: '🦔' },
  { name: '악어',     emoji: '🐊' },
  { name: '카멜레온', emoji: '🦎' },
  { name: '문어',     emoji: '🐙' },
  { name: '고래',     emoji: '🐋' },
  { name: '돌고래',   emoji: '🐬' },
  { name: '상어',     emoji: '🦈' },
  { name: '플라밍고', emoji: '🦩' },
  { name: '공작',     emoji: '🦚' },
  { name: '두루미',   emoji: '🦢' },
  { name: '낙타',     emoji: '🐪' },
  { name: '늑대',     emoji: '🐺' },
  { name: '수달',     emoji: '🦦' },
  { name: '너구리',   emoji: '🦝' },
  { name: '코알라',   emoji: '🐨' },
  { name: '캥거루',   emoji: '🦘' },
  { name: '얼룩말',   emoji: '🦓' },
  { name: '코뿔소',   emoji: '🦏' },
  { name: '고릴라',   emoji: '🦍' },
  { name: '침팬지',   emoji: '🐒' },
  { name: '사슴',     emoji: '🦌' },
  { name: '양',       emoji: '🐑' },
  { name: '염소',     emoji: '🐐' },
  { name: '돼지',     emoji: '🐷' },
  { name: '소',       emoji: '🐮' },
  { name: '닭',       emoji: '🐔' },
  { name: '병아리',   emoji: '🐤' },
  { name: '올빼미',   emoji: '🦜' },
  { name: '독수리',   emoji: '🦅' },
  { name: '앵무새',   emoji: '🦜' },
  { name: '백조',     emoji: '🦢' },
  { name: '참새',     emoji: '🐦' },
  { name: '개구리',   emoji: '🐸' },
  { name: '뱀',       emoji: '🐍' },
  { name: '거북이',   emoji: '🐢' },
  { name: '게',       emoji: '🦀' },
  { name: '새우',     emoji: '🦐' },
  { name: '가재',     emoji: '🦞' },
  { name: '오징어',   emoji: '🦑' },
  { name: '해마',     emoji: '🐠' },
  { name: '복어',     emoji: '🐡' },
  { name: '나비',     emoji: '🦋' },
  { name: '무당벌레', emoji: '🐞' },
  { name: '꿀벌',     emoji: '🐝' },
  { name: '달팽이',   emoji: '🐌' },
  { name: '햄스터',   emoji: '🐹' },
  { name: '다람쥐',   emoji: '🐿️' },
  { name: '박쥐',     emoji: '🦇' },
  { name: '스컹크',   emoji: '🦨' },
  { name: '라마',     emoji: '🦙' },
  { name: '알파카',   emoji: '🦙' },
  { name: '공룡',     emoji: '🦕' },
  { name: '드래곤',   emoji: '🐲' },
  { name: '유니콘',   emoji: '🦄' },
];

export interface Identity {
  label: string;
  emoji: string;
  author: string;
}

export function emojiForAuthor(author: string): string {
  const match = ANIMALS.find((a) => author.includes(a.name));
  return match ? match.emoji : '👤';
}

function generate(): Identity {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return {
    label: `${adj} ${animal.name}`,
    emoji: animal.emoji,
    author: `${adj} ${animal.name}`,
  };
}

const KEY = 'blog_identity';

export function getIdentity(): Identity {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Identity;
  } catch {}
  const identity = generate();
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {}
  return identity;
}
