import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { allocationApi } from '../../api/allocationApi';
import { employeeApi } from '../../api/employeeApi';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import AllocationGauge from '../../components/common/AllocationGauge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { toast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const columns = [
  { key: 'employeeName', label: 'Employee' },
  { key: 'projectName', label: 'Project' },
  { key: 'projectCode', label: 'Code', width: 100 },
  {
    key: 'allocationPercent',
    label: 'Allocation',
    render: (v) => <AllocationGauge value={v} height={6} />,
  },
  { key: 'roleInProject', label: 'Role' },
  { key: 'startDate', label: 'Start', render: (v) => formatDate(v) },
  { key: 'endDate', label: 'End', render: (v) => formatDate(v) },
];

export default function AllocationListPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, loading, error, execute } = useApi('allocations', () =>
    allocationApi.getAll()
  );

  useEffect(() => {
    employeeApi.getAll({ page: 0, size: 1000 })
      .then(setEmployees)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (error) toast(error.message, 'error');
  }, [error]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await allocationApi.delete(deleteTarget.allocationId);
      toast('Allocation deleted successfully', 'success');
      execute();
    } catch (err) {
      toast(err.message || 'Failed to delete allocation', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const actions = (row) => (
    <>
      <button
        onClick={() => navigate(`/allocations/${row.allocationId}/edit`)}
        style={styles.actionBtn}
        title="Edit"
      >
        ✏️
      </button>
      <button
        style={styles.actionBtn}
        onClick={() => setDeleteTarget(row)}
        title="Delete"
      >
        🗑️
      </button>
    </>
  );

  return (
    <div className="page-content">
      <PageHeader
        title="Allocations"
        subtitle="Manage resource assignments across projects"
        actions={
          <button onClick={() => navigate('/allocations/new')} style={styles.addBtn}>
            + New Allocation
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={data || []}
        loading={loading}
        error={error}
        onRetry={execute}
        keyField="allocationId"
        actions={actions}
        emptyTitle="No allocations yet"
        emptyDescription="Allocate employees to projects to see them here."
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Allocation"
        message={`Are you sure you want to remove ${deleteTarget?.employeeName} from ${deleteTarget?.projectName}? This will free up ${deleteTarget?.allocationPercent}% capacity.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
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
