import React from "react";
import "../assets/Styles/Style.css";

const FileInputField = ({ label, id, name, onChange, className, style }) => {
  return (
    <div className={`mb-3 row ${className}`} style={style}>
      <label htmlFor={id} className="form-label text-start d-block">
        {label}
      </label>
      <input
        type="file"
        id={id}
        name={name}
        className="form-control"
        onChange={onChange}
      />
    </div>
  );
};

export default FileInputField;