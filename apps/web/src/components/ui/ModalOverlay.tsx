"use client";

import { ReactNode } from "react";

interface ModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function ModalOverlay({ onClose, children, className = "" }: ModalOverlayProps) {
  return (
    <div
      className={`modal-overlay ${className}`.trim()}
      onClick={onClose}
    >
      {children}
    </div>
  );
}
