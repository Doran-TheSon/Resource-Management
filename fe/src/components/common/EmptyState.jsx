import React from 'react';

export default function EmptyState({ title = 'No data found', description = 'There are no records to display.', actionLabel, onAction }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.iconContainer}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-disabled)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="12" y1="10" x2="12" y2="16" />
        </svg>
      </div>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <button style={styles.button} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12) var(--space-4)',
    textAlign: 'center',
    animation: 'fadeInUp 0.3s ease-out',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-4)',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  description: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    maxWidth: 320,
    marginBottom: 'var(--space-6)',
  },
  button: {
    padding: 'var(--space-2) var(--space-4)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    transition: 'all var(--transition-fast)',
  },
};
