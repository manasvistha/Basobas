"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared page-load animation used across the whole app so every route enters
 * with the same premium fade + slide-up motion as the landing page.
 * Purely presentational — wraps children, changes no behaviour.
 */
export default function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
