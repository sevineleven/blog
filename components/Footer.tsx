export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      marginTop: 80,
      padding: '32px 0 48px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          © {new Date().getFullYear()} sevin.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'right' }}>
          "write more, learn deeper." —{' '}
          <span style={{ color: 'var(--text)' }}>sevin</span>
        </p>
      </div>
    </footer>
  );
}
