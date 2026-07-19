import Link from "next/link";

type BackPillLinkProps = {
  href: string;
  label: string;
};

export default function BackPillLink({ href, label }: BackPillLinkProps) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "#0b5e58",
        textDecoration: "none",
        fontSize: "0.82rem",
        letterSpacing: "0.01em",
        fontWeight: 700,
        borderRadius: 999,
        border: "1px solid rgba(15, 118, 110, 0.22)",
        background: "rgba(255, 255, 255, 0.65)",
        padding: "8px 12px",
        transition: "transform 0.18s ease, border-color 0.18s ease, background 0.18s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateX(-2px)";
        event.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.42)";
        event.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateX(0)";
        event.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.22)";
        event.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
      }}
    >
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
