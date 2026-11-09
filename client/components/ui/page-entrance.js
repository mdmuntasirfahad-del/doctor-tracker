"use client";

import { motion, useReducedMotion } from "motion/react";

export function PageEntrance({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
