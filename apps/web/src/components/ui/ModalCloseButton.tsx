"use client";

interface ModalCloseButtonProps {
  onClose: () => void;
}

export function ModalCloseButton({ onClose }: ModalCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        background: "none",
        border: "none",
        color: "var(--color-text-muted)",
        fontSize: "1.5rem",
        cursor: "pointer",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        transition: "all 0.2s",
        zIndex: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-surface-elevated)";
        e.currentTarget.style.color = "var(--color-text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--color-text-muted)";
      }}
    >
      ×
    </button>
  );
}
