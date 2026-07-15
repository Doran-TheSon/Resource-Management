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
    render: (v) => (
      <AllocationGauge value={v} />
    ),
  },
  {
    key: 'available',
    label: 'Available',
    render: (v) => (
      <span style={{
        color: 'var(--color-danger)',
        fontWeight: 'var(--font-bold)',
      }}>
        {v}%
      </span>
    ),
  },
];

export default function OverloadedPage() {
  const { data, loading, error, execute } = useApi('overloaded', reportApi.getOverloaded);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error]);

  const overloadedData = (data || []).filter((r) => r.totalAllocation > 90);

  return (
    <div className="page-content">
      <PageHeader
        title="Overloaded Employees"
        subtitle={
          overloadedData.length > 0
            ? `${overloadedData.length} employee(s) exceeding 90% capacity — needs attention`
            : 'No overloaded employees'
        }
        actions={
          overloadedData.length > 0 && (
            <span style={styles.alertBadge}>
              ⚠️ {overloadedData.length} overloaded
            </span>
          )
        }
      />

      {overloadedData.length > 0 ? (
        <>
          <div style={styles.alertBanner}>
            <strong>Action Required:</strong> These employees are at high capacity.
            Consider reallocating tasks or hiring additional resources.
          </div>

          <DataTable
            columns={columns}
            data={overloadedData.sort((a, b) => b.totalAllocation - a.totalAllocation)}
            loading={loading}
            error={error}
            onRetry={execute}
            keyField="employeeId"
            emptyTitle="No overloaded employees"
            emptyDescription="All employees are within healthy allocation limits."
          />
        </>
      ) : loading ? null : (
        <div style={styles.allClear}>
          <div style={styles.allClearIcon}>✅</div>
          <h3>All clear!</h3>
          <p style={styles.allClearText}>
            No employees are currently overloaded. All allocations are within healthy limits.
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  alertBadge: {
    padding: 'var(--space-2) var(--space-4)',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger-dark)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
  },
  alertBanner: {
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger-dark)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-6)',
    border: '1px solid var(--color-danger)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  allClear: {
    textAlign: 'center',
    padding: 'var(--space-12)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  allClearIcon: {
    fontSize: 48,
    marginBottom: 'var(--space-4)',
  },
  allClearText: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    marginTop: 'var(--space-2)',
  },
};
