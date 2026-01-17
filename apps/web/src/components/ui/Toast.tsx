import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "var(--color-secondary)"
      : type === "error"
        ? "var(--color-danger)"
        : "var(--color-primary)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        background: bgColor,
        color: "white",
        padding: "1rem 1.5rem",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        zIndex: 1000,
        minWidth: "300px",
        maxWidth: "500px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "1.25rem",
            padding: 0,
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
