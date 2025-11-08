export default function RadioGroup({
  name,
  label,
  note,
  options,
  value,
  onChange,
  onBlur,
  inline = true,
  required = false,
  error,
}) {
  return (
    <div className="mb-3">
      <div className="form-label">
        <span className="fw-bold">{label}</span> <span><i>{note}</i></span>{" "}
        {required && <span className="text-danger">*</span>}
      </div>
      <div className="d-flex gap-3" onBlur={onBlur}>
        {options.map((opt) => (
          <div
            className={`form-check ${inline ? "form-check-inline" : ""}`}
            key={opt.value}
          >
            <input
              className={`form-check-input ${error ? 'is-invalid' : ''}`}
              type="radio"
              name={name}
              id={`${name}-${opt.value}`}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              required={required}
            />
            <label
              className="form-check-label"
              htmlFor={`${name}-${opt.value}`}
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}