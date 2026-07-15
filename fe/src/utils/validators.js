/**
 * Validation rules matching BE Jakarta Validation
 */
export const VALIDATION_RULES = {
  employeeCode: {
    required: true,
    pattern: /^[A-Z0-9]{3,20}$/,
    message: 'Employee code must be 3-20 uppercase alphanumeric characters',
  },
  fullName: {
    required: true,
    message: 'Full name is required',
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
  },
  role: {
    required: true,
    message: 'Role is required',
  },
  department: {
    required: true,
    message: 'Department is required',
  },
  projectCode: {
    required: true,
    message: 'Project code is required',
  },
  projectName: {
    required: true,
    message: 'Project name is required',
  },
  customer: {
    required: true,
    message: 'Customer is required',
  },
  status: {
    required: true,
    message: 'Status is required',
  },
  startDate: {
    required: true,
    message: 'Start date is required',
  },
  allocationPercent: {
    required: true,
    min: 1,
    max: 100,
    message: 'Allocation must be between 1% and 100%',
  },
  employeeId: {
    required: true,
    message: 'Employee is required',
  },
  projectId: {
    required: true,
    message: 'Project is required',
  },
};

/**
 * Validate a single field
 */
export function validateField(name, value, extraRules = {}) {
  const rules = { ...VALIDATION_RULES[name], ...extraRules };

  if (!rules) return null;

  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return rules.message || `${name} is required`;
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return rules.message || `Invalid format`;
  }

  if (value != null && rules.min != null && Number(value) < rules.min) {
    return rules.message || `Minimum value is ${rules.min}`;
  }

  if (value != null && rules.max != null && Number(value) > rules.max) {
    return rules.message || `Maximum value is ${rules.max}`;
  }

  return null;
}

/**
 * Validate entire form data against rules
 */
export function validateForm(formData, fieldRules) {
  const errors = {};

  for (const [field, rules] of Object.entries(fieldRules)) {
    const error = validateField(field, formData[field], rules);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Check if endDate >= startDate
 */
export function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return true;
  return new Date(endDate) >= new Date(startDate);
}
