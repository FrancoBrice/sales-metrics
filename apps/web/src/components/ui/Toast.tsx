import { useEffect } from "react";

export enum ToastType {
  Info = "info",
  Success = "success",
  Error = "error",
}

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = ToastType.Info, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeClass = `toast-${type}`;

  return (
    <div className={`toast-container ${typeClass}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button className="btn-icon" onClick={onClose} type="button">
          ×
        </button>
      </div>
    </div>
  );
}
