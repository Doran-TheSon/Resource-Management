import React from 'react';

export default function Header({ onMenuToggle }) {
  return (
    <header style={styles.header}>
      <button style={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div style={styles.right}>
        <span style={styles.badge}>v1.0</span>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: 'var(--header-height)',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-4)',
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-header)',
  },
  menuBtn: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
  },
};
