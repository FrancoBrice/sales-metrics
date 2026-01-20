"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/leads", label: "Leads" },
    { href: "/customers", label: "Clientes" },
    { href: "/sellers", label: "Vendedores" },
    { href: "/opportunities", label: "Oportunidades" },
    { href: "/win-probability", label: "Probabilidad de Cierre" },
    { href: "/sales-funnel", label: "Análisis de Cierres" },
    { href: "/industries", label: "Industrias" },
    { href: "/conversion-flow", label: "Flujo de Conversión" },
    { href: "/pain-points", label: "Pain Points" },
  ];

  return (
    <nav className="nav-tabs">
      <div className="container">
        <div className="tabs-list">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`tab-link ${pathname === link.href ? "active" : ""}`}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
