import React from 'react';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  placeholder,
  disabled,
  children,
  helpText,
  ...rest
}) {
  const showError = touched && error;
  const inputId = `field-${name}`;

  const inputStyles = {
    ...styles.input,
    borderColor: showError ? 'var(--color-danger)' : 'var(--color-border)',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div style={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} style={styles.label}>
          {label}
          {required && <span style={styles.required}> *</span>}
        </label>
      )}

      {children ? (
        children
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{ ...inputStyles, ...styles.textarea, ...rest.style }}
          rows={rest.rows || 3}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          style={inputStyles}
        >
          {rest.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyles}
        />
      )}

      {showError && <p style={styles.error}>{error}</p>}
      {helpText && !showError && <p style={styles.help}>{helpText}</p>}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  required: {
    color: 'var(--color-danger)',
  },
  input: {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    width: '100%',
  },
  textarea: {
    resize: 'vertical',
    minHeight: 80,
  },
  error: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-danger)',
    marginTop: 2,
  },
  help: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    marginTop: 2,
  },
};
