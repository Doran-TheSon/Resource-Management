import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';

export default function StatusBadge({ status, size = 'md' }) {
  const colors = {
    PLANNING: { bg: 'var(--color-info-bg)', text: 'var(--color-info-dark)' },
    ACTIVE: { bg: 'var(--color-success-bg)', text: 'var(--color-success-dark)' },
    COMPLETED: { bg: 'var(--color-border)', text: 'var(--color-text-secondary)' },
  };

  const c = colors[status] || colors.PLANNING;

  const sizes = {
    sm: { padding: '2px 8px', fontSize: 'var(--text-xs)' },
    md: { padding: '4px 12px', fontSize: 'var(--text-sm)' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: s.padding,
        borderRadius: 'var(--radius-full)',
        fontSize: s.fontSize,
        fontWeight: 'var(--font-medium)',
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: c.text,
        flexShrink: 0,
      }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
