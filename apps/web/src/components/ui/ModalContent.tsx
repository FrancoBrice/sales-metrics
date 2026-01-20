"use client";

import { ReactNode, MouseEvent } from "react";

interface ModalContentProps {
  children: ReactNode;
  size?: "default" | "large";
  onClick?: (e: MouseEvent) => void;
}

export function ModalContent({ children, size = "default", onClick }: ModalContentProps) {
  const sizeClass = size === "large" ? "modal-content-large" : "";

  return (
    <div
      className={`card modal-content ${sizeClass}`.trim()}
      onClick={onClick}
      style={{ position: "relative" }}
    >
      {children}
    </div>
  );
}
