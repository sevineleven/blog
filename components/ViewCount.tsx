// 글 헤더 메타 줄의 조회수 표시. 값은 서버(ISR)에서 받아 첫 HTML 에 박히므로
// 클라 fetch 가 없다 → "조회 —" 깜빡임도, 추가 요청도 없다. 집계는 ViewTracker(POST) 담당.
export default function ViewCount({ count }: { count: number }) {
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
      {' · 조회 '}
      {count.toLocaleString()}
    </span>
  );
}
