import { HTMLAttributes, ReactNode } from "react";

export enum BadgeVariant {
  Success = "success",
  Warning = "warning",
  Danger = "danger",
  Info = "info",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, className = "", children, ...props }: BadgeProps) {
  const baseClass = "badge";
  const variantClass = `badge-${variant}`;
  const combinedClass = `${baseClass} ${variantClass} ${className}`.trim();

  return (
    <span className={combinedClass} {...props}>
      {children}
    </span>
  );
}

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Tag({ className = "", children, ...props }: TagProps) {
  const combinedClass = `tag ${className}`.trim();

  return (
    <span className={combinedClass} {...props}>
      {children}
    </span>
  );
}
