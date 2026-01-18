"use client";

import { CustomerFilters } from "@/lib/api";
import { LeadSourceLabels, IndustryLabels } from "@vambe/shared";
import { Select } from "@/components/ui/Input";
import { Button, ButtonVariant } from "@/components/ui/Button";

interface FiltersProps {
  sellers: string[];
  filters: CustomerFilters;
  onChange: (filters: CustomerFilters) => void;
  variant?: "dashboard" | "list";
}

export function Filters({ sellers, filters, onChange, variant = "list" }: FiltersProps) {
  const handleChange = (key: keyof CustomerFilters, value: string | boolean | undefined) => {
    onChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  const handleClear = () => {
    onChange({});
  };

  return (
    <div className="filters-section">
      <div className="filter-group">
        <label className="filter-label">Vendedor</label>
        <Select
          className="filter-select"
          value={filters.seller || ""}
          onChange={(e) => handleChange("seller", e.target.value)}
        >
          <option value="">Todos</option>
          {sellers.map((seller) => (
            <option key={seller} value={seller}>
              {seller}
            </option>
          ))}
        </Select>
      </div>

      {variant === "list" && (
        <>
          <div className="filter-group">
            <label className="filter-label">Estado</label>
            <Select
              className="filter-select"
              value={filters.closed === undefined ? "" : filters.closed.toString()}
              onChange={(e) =>
                handleChange("closed", e.target.value === "" ? undefined : e.target.value === "true")
              }
            >
              <option value="">Todos</option>
              <option value="true">Cerrados</option>
              <option value="false">No cerrados</option>
            </Select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Fuente de Lead</label>
            <Select
              className="filter-select"
              value={filters.leadSource || ""}
              onChange={(e) => handleChange("leadSource", e.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(LeadSourceLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Industria</label>
            <Select
              className="filter-select"
              value={filters.industry || ""}
              onChange={(e) => handleChange("industry", e.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(IndustryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </>
      )}

      <div className="filter-group">
        <label className="filter-label">Desde</label>
        <input
          type="date"
          className="filter-input"
          value={filters.dateFrom || ""}
          onChange={(e) => handleChange("dateFrom", e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Hasta</label>
        <input
          type="date"
          className="filter-input"
          value={filters.dateTo || ""}
          onChange={(e) => handleChange("dateTo", e.target.value)}
        />
      </div>

      <div className="filter-group justify-end">
        <Button variant={ButtonVariant.Secondary} onClick={handleClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
