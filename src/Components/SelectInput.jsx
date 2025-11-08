import React from 'react';

const SelectInput = ({
  id,
  label,
  note,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required,
  options = [],
  disabled = false
}) => {
  return (
    <div className="form-group mb-3">
      {label && (
        <label htmlFor={id} className="form-label fw-semibold">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      
      {note && (
        <small className="form-text text-muted">{note}</small>
      )}
      
      <select
        id={id}
        className={`form-select rounded-0 ${error ? 'is-invalid' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
};

export default SelectInput;