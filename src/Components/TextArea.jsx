export default function TextArea({
  id,
  label,
  note,
  value,
  onChange,
  onBlur, // Add this line
  rows = 4,
  placeholder = "",
  required = false,
  error,
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        <span className="fw-bold">{label}</span> <span><i>{note}</i></span> {required && <span className="text-danger">*</span>}
      </label>
      <textarea
        id={id}
        className={`form-control rounded-0 ${error ? 'is-invalid' : ''}`}
        rows={rows}
        value={value || ''}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur} // Add this line - connect onBlur to the textarea
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}