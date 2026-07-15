import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useForm } from '../../hooks/useForm';
import { employeeApi } from '../../api/employeeApi';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from '../../components/common/Toast';
import { validateForm } from '../../utils/validators';

const fieldRules = {
  employeeCode: { required: true, pattern: /^[A-Z0-9]{3,20}$/ },
  fullName: { required: true },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  role: { required: true },
  department: { required: true },
};

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existingData, loading: loadingExisting } = useApi(
    `employee-${id}`,
    () => employeeApi.getById(id),
    { immediate: isEditing }
  );

  const form = useForm(
    {
      employeeCode: '',
      fullName: '',
      email: '',
      role: '',
      department: '',
    },
    (values) => validateForm(values, fieldRules)
  );

  const { values, errors, submitting, touched, handleChange, handleBlur, validate, setSubmitting, setErrors, setMultiple } = form;

  useEffect(() => {
    if (existingData) {
      setMultiple({
        employeeCode: existingData.employeeCode || '',
        fullName: existingData.fullName || '',
        email: existingData.email || '',
        role: existingData.role || '',
        department: existingData.department || '',
      });
    }
  }, [existingData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        employeeCode: values.employeeCode.toUpperCase(),
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        role: values.role.trim(),
        department: values.department.trim(),
      };

      if (isEditing) {
        await employeeApi.update(id, payload);
        toast('Employee updated successfully', 'success');
      } else {
        await employeeApi.create(payload);
        toast('Employee created successfully', 'success');
      }
      navigate('/employees');
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        toast(err.message || 'Failed to save employee', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing && loadingExisting) {
    return <LoadingSpinner text="Loading employee..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        title={isEditing ? 'Edit Employee' : 'Add Employee'}
        subtitle={isEditing ? `Editing #${id}` : 'Create a new employee record'}
      />

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            <FormField
              label="Employee Code"
              name="employeeCode"
              value={values.employeeCode}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.employeeCode}
              touched={touched.employeeCode}
              required
              placeholder="e.g. EMP001"
              helpText="3-20 uppercase alphanumeric characters"
            />
            <FormField
              label="Full Name"
              name="fullName"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.fullName}
              touched={touched.fullName}
              required
              placeholder="e.g. Tuan Ho Anh"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              required
              placeholder="e.g. tuanha@company.com"
            />
            <FormField
              label="Role"
              name="role"
              value={values.role}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.role}
              touched={touched.role}
              required
              placeholder="e.g. Senior Developer"
            />
            <FormField
              label="Department"
              name="department"
              value={values.department}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.department}
              touched={touched.department}
              required
              placeholder="e.g. FSOFT-Q1"
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={() => navigate('/employees')} style={styles.cancelBtn}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitBtn,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Employee'
                  : 'Create Employee'}
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
