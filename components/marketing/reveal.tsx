"use client";

import { motion } from "framer-motion";

/**
 * Gentle scroll-in for content blocks. Content is rendered in the HTML
 * (never hidden when JS is unavailable beyond the first paint) and MotionConfig
 * disables the movement for people who prefer reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
