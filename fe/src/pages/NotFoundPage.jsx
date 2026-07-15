import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <div style={styles.code}>404</div>
      <h1 style={styles.title}>Page Not Found</h1>
      <p style={styles.text}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button onClick={() => navigate('/')} style={styles.homeBtn}>
        ← Back to Dashboard
      </button>
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
  code: {
    fontSize: 72,
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    lineHeight: 1,
    marginBottom: 'var(--space-4)',
  },
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-2)',
  },
  text: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-8)',
    maxWidth: 400,
  },
  homeBtn: {
    padding: 'var(--space-2) var(--space-6)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    transition: 'all var(--transition-fast)',
  },
};
