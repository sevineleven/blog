// 글 헤더 메타 줄의 조회수 표시. 값은 서버(ISR)에서 받아 첫 HTML 에 박히므로
// 클라 fetch 가 없다 → "조회 —" 깜빡임도, 추가 요청도 없다. 집계는 ViewTracker(POST) 담당.
export default function ViewCount({ count }: { count: number }) {
  return (
    // 구분점(·) 대신 부모의 columnGap 으로 띄운다 — 줄이 바뀌었을 때 점으로 시작하지 않게.
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
      조회 {count.toLocaleString()}
    </span>
  );
}
