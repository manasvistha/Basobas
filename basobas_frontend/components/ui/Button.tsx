import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.btnPrimary,
  secondary: styles.btnSecondary,
  ghost: styles.btnGhost,
  danger: styles.btnDanger,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.btnSm,
  md: styles.btnMd,
  lg: styles.btnLg,
};

/**
 * Primary UI button. Visual-only — pass onClick/type/disabled etc. through as usual.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth = false, className, type = "button", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          styles.btn,
          variantClass[variant],
          sizeClass[size],
          fullWidth && styles.btnFull,
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
