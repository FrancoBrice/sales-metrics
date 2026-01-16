"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters, CustomerWithExtraction, PaginatedResponse } from "@/lib/api";
import { Filters } from "@/components/Filters";
import { CustomersTable } from "@/components/CustomersTable";
import { Pagination } from "@/components/Pagination";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithExtraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 30,
  });

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch (error) {
      console.error("Failed to load sellers:", error);
    }
  }

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await api.customers.list(filters);

      // Handle both array and paginated response for backward compatibility during dev
      if ("data" in response && "meta" in response) {
        setCustomers(response.data);
        setTotalPages(response.meta.totalPages);
      } else if (Array.isArray(response)) {
        setCustomers(response);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (newFilters: CustomerFilters) => {
    setFilters({ ...newFilters, page: 1, limit: 30 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Cartera de Clientes</h1>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={handleFilterChange}
        variant="list"
      />

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <CustomersTable customers={customers} />

          {customers.length === 0 ? (
            <div className="empty-state">
              <h3>No se encontraron clientes</h3>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <Pagination
              page={filters.page || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
