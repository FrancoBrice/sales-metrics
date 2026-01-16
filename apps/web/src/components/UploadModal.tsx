"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Por favor selecciona un archivo CSV");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const uploadResult = await api.ingest.uploadCsv(file);
      setResult(uploadResult);

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: "1rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h2 className="card-title">Importar CSV</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {result ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1rem",
              }}
            >
              ✅
            </div>
            <h3 style={{ marginBottom: "0.5rem" }}>Importación Exitosa</h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              {result.created} clientes creados
            </p>
            {result.errors.length > 0 && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "left",
                }}
              >
                <strong style={{ color: "var(--color-danger)" }}>
                  {result.errors.length} errores:
                </strong>
                <ul style={{ margin: "0.5rem 0 0 1rem", fontSize: "0.875rem" }}>
                  {result.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "3rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-primary)";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-border)";
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile?.name.endsWith(".csv")) {
                  setFile(droppedFile);
                  setError(null);
                } else {
                  setError("Por favor selecciona un archivo CSV");
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
              {file ? (
                <p>
                  <strong>{file.name}</strong>
                  <br />
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </p>
              ) : (
                <p style={{ color: "var(--color-text-muted)" }}>
                  Arrastra un archivo CSV o haz clic para seleccionar
                </p>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-danger)",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? "Subiendo..." : "Importar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
