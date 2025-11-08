import React, { useState } from "react";
import "../assets/Styles/Style.css";

const InputField = ({
  label,
  type,
  id,
  name,
  placeholder,
  value,
  onChange,
  className,
  style,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`mb-3 ${className}`} style={style}>
      <label htmlFor={id} className="form-label d-block">
        {label}
      </label>

      {/* wrapper for relative positioning */}
      <div className="position-relative">
        <input
          type={showPassword && type === "password" ? "text" : type}
          id={id}
          name={name}
          placeholder={placeholder}
          className={`form-control pe-5 ${error ? "is-invalid" : ""} ${className}`}
          value={value}
          onChange={onChange}
        />

        {/* eye icon inside input */}
        {type === "password" && (
          <span
            className="toggle-eye"
            onClick={togglePassword}
          >
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
          </span>
        )}
      </div>

      {error && (
        <div className="text-danger mt-1" style={{ textAlign: "left" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default InputField;
