interface LoadingProps {
  className?: string;
}

export function Loading({ className = "" }: LoadingProps) {
  return (
    <div className={`loading ${className}`.trim()}>
      <div className="spinner"></div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  className?: string;
}

export function EmptyState({ title, message, className = "" }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
