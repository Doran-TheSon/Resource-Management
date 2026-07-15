import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { projectApi } from '../../api/projectApi';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const columns = [
  { key: 'projectCode', label: 'Code', width: 120 },
  { key: 'projectName', label: 'Project Name' },
  { key: 'customer', label: 'Customer' },
  {
    key: 'status',
    label: 'Status',
    render: (v) => <StatusBadge status={v} />,
  },
  { key: 'startDate', label: 'Start Date', render: (v) => formatDate(v) },
  { key: 'endDate', label: 'End Date', render: (v) => formatDate(v) },
];

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { data, loading, error, execute } = useApi('projects', () =>
    projectApi.getAll({ page: 0, size: 100 })
  );

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error]);

  const actions = (row) => (
    <button
      onClick={() => navigate(`/projects/${row.projectId}/edit`)}
      style={styles.actionBtn}
      title="Edit"
    >
      ✏️
    </button>
  );

  return (
    <div className="page-content">
      <PageHeader
        title="Projects"
        subtitle="Manage your projects and engagements"
        actions={
          <button onClick={() => navigate('/projects/new')} style={styles.addBtn}>
            + Add Project
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={data || []}
        loading={loading}
        error={error}
        onRetry={execute}
        keyField="projectId"
        actions={actions}
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to start allocating resources."
      />
    </div>
  );
}

const styles = {
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  actionBtn: {
    padding: 'var(--space-1)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: 'var(--text-base)',
    opacity: 0.7,
    transition: 'opacity var(--transition-fast)',
    background: 'none',
    border: 'none',
  },
};
