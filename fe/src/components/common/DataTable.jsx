import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data,
  loading,
  error,
  onRetry,
  keyField = 'id',
  emptyTitle,
  emptyDescription,
  onRowClick,
  actions,
}) {
  if (loading) {
    return <TableSkeleton columns={columns} />;
  }

  if (error) {
    return (
      <div style={styles.errorWrapper}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error.message || 'Failed to load data'}</p>
        {onRetry && (
          <button style={styles.retryBtn} onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No data found'}
        description={emptyDescription || 'There are no records to display.'}
      />
    );
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...styles.th,
                  width: col.width,
                  textAlign: col.align || 'left',
                  cursor: col.sortable ? 'pointer' : 'default',
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ ...styles.th, width: 80 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[keyField] || idx}
              style={{
                ...styles.tr,
                cursor: onRowClick ? 'pointer' : 'default',
                animation: `fadeInRow 0.3s ease-out both`,
                animationDelay: `${Math.min(idx * 0.03, 0.3)}s`,
              }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    ...styles.td,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
              {actions && (
                <td style={styles.td}>
                  <div style={styles.actions} onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton({ columns }) {
  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} style={styles.tr}>
              {columns.map((col) => (
                <td key={col.key} style={styles.td}>
                  <div className="skeleton" style={{ height: 16, width: '80%' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--text-sm)',
  },
  th: {
    padding: 'var(--space-3) var(--space-4)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border)',
    whiteSpace: 'nowrap',
    fontSize: 'var(--text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: 'var(--color-bg)',
  },
  tr: {
    borderBottom: '1px solid var(--color-border-light)',
    transition: 'background-color var(--transition-fast)',
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
  },
  errorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-12)',
    gap: 'var(--space-3)',
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    color: 'var(--color-danger)',
    fontSize: 'var(--text-sm)',
  },
  retryBtn: {
    padding: 'var(--space-2) var(--space-4)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
};
