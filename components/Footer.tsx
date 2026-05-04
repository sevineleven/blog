export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      marginTop: 80,
      padding: '28px 0 52px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} sevineleven.
      </span>
      <span style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
        "write more, learn deeper."
      </span>
    </footer>
  );
}
