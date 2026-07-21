import React from "react";
import styles from "./ui.module.css";
import { cx } from "./cx";
import BackPillLink from "./BackPillLink";

export type PageHeaderProps = {
  title: string;
  description?: string;
  /** Optional back link shown above the title. */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned action buttons. */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Large rounded header section used at the top of every page:
 * optional back link, large title, muted description, and an actions slot.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cx(styles.pageHeader, className)}>
      {backHref && (
        <div className={styles.pageHeaderBack}>
          <BackPillLink href={backHref} label={backLabel} />
        </div>
      )}
      <div className={styles.pageHeaderRow}>
        <div>
          <h1 className={styles.pageHeaderTitle}>{title}</h1>
          {description && <p className={styles.pageHeaderDesc}>{description}</p>}
        </div>
        {actions && <div className={styles.pageHeaderActions}>{actions}</div>}
      </div>
    </header>
  );
}

export default PageHeader;
