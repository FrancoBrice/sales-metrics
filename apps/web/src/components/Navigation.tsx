"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/leads", label: "Leads" },
    { href: "/customers", label: "Clientes" },
    { href: "/industries", label: "Industrias" },
    { href: "/flujo-conversion", label: "Flujo de Conversión" },
    { href: "/pain-points", label: "Pain Points" },
  ];

  return (
    <nav className="nav-tabs">
      <div className="container" style={{ paddingBottom: 0, borderBottom: "none" }}>
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
