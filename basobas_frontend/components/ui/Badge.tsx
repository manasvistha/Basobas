import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: styles.badgeNeutral,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  info: styles.badgeInfo,
};

/**
 * Small status pill. Map domain statuses to a tone (e.g. approved -> success).
 */
export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span className={cx(styles.badge, toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}

export default Badge;
