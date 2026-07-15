import React, { useState, useEffect, useCallback } from 'react';

let toastId = 0;
let addToastFn = null;

export function toast(message, type = 'info', duration = 4000) {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type, duration });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  return (
    <div style={styles.container}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, t.duration);
    return () => clearTimeout(timer);
  }, [t.duration, onClose]);

  const colors = {
    success: { bg: 'var(--color-success-bg)', border: 'var(--color-success)', icon: '✅' },
    error: { bg: 'var(--color-danger-bg)', border: 'var(--color-danger)', icon: '❌' },
    warning: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning)', icon: '⚠️' },
    info: { bg: 'var(--color-info-bg)', border: 'var(--color-info)', icon: 'ℹ️' },
  };

  const c = colors[t.type] || colors.info;

  return (
    <div
      style={{
        ...styles.toast,
        backgroundColor: c.bg,
        borderLeft: `4px solid ${c.border}`,
        animation: t.exiting
          ? 'slideOutRight 0.3s ease-in forwards'
          : 'slideInRight 0.3s ease-out',
      }}
    >
      <span style={styles.icon}>{c.icon}</span>
      <span style={styles.message}>{t.message}</span>
      <button style={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 'var(--space-4)',
    right: 'var(--space-4)',
    zIndex: 'var(--z-toast)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    maxWidth: 400,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    fontSize: 'var(--text-sm)',
  },
  icon: {
    fontSize: 'var(--text-lg)',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    color: 'var(--color-text)',
  },
  close: {
    flexShrink: 0,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
  },
};
