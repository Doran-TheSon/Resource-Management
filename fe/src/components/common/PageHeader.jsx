import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.left}>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div style={styles.actions}>{actions}</div>}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-6)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    flexShrink: 0,
  },
};
