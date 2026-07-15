import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { projectApi } from '../../api/projectApi';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from '../../components/common/Toast';
import { validateForm, isValidDateRange } from '../../utils/validators';
import { PROJECT_STATUS } from '../../utils/constants';

const fieldRules = {
  projectCode: { required: true },
  projectName: { required: true },
  customer: { required: true },
  status: { required: true },
  startDate: { required: true },
};

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existingData, loading: loadingExisting } = useApi(
    `project-${id}`,
    () => projectApi.getById(id),
    { immediate: isEditing }
  );

  const form = useForm(
    {
      projectCode: '',
      projectName: '',
      customer: '',
      status: 'PLANNING',
      startDate: '',
      endDate: '',
    },
    (values) => {
      const errors = validateForm(values, fieldRules);
      if (values.startDate && values.endDate && !isValidDateRange(values.startDate, values.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
      return errors;
    }
  );

  const { values, errors, submitting, touched, handleChange, handleBlur, validate, setSubmitting, setErrors, setMultiple } = form;

  useEffect(() => {
    if (existingData) {
      setMultiple({
        projectCode: existingData.projectCode || '',
        projectName: existingData.projectName || '',
        customer: existingData.customer || '',
        status: existingData.status || 'PLANNING',
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
        projectCode: values.projectCode.trim(),
        projectName: values.projectName.trim(),
        customer: values.customer.trim(),
        status: values.status,
        startDate: values.startDate,
        endDate: values.endDate || null,
      };

      if (isEditing) {
        await projectApi.update(id, payload);
        toast('Project updated successfully', 'success');
      } else {
        await projectApi.create(payload);
        toast('Project created successfully', 'success');
      }
      navigate('/projects');
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        toast(err.message || 'Failed to save project', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing && loadingExisting) {
    return <LoadingSpinner text="Loading project..." />;
  }

  const statusOptions = Object.entries(PROJECT_STATUS).map(([value]) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase(),
  }));

  return (
    <div className="page-content">
      <PageHeader
        title={isEditing ? 'Edit Project' : 'Add Project'}
        subtitle={isEditing ? `Editing #${id}` : 'Create a new project'}
      />

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            <FormField
              label="Project Code"
              name="projectCode"
              value={values.projectCode}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.projectCode}
              touched={touched.projectCode}
              required
              placeholder="e.g. NCG-001"
            />
            <FormField
              label="Project Name"
              name="projectName"
              value={values.projectName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.projectName}
              touched={touched.projectName}
              required
              placeholder="e.g. NCG Training"
            />
            <FormField
              label="Customer"
              name="customer"
              value={values.customer}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.customer}
              touched={touched.customer}
              required
              placeholder="e.g. FPT Software"
            />
            <FormField
              label="Status"
              name="status"
              type="select"
              value={values.status}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.status}
              touched={touched.status}
              required
              options={statusOptions}
            />
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
              helpText="Leave blank if ongoing"
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={() => navigate('/projects')} style={styles.cancelBtn}>Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  formCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
    transition: 'all var(--transition-fast)',
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
    transition: 'all var(--transition-fast)',
  },
};
