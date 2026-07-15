import React from 'react';
import { ALLOCATION_COLORS } from '../../utils/constants';

export default function AllocationGauge({ value, max = 100, showLabel = true, height = 8 }) {
  const percent = Math.min((value / max) * 100, 100);
  const color = percent >= 90 ? ALLOCATION_COLORS.HIGH
    : percent >= 80 ? ALLOCATION_COLORS.MEDIUM
    : ALLOCATION_COLORS.LOW;

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.track, height }}>
        <div
          style={{
            ...styles.fill,
            width: `${percent}%`,
            backgroundColor: color,
            height,
          }}
        />
      </div>
      {showLabel && (
        <span style={styles.label}>{value}%</span>
      )}
    </div>
  );
}

export function AllocationGaugeVertical({ value, max = 100, label, color }) {
  const percent = Math.min((value / max) * 100, 100);
  const barColor = color || (percent >= 90 ? ALLOCATION_COLORS.HIGH
    : percent >= 80 ? ALLOCATION_COLORS.MEDIUM
    : ALLOCATION_COLORS.LOW);

  return (
    <div style={styles.vertWrapper}>
      <div style={styles.vertTrack}>
        <div
          style={{
            ...styles.vertFill,
            height: `${percent}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      {label && <span style={styles.vertLabel}>{label}</span>}
      <span style={styles.vertValue}>{value}%</span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    minWidth: 120,
  },
  track: {
    flex: 1,
    backgroundColor: 'var(--color-border-light)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-secondary)',
    minWidth: 36,
    textAlign: 'right',
  },
  vertWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-1)',
  },
  vertTrack: {
    width: 24,
    height: 120,
    backgroundColor: 'var(--color-border-light)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    position: 'relative',
  },
  vertFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 'var(--radius-full)',
    transition: 'height 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  vertLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
  },
  vertValue: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
  },
};
