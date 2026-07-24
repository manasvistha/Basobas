"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./site-chrome.module.css";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/login" },
  { label: "Pricing", href: "/login" },
  { label: "About", href: "/login" },
];

/**
 * Premium glass navigation bar. Sticky, blurs + shrinks on scroll.
 * Routes are unchanged from the original navbar.
 */
export default function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}
    >
      <div className={styles.navInner}>
        <Link href="/" className={styles.logo} aria-label="BasoBas home">
          <span className={styles.logoChip}>
            <Image src="/basobas.png" alt="BasoBas" width={150} height={52} priority style={{ height: "auto", width: "auto", maxHeight: 46 }} />
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className={styles.navLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.ghostBtn}>Log in</Link>
          <Link href="/register" className={styles.primaryBtn}>Get started</Link>
          <button
            className={styles.menuBtn}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={styles.mobileMenu}
        >
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className={styles.mobileLink}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className={styles.mobileLink}>Log in</Link>
          <Link href="/register" onClick={() => setOpen(false)} className={styles.primaryBtn} style={{ textAlign: "center" }}>Get started</Link>
        </motion.div>
      )}
    </motion.header>
  );
}
