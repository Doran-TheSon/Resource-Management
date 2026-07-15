import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({ open, title = 'Confirm', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      const handleEsc = (e) => { if (e.key === 'Escape') onCancel?.(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const confirmColor = variant === 'danger' ? 'var(--color-danger)' : 'var(--color-primary)';

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div
        ref={dialogRef}
        style={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            style={{ ...styles.confirmBtn, backgroundColor: confirmColor }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'var(--z-modal-overlay)',
    animation: 'fadeInOverlay 0.2s ease-out',
  },
  dialog: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    maxWidth: 420,
    width: '90%',
    boxShadow: 'var(--shadow-xl)',
    animation: 'scaleIn 0.2s ease-out',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-2)',
  },
  message: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-6)',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
  },
  cancelBtn: {
    padding: 'var(--space-2) var(--space-4)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    transition: 'all var(--transition-fast)',
  },
  confirmBtn: {
    padding: 'var(--space-2) var(--space-4)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    transition: 'all var(--transition-fast)',
  },
};
