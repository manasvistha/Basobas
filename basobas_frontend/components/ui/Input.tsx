import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Text input. forwardRef so react-hook-form's `register()` (which needs a ref)
 * works via `<Input {...register("field")} />` with zero logic changes.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(styles.input, invalid && styles.inputInvalid, className)}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
