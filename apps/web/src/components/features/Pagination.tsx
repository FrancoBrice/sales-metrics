"use client";

import { Button, ButtonVariant } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <Button
        variant={ButtonVariant.Secondary}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </Button>
      <span className="pagination-info">
        Página {page} de {totalPages}
      </span>
      <Button
        variant={ButtonVariant.Secondary}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Siguiente
      </Button>
    </div>
  );
}
