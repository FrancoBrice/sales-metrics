import { Navigation } from "@/components/Navigation";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vambe Sales Metrics | Dashboard de Ventas",
  description: "Panel interactivo para análisis de métricas de clientes y reuniones de ventas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="layout-wrapper">
          <Navigation />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
