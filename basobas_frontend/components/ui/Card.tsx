import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Adds hover lift/shadow — use for clickable cards (e.g. property tiles). */
  interactive?: boolean;
};

/**
 * Surface container: white card, soft border, subtle shadow, rounded corners.
 */
export function Card({ interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(styles.card, interactive && styles.cardInteractive, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
