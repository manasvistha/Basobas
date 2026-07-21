import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

/**
 * Multi-line text input. Shares the Input look; vertically resizable.
 * forwardRef so react-hook-form's register() works.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(styles.input, styles.textarea, invalid && styles.inputInvalid, className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
