"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters, CustomerWithExtraction, PaginatedResponse } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { CustomersTable } from "@/components/features/CustomersTable";
import { Pagination } from "@/components/features/Pagination";
import { CustomerProfileModal } from "@/components/ui/CustomerProfileModal";
import { Loading, EmptyState } from "@/components/ui/Loading";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithExtraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 10,
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
    } catch {
      setSellers([]);
    }
  }

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await api.customers.list(filters);

      if ("data" in response && "meta" in response) {
        setCustomers(response.data);
        setTotalPages(response.meta.totalPages);
      } else if (Array.isArray(response)) {
        setCustomers(response);
        setTotalPages(1);
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (newFilters: CustomerFilters) => {
    setFilters({ ...newFilters, page: 1, limit: 10 });
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
        <Loading />
      ) : (
        <>
          <CustomersTable
            customers={customers}
            onCustomerClick={setSelectedCustomerId}
          />

          {customers.length === 0 ? (
            <EmptyState
              title="No se encontraron clientes"
              message="Intenta ajustar los filtros de búsqueda"
            />
          ) : (
            <Pagination
              page={filters.page || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {selectedCustomerId && (
        <CustomerProfileModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
