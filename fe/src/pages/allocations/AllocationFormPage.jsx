import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { allocationApi } from '../../api/allocationApi';
import { employeeApi } from '../../api/employeeApi';
import { projectApi } from '../../api/projectApi';
import { workloadApi } from '../../api/workloadApi';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import AllocationGauge from '../../components/common/AllocationGauge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from '../../components/common/Toast';
import { validateForm, isValidDateRange } from '../../utils/validators';
import { PROJECT_STATUS } from '../../utils/constants';

const fieldRules = {
  employeeId: { required: true },
  projectId: { required: true },
  allocationPercent: { required: true, min: 1, max: 100 },
  startDate: { required: true },
};

export default function AllocationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    employeeApi.getAll({ page: 0, size: 1000 })
      .then(setEmployees)
      .catch(() => toast('Failed to load employees', 'error'))
      .finally(() => setLoadingEmployees(false));

    projectApi.getAll({ page: 0, size: 100 })
      .then(setProjects)
      .catch(() => toast('Failed to load projects', 'error'))
      .finally(() => setLoadingProjects(false));
  }, []);

  const form = useForm(
    {
      employeeId: '',
      projectId: '',
      allocationPercent: 50,
      roleInProject: '',
      startDate: '',
      endDate: '',
    },
    (values) => {
      const errs = validateForm(values, fieldRules);
      if (values.startDate && values.endDate && !isValidDateRange(values.startDate, values.endDate)) {
        errs.endDate = 'End date must be after start date';
      }
      return errs;
    }
  );

  const { values, errors, submitting, touched, setValue, handleChange, handleBlur, validate, setSubmitting, setErrors, setMultiple } = form;

  useEffect(() => {
    if (values.employeeId) {
      workloadApi.getByEmployee(values.employeeId)
        .then(setWorkload)
        .catch(() => setWorkload(null));
    } else {
      setWorkload(null);
    }
  }, [values.employeeId]);

  const { data: existingData, loading: loadingExisting } = useApi(
    `allocation-${id}`,
    () => allocationApi.getById(id),
    { immediate: isEditing }
  );

  useEffect(() => {
    if (existingData) {
      setMultiple({
        employeeId: existingData.employeeId || '',
        projectId: existingData.projectId || '',
        allocationPercent: existingData.allocationPercent || 50,
        roleInProject: existingData.roleInProject || '',
        startDate: existingData.startDate || '',
        endDate: existingData.endDate || '',
      });
    }
  }, [existingData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        employeeId: Number(values.employeeId),
        projectId: Number(values.projectId),
        allocationPercent: Number(values.allocationPercent),
        roleInProject: values.roleInProject.trim(),
        startDate: values.startDate,
        endDate: values.endDate || null,
      };

      if (isEditing) {
        await allocationApi.update(id, payload);
        toast('Allocation updated successfully', 'success');
      } else {
        await allocationApi.create(payload);
        toast('Allocation created successfully', 'success');
      }
      navigate('/allocations');
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        toast(err.message || 'Failed to save allocation', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loadingEmployees || loadingProjects || (isEditing && loadingExisting);

  if (loading) {
    return <LoadingSpinner text="Loading form data..." />;
  }

  const activeProjects = projects.filter(
    (p) => p.status !== PROJECT_STATUS.COMPLETED
  );

  const available = workload ? workload.available : 100;
  const currentTotal = workload ? workload.totalAllocation : 0;

  return (
    <div className="page-content">
      <PageHeader
        title={isEditing ? 'Edit Allocation' : 'New Allocation'}
        subtitle={
          isEditing
            ? `Editing allocation #${id}`
            : 'Assign an employee to a project'
        }
      />

      <div style={styles.grid}>
        <div style={styles.formCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <FormField
              label="Employee"
              name="employeeId"
              type="select"
              value={values.employeeId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.employeeId}
              touched={touched.employeeId}
              required
              options={[
                { value: '', label: 'Select employee...' },
                ...employees.map((e) => ({
                  value: e.employeeId,
                  label: `${e.fullName} (${e.employeeCode})`,
                })),
              ]}
            />

            <FormField
              label="Project"
              name="projectId"
              type="select"
              value={values.projectId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.projectId}
              touched={touched.projectId}
              required
              options={[
                { value: '', label: 'Select project...' },
                ...activeProjects.map((p) => ({
                  value: p.projectId,
                  label: `${p.projectName} (${p.projectCode})`,
                })),
              ]}
              helpText="Only ACTIVE and PLANNING projects are shown"
            />

            <FormField
              label={`Allocation % (${values.allocationPercent}%)`}
              name="allocationPercent"
              type="range"
              value={values.allocationPercent}
              onChange={(e) => setValue('allocationPercent', Number(e.target.value))}
              error={errors.allocationPercent}
              touched={touched.allocationPercent}
              min={1}
              max={100}
              helpText="Adjust between 1% and 100%"
            />

            <FormField
              label="Role in Project"
              name="roleInProject"
              value={values.roleInProject}
              onChange={handleChange}
              placeholder="e.g. Backend Developer"
            />

            <div style={styles.dateGrid}>
              <FormField
                label="Start Date"
                name="startDate"
                type="date"
                value={values.startDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.startDate}
                touched={touched.startDate}
                required
              />
              <FormField
                label="End Date"
                name="endDate"
                type="date"
                value={values.endDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.endDate}
                touched={touched.endDate}
              />
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={() => navigate('/allocations')} style={styles.cancelBtn}>Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Allocation'
                    : 'Create Allocation'}
              </button>
            </div>
          </form>
        </div>

        <div style={styles.workloadCard}>
          <h3 style={styles.workloadTitle}>Current Workload</h3>
          {workload ? (
            <div style={styles.workloadContent}>
              <p style={styles.employeeName}>{workload.employeeName}</p>

              <div style={styles.totalSection}>
                <span style={styles.totalLabel}>Total Allocation</span>
                <AllocationGauge value={currentTotal} height={10} />
              </div>

              <div
                style={{
                  ...styles.availableBadge,
                  backgroundColor:
                    available > 30
                      ? 'var(--color-success-bg)'
                      : available > 0
                        ? 'var(--color-warning-bg)'
                        : 'var(--color-danger-bg)',
                  color:
                    available > 30
                      ? 'var(--color-success-dark)'
                      : available > 0
                        ? 'var(--color-warning-dark)'
                        : 'var(--color-danger-dark)',
                }}
              >
                Available: {available}%
              </div>

              {workload.allocations?.length > 0 && (
                <div style={styles.currentProjects}>
                  <p style={styles.projectsLabel}>Current Projects:</p>
                  {workload.allocations.map((a) => (
                    <div key={a.allocationId} style={styles.projectItem}>
                      <span style={styles.projectName}>{a.projectName}</span>
                      <span style={styles.projectPercent}>{a.allocationPercent}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={styles.noEmployee}>
              {values.employeeId
                ? 'Unable to load workload'
                : 'Select an employee to see workload'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 'var(--space-6)',
    alignItems: 'start',
  },
  formCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  dateGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-border)',
  },
  submitBtn: {
    padding: 'var(--space-2) var(--space-6)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: 'var(--space-2) var(--space-4)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  workloadCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    position: 'sticky',
    top: 'calc(var(--header-height) + var(--space-6))',
  },
  workloadTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-4)',
    paddingBottom: 'var(--space-3)',
    borderBottom: '1px solid var(--color-border)',
  },
  workloadContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  employeeName: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
  },
  totalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  totalLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  availableBadge: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    textAlign: 'center',
  },
  currentProjects: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  projectsLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  projectItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-2)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
  },
  projectName: {
    color: 'var(--color-text)',
  },
  projectPercent: {
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-secondary)',
  },
  noEmployee: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    textAlign: 'center',
    padding: 'var(--space-8) 0',
  },
};
