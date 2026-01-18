import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Modal, ModalFooter } from "./Modal";
import { Button, ButtonVariant } from "./Button";

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Por favor selecciona un archivo CSV");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Importar CSV">
      {result ? (
        <div className="modal-body" style={{ textAlign: "center", padding: "2rem" }}>
          <div className="modal-success-icon">✅</div>
          <h3 className="modal-success-title">Importación Exitosa</h3>
          <p className="modal-success-description">{result.created} clientes creados</p>
          {result.errors.length > 0 && (
            <div className="error-box">
              <strong className="error-box-title">{result.errors.length} errores:</strong>
              <ul className="error-list">
                {result.errors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="modal-body">
            <div
              className={`file-drop-zone ${isDragging ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div className="file-drop-zone-icon">📄</div>
              {file ? (
                <>
                  <p className="file-drop-zone-file-name">{file.name}</p>
                  <span className="file-drop-zone-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <p className="file-drop-zone-text">Arrastra un archivo CSV o haz clic para seleccionar</p>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <ModalFooter>
            <Button variant={ButtonVariant.Secondary} onClick={onClose}>
              Cancelar
            </Button>
            <Button variant={ButtonVariant.Primary} onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Subiendo..." : "Importar"}
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
