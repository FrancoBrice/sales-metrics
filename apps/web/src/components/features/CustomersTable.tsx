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
import { Badge, BadgeVariant, Tag } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Loading";

interface CustomersTableProps {
  customers: CustomerWithExtraction[];
  onCustomerClick?: (customerId: string) => void;
}

function getLabel<T extends string>(
  labels: Record<T, string>,
  value: string | null | undefined
): string {
  if (!value) return "-";
  return labels[value as T] || value;
}

export function CustomersTable({ customers, onCustomerClick }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No hay clientes"
        message="Importa un archivo CSV para comenzar"
      />
    );
  }

  const rowClass = onCustomerClick ? "clickable" : "";

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
            <tr
              key={customer.id}
              className={rowClass}
              onClick={() => onCustomerClick?.(customer.id)}
            >
              <td>
                <div>
                  <strong>{customer.name}</strong>
                  <div className="table-cell-secondary">
                    {customer.email}
                  </div>
                </div>
              </td>
              <td>{customer.seller}</td>
              <td>{customer.meetingDate}</td>
              <td>
                <Badge variant={customer.closed ? BadgeVariant.Success : BadgeVariant.Danger}>
                  {customer.closed ? "Cerrada" : "Perdida"}
                </Badge>
              </td>
              <td>
                {customer.extraction ? (
                  <Badge variant={BadgeVariant.Info}>
                    {getLabel(IndustryLabels, customer.extraction.industry)}
                  </Badge>
                ) : (
                  <Tag>Sin análisis</Tag>
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
                    <span className="table-cell-secondary">
                      {getLabel(VolumeUnitLabels, customer.extraction.volume.unit)}
                    </span>
                    {customer.extraction.volume.isPeak && (
                      <Badge variant={BadgeVariant.Warning} style={{ marginLeft: "0.5rem" }}>
                        Peak
                      </Badge>
                    )}
                  </>
                ) : (
                  "-"
                )}
              </td>
              <td>
                <div className="tag-list">
                  {customer.extraction?.painPoints?.slice(0, 2).map((pp) => (
                    <Tag key={pp}>
                      {getLabel(PainPointsLabels, pp)}
                    </Tag>
                  ))}
                  {(customer.extraction?.painPoints?.length || 0) > 2 && (
                    <Tag>+{customer.extraction!.painPoints.length - 2}</Tag>
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
