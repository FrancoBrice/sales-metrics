interface ProgressSnackbarProps {
  message: string;
  progress: number;
  total?: number;
  onClose?: () => void;
}

export function ProgressSnackbar({ message, progress, total, onClose }: ProgressSnackbarProps) {
  let percentage = 0;
  if (total && total > 0 && typeof progress === 'number' && !isNaN(progress)) {
    percentage = Math.max(0, Math.min((progress / total) * 100, 100));
  }

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
          style={{
            width: `${isNaN(percentage) ? 0 : Math.max(0, Math.min(percentage, 100))}%`
          }}
        />
      </div>
    </div>
  );
}
