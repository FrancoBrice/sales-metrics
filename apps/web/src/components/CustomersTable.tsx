"use client";

import { CustomerWithExtraction } from "@/lib/api";
import {
  LeadSourceLabels,
  IndustryLabels,
  PainPointsLabels,
  VolumeUnitLabels,
  LeadSource,
  Industry,
  PainPoints,
  VolumeUnit,
} from "@vambe/shared";

interface CustomersTableProps {
  customers: CustomerWithExtraction[];
}

function getLabel<T extends string>(
  labels: Record<T, string>,
  value: string | null | undefined
): string {
  if (!value) return "-";
  return labels[value as T] || value;
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className="empty-state">
        <h3>No hay clientes</h3>
        <p>Importa un archivo CSV para comenzar</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Industria</th>
            <th>Fuente</th>
            <th>Volumen</th>
            <th>Pain Points</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <div>
                  <strong>{customer.name}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {customer.email}
                  </div>
                </div>
              </td>
              <td>{customer.seller}</td>
              <td>{customer.meetingDate}</td>
              <td>
                <span className={`badge ${customer.closed ? "badge-success" : "badge-warning"}`}>
                  {customer.closed ? "Cerrado" : "Abierto"}
                </span>
              </td>
              <td>
                {customer.extraction ? (
                  <span className="badge badge-info">
                    {getLabel(IndustryLabels, customer.extraction.industry)}
                  </span>
                ) : (
                  <span className="tag">Sin análisis</span>
                )}
              </td>
              <td>
                {customer.extraction?.leadSource ? (
                  getLabel(LeadSourceLabels, customer.extraction.leadSource)
                ) : (
                  "-"
                )}
              </td>
              <td>
                {customer.extraction?.volume?.quantity ? (
                  <>
                    {customer.extraction.volume.quantity}{" "}
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {getLabel(VolumeUnitLabels, customer.extraction.volume.unit)}
                    </span>
                    {customer.extraction.volume.isPeak && (
                      <span className="badge badge-warning" style={{ marginLeft: "0.5rem" }}>
                        Pico
                      </span>
                    )}
                  </>
                ) : (
                  "-"
                )}
              </td>
              <td>
                <div className="tag-list">
                  {customer.extraction?.painPoints?.slice(0, 2).map((pp) => (
                    <span key={pp} className="tag">
                      {getLabel(PainPointsLabels, pp)}
                    </span>
                  ))}
                  {(customer.extraction?.painPoints?.length || 0) > 2 && (
                    <span className="tag">+{customer.extraction!.painPoints.length - 2}</span>
                  )}
                  {(!customer.extraction?.painPoints || customer.extraction.painPoints.length === 0) && "-"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
