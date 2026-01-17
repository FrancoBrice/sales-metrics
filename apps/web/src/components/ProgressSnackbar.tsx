interface ProgressSnackbarProps {
  message: string;
  progress: number;
  total?: number;
  onClose?: () => void;
}

export function ProgressSnackbar({ message, progress, total, onClose }: ProgressSnackbarProps) {
  const percentage = total ? Math.min((progress / total) * 100, 100) : progress;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
        padding: "1rem 1.5rem",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        zIndex: 1000,
        minWidth: "350px",
        maxWidth: "500px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
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
          )}
        </div>
        {total && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {progress} de {total} procesados
          </span>
        )}
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
            borderRadius: "var(--radius-sm)",
            transition: "width 0.3s ease-out",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
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
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
