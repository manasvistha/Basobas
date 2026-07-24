"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SiteNavbar from "@/components/site/SiteNavbar";
import SiteFooter from "@/components/site/SiteFooter";
import Reveal, { Stagger, StaggerItem } from "@/components/motion/Reveal";
import CountUp from "@/components/motion/CountUp";
import styles from "./landing.module.css";

const CATEGORIES = [
  { badge: "Popular", title: "Private Rooms", text: "Cozy, affordable single rooms near you.", img: "/room img.jpg" },
  { badge: "Trending", title: "Full Flats", text: "Entire apartments for families & sharers.", img: "/room img.jpg" },
  { badge: "New", title: "Find Roommates", text: "Match with verified, like-minded people.", img: "/room img.jpg" },
];

const FEATURES = [
  { title: "Verified listings", text: "Every property is reviewed so you rent with confidence.", icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { title: "Secure by design", text: "MFA, encryption and zero-trust auth protect your account.", icon: "M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" },
  { title: "Smart matching", text: "Filters and roommate matching find your ideal place fast.", icon: "M13 2L3 14h7v8l10-12h-7z" },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <SiteNavbar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.heroEyebrow}>
              <span className={styles.heroDot} /> Nepal&apos;s modern rental platform
            </span>
            <h1 className={styles.heroTitle}>
              Find your next <span className={styles.grad}>home</span><br />with BasoBas
            </h1>
            <p className={styles.heroSub}>
              Discover rooms, flats and roommates in seconds. List, search and rent — beautifully, securely, hassle-free.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/register" className={styles.ctaPrimary}>Get started free</Link>
              <Link href="/login" className={styles.ctaGhost}>Browse properties</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating search */}
      <div className={styles.searchWrap}>
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={styles.searchCard}
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Location</span>
            <input className={styles.searchInput} placeholder="City, area or landmark" />
          </label>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Type</span>
            <input className={styles.searchInput} placeholder="Room, flat, roommate" />
          </label>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Budget</span>
            <input className={styles.searchInput} placeholder="Max Rs / month" />
          </label>
          <Link href="/login" className={styles.searchBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
            Search
          </Link>
        </motion.form>
      </div>

      {/* Stats */}
      <section className={styles.section}>
        <Stagger className={styles.stats}>
          {[
            { n: 4800, s: "+", l: "Active listings" },
            { n: 12000, s: "+", l: "Happy renters" },
            { n: 96, s: "%", l: "Match success" },
            { n: 40, s: "+", l: "Cities covered" },
          ].map((st) => (
            <StaggerItem key={st.l} className={styles.statCard}>
              <div className={styles.statNum}><CountUp value={st.n} suffix={st.s} /></div>
              <div className={styles.statLabel}>{st.l}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Categories */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.introGrid}>
          <Reveal direction="right" className={styles.introText}>
            <span className={styles.kicker}>Explore</span>
            <h2 className={styles.sectionTitle}>Find exactly what you need</h2>
            <p className={styles.sectionText}>From a single room to an entire flat — browse curated categories built for every kind of renter.</p>
            <div className={styles.heroCtas} style={{ marginTop: 26 }}>
              <Link href="/login" className={styles.ctaPrimary} style={{ boxShadow: "0 14px 30px -14px rgba(37,99,235,0.6)" }}>Browse all listings</Link>
            </div>
          </Reveal>
          <Reveal direction="left" className={styles.introMedia}>
            <div className={styles.introImg} />
            <div className={styles.introImgShade} />
            <div className={styles.introFloat}>
              <span className={styles.introFloatIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M9 21V9h6v12" /></svg>
              </span>
              <div>
                <div className={styles.introFloatNum}>4,800+ homes</div>
                <div className={styles.introFloatLabel}>ready to move in</div>
              </div>
            </div>
          </Reveal>
        </div>
        <Stagger className={styles.cards} gap={0.14}>
          {CATEGORIES.map((c) => (
            <StaggerItem key={c.title}>
              <Link href="/login" className={styles.card}>
                <div className={styles.cardImg} style={{ backgroundImage: `url(${c.img})` }} />
                <div className={styles.cardShade} />
                <div className={styles.cardBody}>
                  <span className={styles.cardBadge}>{c.badge}</span>
                  <div className={styles.cardTitle}>{c.title}</div>
                  <div className={styles.cardText}>{c.text}</div>
                  <span className={styles.cardArrow}>Explore →</span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Features */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <Reveal className={styles.sectionHead}>
          <span className={styles.kicker}>Why BasoBas</span>
          <h2 className={styles.sectionTitle}>Renting, reimagined</h2>
          <p className={styles.sectionText}>A premium experience backed by real security and thoughtful design.</p>
        </Reveal>
        <Stagger className={styles.features} gap={0.12}>
          {FEATURES.map((f) => (
            <StaggerItem key={f.title} className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
              </div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureText}>{f.text}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* CTA band */}
      <div className={styles.ctaBand}>
        <Reveal direction="scale">
          <div className={styles.ctaInner}>
            <div className={styles.ctaGlow} />
            <div className={styles.ctaGlow2} />
            <h2 className={styles.ctaTitle}>Ready to find your place?</h2>
            <p className={styles.ctaText}>Join thousands of renters and landlords already using BasoBas.</p>
            <Link href="/register" className={styles.ctaBtn}>Create your free account</Link>
          </div>
        </Reveal>
      </div>

      <SiteFooter />
    </div>
  );
}
