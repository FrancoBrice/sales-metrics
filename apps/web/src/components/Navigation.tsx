"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MdMenu, MdClose } from "react-icons/md";
import { SparkleIcon } from "./ui/SparkleIcon";

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/leads", label: "Leads" },
    { href: "/customers", label: "Clientes" },
    { href: "/sellers", label: "Vendedores" },
    { href: "/opportunities", label: "Oportunidades" },
    { href: "/win-probability", label: "Probabilidad" },
    { href: "/closure-analysis", label: "Análisis de Cierres", showSparkle: true },
    { href: "/industries", label: "Industrias" },
    { href: "/conversion-flow", label: "Flujo de Conversión" },
    { href: "/pain-points", label: "Pain Points" },
  ];

  return (
    <nav className="nav-container">
      <div className="nav-inner-container">
        <button
          className="nav-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>

        <div className={`nav-links-list ${isOpen ? "open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "nav-link-active" : "nav-link"}
            >
              <span className="nav-link-text">
                {link.label}
                {link.showSparkle && (
                  <span className="nav-sparkle-wrapper">
                    <SparkleIcon className="nav-sparkle-icon" />
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
