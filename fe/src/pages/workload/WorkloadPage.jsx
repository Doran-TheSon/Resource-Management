import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { workloadApi } from '../../api/workloadApi';
import { employeeApi } from '../../api/employeeApi';
import PageHeader from '../../components/common/PageHeader';
import AllocationGauge from '../../components/common/AllocationGauge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';
import { ALLOCATION_COLORS } from '../../utils/constants';

export default function WorkloadPage() {
  const { id } = useParams();
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(id || '');

  useEffect(() => {
    employeeApi.getAll({ page: 0, size: 1000 })
      .then(setEmployees)
      .catch(() => {});
  }, []);

  const { data: workload, loading, error, execute } = useApi(
    `workload-${selectedId}`,
    () => workloadApi.getByEmployee(selectedId),
    { immediate: Boolean(selectedId), deps: [selectedId] }
  );

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error]);

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedId(empId);
    if (empId) {
      window.history.replaceState(null, '', `/employees/${empId}/workload`);
    }
  };

  const getPercentColor = (val) => {
    if (val >= 90) return ALLOCATION_COLORS.HIGH;
    if (val >= 80) return ALLOCATION_COLORS.MEDIUM;
    return ALLOCATION_COLORS.LOW;
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Employee Workload"
        subtitle="View resource allocation details"
        actions={
          <select
            value={selectedId}
            onChange={handleEmployeeChange}
            style={styles.employeeSelect}
          >
            <option value="">Select employee...</option>
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.fullName} ({e.employeeCode})
              </option>
            ))}
          </select>
        }
      />

      {!selectedId ? (
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>👤</div>
          <h3 style={styles.placeholderTitle}>Select an Employee</h3>
          <p style={styles.placeholderText}>
            Choose an employee from the dropdown above to view their workload details.
          </p>
        </div>
      ) : loading ? (
        <LoadingSpinner text="Loading workload..." />
      ) : error ? (
        <div style={styles.errorBox}>
          <p>Failed to load workload data.</p>
          <button style={styles.retryBtn} onClick={execute}>Retry</button>
        </div>
      ) : workload ? (
        <div style={styles.content}>
          {/* Overview Card */}
          <div style={styles.overviewCard}>
            <div style={styles.overviewLeft}>
              <h2 style={styles.employeeName}>{workload.employeeName}</h2>
            </div>
            <div style={styles.overviewRight}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{workload.totalAllocation}%</div>
                <div style={styles.statLabel}>Total Allocation</div>
              </div>
              <div style={styles.statBox}>
                <div
                  style={{
                    ...styles.statValue,
                    color:
                      workload.available > 30
                        ? 'var(--color-success)'
                        : workload.available > 0
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)',
                  }}
                >
                  {workload.available}%
                </div>
                <div style={styles.statLabel}>Available</div>
              </div>
            </div>
          </div>

          {/* Overall Gauge */}
          <div style={styles.gaugeCard}>
            <h3 style={styles.sectionTitle}>Overall Allocation</h3>
            <AllocationGauge value={workload.totalAllocation} height={16} />
            {workload.totalAllocation > 90 && (
              <div style={styles.warningBanner}>
                ⚠️ This employee is overloaded! Consider redistributing tasks.
              </div>
            )}
          </div>

          {/* Allocation Details */}
          <h3 style={styles.sectionTitle}>
            Allocation Details ({workload.allocations?.length || 0} projects)
          </h3>
          <div style={styles.allocationsGrid}>
            {workload.allocations?.map((a, idx) => (
              <div
                key={a.allocationId}
                style={{
                  ...styles.allocationCard,
                  animation: `fadeInUp 0.3s ease-out`,
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div style={styles.cardHeader}>
                  <div
                    style={{
                      width: 4,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: getPercentColor(a.allocationPercent),
                      flexShrink: 0,
                    }}
                  />
                  <div style={styles.cardInfo}>
                    <h4 style={styles.projectName}>{a.projectName}</h4>
                    <span style={styles.projectCode}>{a.projectCode}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--text-2xl)',
                      fontWeight: 'var(--font-bold)',
                      color: getPercentColor(a.allocationPercent),
                    }}
                  >
                    {a.allocationPercent}%
                  </span>
                </div>
                <AllocationGauge value={a.allocationPercent} height={8} />
                <div style={styles.cardMeta}>
                  {a.roleInProject && (
                    <span style={styles.metaTag}>🎯 {a.roleInProject}</span>
                  )}
                  <span style={styles.metaTag}>
                    📅 {formatDate(a.startDate)} — {formatDate(a.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  employeeSelect: {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    minWidth: 200,
    outline: 'none',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-12)',
    textAlign: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 'var(--space-4)',
  },
  placeholderTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-2)',
  },
  placeholderText: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    maxWidth: 400,
  },
  errorBox: {
    textAlign: 'center',
    padding: 'var(--space-12)',
    color: 'var(--color-danger)',
  },
  retryBtn: {
    marginTop: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-4)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  overviewCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    animation: 'fadeInUp 0.3s ease-out',
  },
  overviewLeft: {},
  overviewRight: {
    display: 'flex',
    gap: 'var(--space-6)',
  },
  employeeName: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
  },
  statBox: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-medium)',
  },
  gaugeCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-4)',
  },
  warningBanner: {
    marginTop: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger-dark)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
  },
  allocationsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  allocationCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    transition: 'all var(--transition-normal)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  cardInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
  },
  projectCode: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
  },
  cardMeta: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  metaTag: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    backgroundColor: 'var(--color-bg)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
  },
};
