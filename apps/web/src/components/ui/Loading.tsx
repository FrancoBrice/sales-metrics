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

export function EmptyStateWithType({ type, className = "" }: { type: string; className?: string }) {
  const getEmptyStateContent = (type: string) => {
    switch (type) {
      case "conversion-flow":
        return {
          title: "No hay datos de conversión",
          message: "Aún no hay datos disponibles para mostrar el flujo de conversión"
        };
      case "volume-analysis":
        return {
          title: "No hay datos de volumen",
          message: "Aún no hay datos disponibles para mostrar el análisis de volumen"
        };
      case "customers":
        return {
          title: "No se encontraron clientes",
          message: "Intenta ajustar los filtros de búsqueda"
        };
      case "leads":
        return {
          title: "No hay datos disponibles",
          message: "Intenta ajustar los filtros de búsqueda"
        };
      case "opportunities":
        return {
          title: "No hay datos disponibles",
          message: "No hay datos disponibles para la matriz de oportunidades"
        };
      case "win-probability":
        return {
          title: "No hay datos disponibles",
          message: "No hay datos disponibles para el análisis de probabilidad"
        };
      case "industries":
        return {
          title: "No hay datos disponibles",
          message: "No hay datos disponibles para el heatmap"
        };
      case "pain-points":
        return {
          title: "No hay datos disponibles",
          message: "No hay datos de Pain Points disponibles"
        };
      case "sellers":
        return {
          title: "No hay datos disponibles",
          message: "No hay métricas de vendedores disponibles"
        };
      case "dashboard":
        return {
          title: "No hay datos disponibles",
          message: "Importa un archivo CSV para comenzar"
        };
      default:
        return {
          title: "No hay datos disponibles",
          message: "Intenta ajustar los filtros o importa más datos"
        };
    }
  };

  const content = getEmptyStateContent(type);

  return (
    <div className={`empty-state ${className}`.trim()}>
      <h3>{content.title}</h3>
      <p>{content.message}</p>
    </div>
  );
}
