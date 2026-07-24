"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * App-wide route transition. Next.js re-mounts `template.tsx` on every
 * navigation, so the fade + slide-in runs on each route change — smooth
 * navigation for the whole app without touching any route, data, or logic.
 *
 * The entrance is a CSS keyframe (not a Framer transform) on purpose: once it
 * finishes the element reverts to `transform: none`, so it never leaves a
 * lingering transform that would break `position: fixed`/`sticky` descendants
 * (e.g. the property detail booking bar and modals). Scroll resets to the top
 * so the new page starts clean with no jump.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div key={pathname} className="route-transition">
      {children}
    </div>
  );
}
