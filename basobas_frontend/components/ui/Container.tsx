import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type ContainerSize = "sm" | "md" | "lg";

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  /** sm = forms (560px), md = detail pages (880px), lg = dashboards (1200px). */
  size?: ContainerSize;
};

const sizeClass: Record<ContainerSize, string> = {
  sm: styles.containerSm,
  md: styles.containerMd,
  lg: styles.containerLg,
};

/**
 * Centered, responsive page/section wrapper with consistent max-width and gutters.
 */
export function Container({ size = "lg", className, children, ...props }: ContainerProps) {
  return (
    <div className={cx(styles.container, sizeClass[size], className)} {...props}>
      {children}
    </div>
  );
}

export default Container;
