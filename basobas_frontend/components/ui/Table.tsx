import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

/**
 * Rounded, bordered table container. Use normal <thead>/<tbody>/<tr>/<th>/<td>
 * inside — header styling, row hover, and cell spacing come from the module.
 * Scrolls horizontally on narrow screens.
 */
export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={cx(styles.table, className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export default Table;
