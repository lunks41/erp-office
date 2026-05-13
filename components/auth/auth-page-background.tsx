"use client"

import { motion, useReducedMotion } from "framer-motion"

export function AuthPageBackground() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* Deep dark base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at 18% 18%, #0a1628 0%, #050a14 55%, #020610 100%)",
        }}
      />

      {/* Ambient orb 1 — emerald, top-left */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: "-15%",
          top: "-10%",
          width: "clamp(380px, 42vw, 680px)",
          height: "clamp(380px, 42vw, 680px)",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.18, 1], x: [0, 28, 0], opacity: [0.7, 1, 0.7] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ambient orb 2 — indigo, bottom-right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          right: "-12%",
          bottom: "-18%",
          width: "clamp(480px, 52vw, 780px)",
          height: "clamp(480px, 52vw, 780px)",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.12, 1], y: [0, -32, 0], opacity: [0.6, 0.95, 0.6] }
        }
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Ambient orb 3 — cyan, center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: "36%",
          top: "28%",
          width: "clamp(280px, 28vw, 460px)",
          height: "clamp(280px, 28vw, 460px)",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.16,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
    </div>
  )
}
