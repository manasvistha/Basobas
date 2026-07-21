import Link from "next/link";
import styles from "./ui.module.css";

type BackPillLinkProps = {
  href: string;
  label: string;
};

export default function BackPillLink({ href, label }: BackPillLinkProps) {
  return (
    <Link href={href} className={styles.backLink}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 5L8 12L15 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
