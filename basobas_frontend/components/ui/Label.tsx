import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

/**
 * Form label. Pair with an input via htmlFor/id for accessibility.
 */
export function Label({ required = false, className, children, ...props }: LabelProps) {
  return (
    <label className={cx(styles.label, required && styles.labelRequired, className)} {...props}>
      {children}
    </label>
  );
}

export default Label;
