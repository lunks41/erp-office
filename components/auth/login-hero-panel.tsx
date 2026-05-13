"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  Activity,
  BarChart2,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  Layers,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react"

import { LoginAccountingIllustration } from "@/components/auth/login-accounting-illustration"

const modules = [
  { icon: BarChart2, label: "General Ledger" },
  { icon: FileText, label: "Accounts Payable" },
  { icon: DollarSign, label: "AR & Collections" },
  { icon: Globe, label: "Multi-currency" },
  { icon: Shield, label: "Audit Trail" },
  { icon: Zap, label: "AI Automation" },
  { icon: Activity, label: "Analytics" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
}

export function LoginHeroPanel({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(148deg, #060f25 0%, #04102a 45%, #050d22 100%)",
      }}
    >
      {/* Colour tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(148deg, rgba(16,185,129,0.07) 0%, rgba(6,182,212,0.04) 45%, rgba(99,102,241,0.07) 100%)",
        }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Right-edge separator */}
      <div
        className="absolute top-0 right-0 h-full w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(16,185,129,0.18) 35%, rgba(6,182,212,0.12) 65%, transparent 100%)",
        }}
      />

      {/* Ambient glow 1 — always in DOM, animation disabled when reduced */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: "8%",
          left: "12%",
          width: 340,
          height: 340,
          background:
            "radial-gradient(circle, rgba(16,185,129,0.11) 0%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.22, 1], opacity: [0.5, 0.85, 0.5] }
        }
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ambient glow 2 — always in DOM */}
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: "22%",
          right: "8%",
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.16, 1], opacity: [0.4, 0.75, 0.4] }
        }
        transition={{
          duration: 17,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-14 xl:py-12">
        {/* Brand mark */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(16,185,129,0.14)",
              border: "1px solid rgba(16,185,129,0.28)",
            }}
          >
            <Layers className="h-5 w-5" style={{ color: "#10b981" }} />
          </div>
          <div>
            <p
              className="text-base font-semibold leading-none"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              ERP Office
            </p>
            <p
              className="mt-0.5 text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Enterprise Finance Suite
            </p>
          </div>
        </motion.div>

        {/* Illustration + floating cards */}
        <div className="relative flex flex-1 items-center justify-center py-6 xl:py-8">
          <motion.div
            className="w-full max-w-[520px]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <LoginAccountingIllustration />
          </motion.div>

          {/* ── Floating card: Revenue (left) ── always rendered ── */}
          <motion.div
            className="absolute top-[22%] left-0"
            initial={reduceMotion ? false : { opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.5, delay: 0.55 },
              x: { duration: 0.55, delay: 0.55, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="rounded-2xl px-4 py-3"
              style={{
                background: "rgba(8,22,50,0.78)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(16,185,129,0.22)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(16,185,129,0.08)",
              }}
            >
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Monthly Revenue
              </p>
              <p className="mt-0.5 text-xl font-bold" style={{ color: "#fff" }}>
                $2.47M
              </p>
              <div className="mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" style={{ color: "#10b981" }} />
                <span className="text-xs font-medium" style={{ color: "#10b981" }}>
                  +12.5% vs last month
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Floating card: Invoice (top right) ── always rendered ── */}
          <motion.div
            className="absolute top-[8%] right-0"
            initial={reduceMotion ? false : { opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.5, delay: 0.7 },
              x: { duration: 0.55, delay: 0.7, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="rounded-2xl px-4 py-3"
              style={{
                background: "rgba(8,22,50,0.78)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(6,182,212,0.2)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(6,182,212,0.07)",
                minWidth: 182,
              }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#10b981" }}
                  animate={reduceMotion ? undefined : { opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Invoice Processed
                </p>
              </div>
              <p className="mt-1 text-sm font-semibold" style={{ color: "#fff" }}>
                INV-2025-0891
              </p>
              <p className="text-xs font-medium" style={{ color: "#06b6d4" }}>
                $45,200.00 · Approved
              </p>
            </motion.div>
          </motion.div>

          {/* ── Floating card: AI badge (lower right) ── always rendered ── */}
          <motion.div
            className="absolute right-2 bottom-[20%]"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.5, delay: 0.9 },
              y: { duration: 0.55, delay: 0.9, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="rounded-2xl px-4 py-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.16) 100%)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(139,92,246,0.28)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.38)",
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: "#a78bfa" }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  AI Reconciliation
                </span>
              </div>
              <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                342 entries auto-matched
              </p>
            </motion.div>
          </motion.div>

          {/* ── Floating pill: Payroll (bottom left) ── always rendered ── */}
          <motion.div
            className="absolute left-4 bottom-[14%]"
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.5, delay: 1.1 },
              x: { duration: 0.55, delay: 1.1, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="flex items-center gap-2 rounded-full px-3 py-2"
              style={{
                background: "rgba(8,22,50,0.72)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(16,185,129,0.22)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
              }}
            >
              <CheckCircle2
                className="h-4 w-4 shrink-0"
                style={{ color: "#10b981" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                Payroll Processed
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Headline + subtext + chips */}
        <motion.div
          className="mt-auto"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold leading-[1.18] tracking-tight xl:text-[2.35rem]"
            style={{ color: "#fff" }}
          >
            Manage Your Business
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, #10b981 0%, #06b6d4 55%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Finance Smarter
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-[420px] text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.48)" }}
          >
            Modern ERP platform for Accounting, Inventory, HRMS &amp; Operations.
          </motion.p>

          {/* Module chips */}
          <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2">
            {modules.map(({ icon: Icon, label }) => (
              <motion.div
                key={label}
                className="flex cursor-default items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                style={{
                  background: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.55)",
                }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        scale: 1.06,
                        backgroundColor: "rgba(16,185,129,0.1)",
                        borderColor: "rgba(16,185,129,0.28)",
                        color: "rgba(255,255,255,0.88)",
                      }
                }
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-3 w-3" />
                {label}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
