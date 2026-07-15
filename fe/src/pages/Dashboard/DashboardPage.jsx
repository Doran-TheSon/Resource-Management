import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { reportApi } from '../../api/reportApi';
import { employeeApi } from '../../api/employeeApi';
import { projectApi } from '../../api/projectApi';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from '../../components/common/Toast';
import { PROJECT_STATUS } from '../../utils/constants';

export default function DashboardPage() {
  const navigate = useNavigate();
  // Fetch all data in parallel
  const { data: utilization, loading: loadingUtil } = useApi(
    'dashboard-util', reportApi.getUtilization
  );
  const { data: employees, loading: loadingEmp } = useApi(
    'dashboard-emp', () => employeeApi.getAll({ page: 0, size: 1 })
  );
  const { data: projects, loading: loadingProj } = useApi(
    'dashboard-proj', () => projectApi.getAll({ page: 0, size: 100 })
  );
  const { data: availableRes, loading: loadingAvail } = useApi(
    'dashboard-avail', reportApi.getAvailableResources
  );
  const { data: overloaded, loading: loadingOver } = useApi(
    'dashboard-over', reportApi.getOverloaded
  );

  useEffect(() => {
    if (loadingUtil) return;
  }, [loadingUtil]);

  const loading = loadingUtil || loadingEmp || loadingProj || loadingAvail || loadingOver;

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  // Compute stats
  const totalEmployees = utilization?.length || 0;
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(
    (p) => p.status === PROJECT_STATUS.ACTIVE
  ).length || 0;
  const avgUtilization = utilization?.length
    ? Math.round(
        utilization.reduce((sum, r) => sum + r.totalAllocation, 0) /
          utilization.length
      )
    : 0;
  const availableCount = availableRes?.length || 0;
  const overloadedCount = overloaded?.length || 0;

  const stats = [
    {
      label: 'Total Employees',
      value: totalEmployees,
      icon: '👥',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)',
    },
    {
      label: 'Active Projects',
      value: activeProjects,
      icon: '📁',
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
    },
    {
      label: 'Available Resources',
      value: availableCount,
      icon: '✅',
      color: 'var(--color-info)',
      bg: 'var(--color-info-bg)',
    },
    {
      label: 'Overloaded',
      value: overloadedCount,
      icon: '⚠️',
      color: overloadedCount > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)',
      bg: overloadedCount > 0 ? 'var(--color-danger-bg)' : 'var(--color-border-light)',
    },
  ];

  const quickLinks = [
    { label: 'New Allocation', path: '/allocations/new', icon: '🔗' },
    { label: 'View Reports', path: '/reports/utilization', icon: '📈' },
    { label: 'AI Recommend', path: '/ai/recommend', icon: '🤖' },
    { label: 'Risk Analysis', path: '/ai/risk-analysis', icon: '🛡️' },
  ];

  return (
    <div className="page-content">
      <PageHeader
        title="Dashboard"
        subtitle="Resource Management Overview"
      />

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            style={{
              ...styles.statCard,
              animation: `fadeInUp 0.3s ease-out`,
              animationDelay: `${idx * 0.08}s`,
            }}
          >
            <div
              style={{
                ...styles.statIcon,
                backgroundColor: stat.bg,
                color: stat.color,
              }}
            >
              {stat.icon}
            </div>
            <div style={styles.statInfo}>
              <div style={{ ...styles.statValue, color: stat.color }}>
                {stat.value}
              </div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Utilization Overview & Quick Links */}
      <div style={styles.bottomGrid}>
        {/* Quick Links */}
        <div style={styles.quickLinksCard}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
          <div style={styles.quickLinksList}>
            {quickLinks.map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)} style={styles.quickLink}>
                <span style={{ fontSize: 20 }}>{link.icon}</span>
                <span>{link.label}</span>
                <span style={styles.linkArrow}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        <div style={styles.overviewCard}>
          <h3 style={styles.sectionTitle}>Resource Overview</h3>
          <div style={styles.overviewItems}>
            <div style={styles.overviewItem}>
              <div style={styles.overviewLabel}>Total Projects</div>
              <div style={styles.overviewValue}>{totalProjects}</div>
            </div>
            <div style={styles.overviewItem}>
              <div style={styles.overviewLabel}>Average Utilization</div>
              <div
                style={{
                  ...styles.overviewValue,
                  color:
                    avgUtilization > 80
                      ? 'var(--color-warning)'
                      : 'var(--color-success)',
                }}
              >
                {avgUtilization}%
              </div>
            </div>
            <div style={styles.overviewItem}>
              <div style={styles.overviewLabel}>Total Available Capacity</div>
              <div style={{ ...styles.overviewValue, color: 'var(--color-success)' }}>
                {availableRes?.reduce((s, r) => s + r.available, 0) || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  statCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    transition: 'all var(--transition-normal)',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  statInfo: {},
  statValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-medium)',
    marginTop: 'var(--space-1)',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-6)',
  },
  quickLinksCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  sectionTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-4)',
  },
  quickLinksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  quickLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-bg)',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    transition: 'all var(--transition-fast)',
  },
  linkArrow: {
    marginLeft: 'auto',
    color: 'var(--color-text-secondary)',
  },
  overviewCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  overviewItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  overviewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
  },
  overviewLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  overviewValue: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
  },
};
