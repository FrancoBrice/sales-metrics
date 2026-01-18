import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  const inputClass = `input ${className}`.trim();

  if (label) {
    return (
      <div className="input-group">
        <label className="input-label">{label}</label>
        <input className={inputClass} {...props} />
      </div>
    );
  }

  return <input className={inputClass} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className = "", children, ...props }: SelectProps) {
  const selectClass = `select ${className}`.trim();

  if (label) {
    return (
      <div className="input-group">
        <label className="input-label">{label}</label>
        <select className={selectClass} {...props}>
          {children}
        </select>
      </div>
    );
  }

  return (
    <select className={selectClass} {...props}>
      {children}
    </select>
  );
}
