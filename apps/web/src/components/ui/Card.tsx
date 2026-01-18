import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  const combinedClass = `card ${className}`.trim();

  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  const combinedClass = `card-header ${className}`.trim();

  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className = "", children, ...props }: CardTitleProps) {
  const combinedClass = `card-title ${className}`.trim();

  return (
    <h2 className={combinedClass} {...props}>
      {children}
    </h2>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardBody({ className = "", children, ...props }: CardBodyProps) {
  const combinedClass = `card-body ${className}`.trim();

  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  const combinedClass = `card-footer ${className}`.trim();

  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}
