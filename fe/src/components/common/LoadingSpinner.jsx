import React from 'react';

export default function LoadingSpinner({ size = 40, text = 'Loading...' }) {
  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.spinner, width: size, height: size }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
          <circle
            cx="12" cy="12" r="10"
            stroke="var(--color-border)" strokeWidth="3"
            fill="none"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="var(--color-primary)" strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            style={{
              animation: 'spin 0.8s linear infinite',
              transformOrigin: 'center',
            }}
          />
        </svg>
      </div>
      {text && <p style={styles.text}>{text}</p>}
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
    gap: 'var(--space-4)',
    animation: 'fadeIn 0.3s ease-out',
  },
  spinner: {
    animation: 'spin 1.5s linear infinite',
  },
  text: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
  },
};
