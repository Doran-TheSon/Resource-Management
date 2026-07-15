import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AllocationGauge from '../../components/common/AllocationGauge';
import { toast } from '../../components/common/Toast';

export default function AvailableResourcesPage() {
  const { data, loading, error, execute } = useApi(
    'available-resources',
    reportApi.getAvailableResources
  );

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error]);

  if (loading) return <LoadingSpinner text="Loading available resources..." />;

  const availableData = (data || []).filter((r) => r.available > 0);

  return (
    <div className="page-content">
      <PageHeader
        title="Available Resources"
        subtitle={`${availableData.length} employees with remaining capacity`}
        actions={
          <span style={styles.countBadge}>
            {availableData.reduce((sum, r) => sum + r.available, 0)}% total available
          </span>
        }
      />

      {availableData.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🎯</div>
          <h3>All resources fully allocated</h3>
          <p style={styles.emptyText}>
            All employees are at 100% allocation. Consider redistributing workload.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {availableData
            .sort((a, b) => b.available - a.available)
            .map((r, idx) => (
              <div
                key={r.employeeId}
                style={{
                  ...styles.card,
                  animation: `fadeInUp 0.3s ease-out`,
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.name}>{r.fullName}</h3>
                  <span
                    style={{
                      ...styles.availableTag,
                      backgroundColor: 'var(--color-success-bg)',
                      color: 'var(--color-success-dark)',
                    }}
                  >
                    {r.available}% Free
                  </span>
                </div>
                <div style={styles.gaugeSection}>
                  <div style={styles.gaugeLabel}>
                    <span>Allocated</span>
                    <span>{r.totalAllocation}%</span>
                  </div>
                  <AllocationGauge value={r.totalAllocation} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  countBadge: {
    padding: 'var(--space-2) var(--space-4)',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success-dark)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 'var(--space-4)',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    transition: 'all var(--transition-normal)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-4)',
  },
  name: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
  },
  availableTag: {
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
  },
  gaugeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  gaugeLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
  },
  empty: {
    textAlign: 'center',
    padding: 'var(--space-12)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 'var(--space-4)',
  },
  emptyText: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    marginTop: 'var(--space-2)',
  },
};
