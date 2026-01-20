interface ProgressSnackbarProps {
  message: string;
  progress: number;
  total?: number;
  onClose?: () => void;
}

export function ProgressSnackbar({ message, progress, total, onClose }: ProgressSnackbarProps) {
  const percentage = total ? Math.min((progress / total) * 100, 100) : progress;

  return (
    <div className="progress-snackbar">
      <div className="progress-snackbar-header">
        <span className="progress-snackbar-message">{message}</span>
        {onClose && (
          <button className="btn-icon" onClick={onClose} type="button">
            ×
          </button>
        )}
      </div>
      {total && (
        <div className="progress-snackbar-info">
          {progress} de {total} procesados
        </div>
      )}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ '--progress-width': `${percentage}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
