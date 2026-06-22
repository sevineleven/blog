import OwnerToggle from './OwnerToggle';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      marginTop: 80,
      padding: '24px 0 52px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <OwnerToggle />
      <a
        href="https://github.com/sevineleven"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--muted)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        github ↗
      </a>
    </footer>
  );
}
