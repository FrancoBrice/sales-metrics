import { AnchorHTMLAttributes, ReactNode } from "react";

interface LinkCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
  description: string;
  href: string;
}

export function LinkCard({ title, description, href, className = "", ...props }: LinkCardProps) {
  const combinedClass = `link-card ${className}`.trim();

  return (
    <a href={href} className={combinedClass} {...props}>
      <strong className="link-card-title">{title}</strong>
      <span className="link-card-description">{description}</span>
    </a>
  );
}

interface LinkCardGridProps {
  children: ReactNode;
  className?: string;
}

export function LinkCardGrid({ children, className = "" }: LinkCardGridProps) {
  const combinedClass = `link-card-grid ${className}`.trim();

  return <div className={combinedClass}>{children}</div>;
}
