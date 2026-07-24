"use client";

import Link from "next/link";
import styles from "./site-chrome.module.css";

const COLUMNS = [
  { title: "Explore", links: [["Browse rooms", "/login"], ["List a property", "/login"], ["Pricing", "/login"], ["How it works", "/login"]] },
  { title: "Company", links: [["About us", "/login"], ["Careers", "/login"], ["Blog", "/login"], ["Contact", "/login"]] },
  { title: "Support", links: [["Help center", "/login"], ["Safety", "/login"], ["Terms", "/login"], ["Privacy", "/login"]] },
] as const;

function SocialIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGlow} aria-hidden="true" />
      <div className={styles.footerInner}>
        <div className={styles.newsletter}>
          <h3 className={styles.newsletterTitle}>Stay in the loop</h3>
          <p className={styles.newsletterText}>
            Get the newest listings and roommate matches delivered to your inbox.
          </p>
          <form
            className={styles.newsletterForm}
            onSubmit={(e) => e.preventDefault()}
          >
            <input type="email" placeholder="Enter your email" aria-label="Email" className={styles.newsletterInput} />
            <button type="submit" className={styles.primaryBtn}>Subscribe</button>
          </form>
        </div>

        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>BasoBas</span>
            <p className={styles.footerTagline}>
              Find rooms, flats, and roommates — the modern, hassle-free way.
            </p>
            <div className={styles.socials}>
              <a href="#" aria-label="Twitter" className={styles.socialLink}><SocialIcon path="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.3 11.3 0 0 1 3.1 4.6a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.7-.5a4 4 0 0 0 3.2 3.9c-.5.2-1.1.2-1.7.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.1a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1Z" /></a>
              <a href="#" aria-label="Instagram" className={styles.socialLink}><SocialIcon path="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1Zm0 3.2a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2Zm0 10.9a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Zm6.8-11.1a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></a>
              <a href="#" aria-label="LinkedIn" className={styles.socialLink}><SocialIcon path="M6.9 8.5H3.7V21h3.2V8.5ZM5.3 3.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM21 21h-3.2v-6.1c0-1.5 0-3.4-2-3.4s-2.4 1.6-2.4 3.3V21H10V8.5h3.1v1.7h.1c.4-.8 1.5-1.7 3-1.7 3.3 0 3.9 2.1 3.9 4.9V21Z" /></a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>{col.title}</h4>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className={styles.footerLink}>{label}</Link>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} BasoBas. All rights reserved.</span>
          <span>Made with care for renters &amp; roommates.</span>
        </div>
      </div>
    </footer>
  );
}
