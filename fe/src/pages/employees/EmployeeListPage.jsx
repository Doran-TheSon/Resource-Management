import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { employeeApi } from '../../api/employeeApi';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { toast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const columns = [
  { key: 'employeeCode', label: 'Code', width: 120 },
  { key: 'fullName', label: 'Full Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'createdAt', label: 'Created', render: (v) => formatDate(v) },
];

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const { data, loading, error, execute } = useApi('employees', () =>
    employeeApi.getAll({ page: 0, size: 100 })
  );

  useEffect(() => {
    if (error) {
      toast(error.message, 'error');
    }
  }, [error]);

  const handleRowClick = (row) => {
    navigate(`/employees/${row.employeeId}/workload`);
  };

  const actions = (row) => (
    <>
      <button
        onClick={() => navigate(`/employees/${row.employeeId}/edit`)}
        style={styles.actionBtn}
        title="Edit"
      >
        ✏️
      </button>
      <button
        onClick={() => navigate(`/employees/${row.employeeId}/workload`)}
        style={styles.actionBtn}
        title="View Workload"
      >
        📋
      </button>
    </>
  );

  return (
    <div className="page-content">
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce"
        actions={
          <button onClick={() => navigate('/employees/new')} style={styles.addBtn}>
            + Add Employee
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={data || []}
        loading={loading}
        error={error}
        onRetry={execute}
        keyField="employeeId"
        onRowClick={handleRowClick}
        actions={actions}
        emptyTitle="No employees yet"
        emptyDescription="Add your first employee to get started."
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
