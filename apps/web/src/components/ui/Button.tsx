import { ButtonHTMLAttributes, ReactNode } from "react";

export enum ButtonVariant {
  Primary = "primary",
  Secondary = "secondary",
  Outline = "outline",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = ButtonVariant.Primary, className = "", children, ...props }: ButtonProps) {
  const baseClass = "btn";
  const variantClass = `btn-${variant}`;
  const combinedClass = `${baseClass} ${variantClass} ${className}`.trim();

  return (
    <button className={combinedClass} {...props}>
      {children}
    </button>
  );
}
