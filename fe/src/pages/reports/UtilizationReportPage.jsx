import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import AllocationGauge from '../../components/common/AllocationGauge';
import { toast } from '../../components/common/Toast';

const columns = [
  { key: 'fullName', label: 'Employee Name' },
  {
    key: 'totalAllocation',
    label: 'Allocation',
    render: (v, row) => (
      <AllocationGauge value={v} max={100} />
    ),
    align: 'center',
  },
  {
    key: 'available',
    label: 'Available',
    render: (v) => (
      <span
        style={{
          color: v > 30 ? 'var(--color-success)' : v > 0 ? 'var(--color-warning)' : 'var(--color-danger)',
          fontWeight: 'var(--font-semibold)',
        }}
      >
        {v}%
      </span>
    ),
  },
];

export default function UtilizationReportPage() {
  const { data, loading, error, execute } = useApi('utilization', reportApi.getUtilization);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error]);

  const avgUtilization = data?.length
    ? Math.round(data.reduce((sum, r) => sum + r.totalAllocation, 0) / data.length)
    : 0;

  return (
    <div className="page-content">
      <PageHeader
        title="Utilization Report"
        subtitle="Overview of all employees' resource allocation"
      />

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{data?.length || 0}</div>
          <div style={styles.summaryLabel}>Total Employees</div>
        </div>
        <div style={styles.summaryCard}>
          <div
            style={{
              ...styles.summaryValue,
              color: avgUtilization > 80 ? 'var(--color-warning)' : 'var(--color-primary)',
            }}
          >
            {avgUtilization}%
          </div>
          <div style={styles.summaryLabel}>Avg Utilization</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryValue, color: 'var(--color-success)' }}>
            {data?.filter((r) => r.available > 30).length || 0}
          </div>
          <div style={styles.summaryLabel}>Available</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryValue, color: 'var(--color-danger)' }}>
            {data?.filter((r) => r.totalAllocation > 90).length || 0}
          </div>
          <div style={styles.summaryLabel}>Overloaded</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data || []).sort((a, b) => b.totalAllocation - a.totalAllocation)}
        loading={loading}
        error={error}
        onRetry={execute}
        keyField="employeeId"
        emptyTitle="No data available"
        emptyDescription="Assign allocations to see utilization data."
      />
    </div>
  );
}

const styles = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  summaryCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    marginBottom: 'var(--space-1)',
  },
  summaryLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-medium)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
