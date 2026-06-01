import { cn } from "@/lib/utils"

export function LoginAccountingIllustration({
  className,
}: {
  className?: string
}) {
  const barGroups = [
    { x: 344, heights: [68, 44, 20] },
    { x: 378, heights: [84, 56, 30] },
    { x: 412, heights: [60, 40, 18] },
    { x: 446, heights: [92, 62, 32] },
    { x: 480, heights: [76, 50, 24] },
  ]

  const linePoints: [number, number][] = [
    [34, 224],
    [74, 210],
    [114, 218],
    [154, 196],
    [194, 184],
    [234, 162],
    [274, 146],
    [304, 136],
  ]

  const linePath =
    "M " + linePoints.map(([x, y]) => `${x} ${y}`).join(" L ")

  const areaPath = linePath + ` L 304 258 L 34 258 Z`

  return (
    <div
      className={cn("pointer-events-none select-none", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 520 374"
        className="h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="il-dash-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d1f3c" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#060f25" stopOpacity="0.96" />
          </linearGradient>

          <linearGradient id="il-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="il-bar-a" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="il-bar-b" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="il-bar-c" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.75" />
          </linearGradient>

          <clipPath id="il-line-clip">
            <rect x="22" y="128" width="298" height="135" />
          </clipPath>
        </defs>

        <rect
          x="8"
          y="8"
          width="504"
          height="358"
          rx="16"
          fill="url(#il-dash-bg)"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1"
        />

        <rect
          x="8"
          y="8"
          width="504"
          height="46"
          rx="16"
          fill="rgba(255,255,255,0.04)"
        />
        <rect x="8" y="38" width="504" height="16" fill="rgba(255,255,255,0.04)" />
        <line
          x1="8"
          y1="54"
          x2="512"
          y2="54"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />

        <circle cx="30" cy="31" r="5" fill="rgba(244,63,94,0.85)" />
        <circle cx="46" cy="31" r="5" fill="rgba(245,158,11,0.85)" />
        <circle cx="62" cy="31" r="5" fill="rgba(16,185,129,0.85)" />

        <rect x="80" y="26" width="88" height="10" rx="3" fill="rgba(255,255,255,0.4)" />

        <rect
          x="298"
          y="23"
          width="104"
          height="16"
          rx="8"
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <rect x="308" y="28" width="60" height="6" rx="2" fill="rgba(255,255,255,0.15)" />

        <rect
          x="416"
          y="23"
          width="46"
          height="16"
          rx="8"
          fill="rgba(16,185,129,0.12)"
          stroke="rgba(16,185,129,0.35)"
          strokeWidth="1"
        />
        <circle cx="425" cy="31" r="3.5" fill="#10b981" />
        <rect x="432" y="27" width="22" height="8" rx="2" fill="rgba(16,185,129,0.65)" />

        <rect
          x="16"
          y="62"
          width="152"
          height="58"
          rx="10"
          fill="rgba(16,185,129,0.07)"
          stroke="rgba(16,185,129,0.2)"
          strokeWidth="1"
        />
        <rect x="26" y="72" width="34" height="6" rx="2" fill="rgba(255,255,255,0.28)" />
        <rect x="26" y="84" width="62" height="10" rx="3" fill="rgba(255,255,255,0.72)" />
        <rect x="26" y="100" width="44" height="6" rx="2" fill="rgba(16,185,129,0.7)" />
        <polyline
          points="112,108 120,103 128,105 136,98 144,100 153,94"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeOpacity="0.65"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="178"
          y="62"
          width="150"
          height="58"
          rx="10"
          fill="rgba(6,182,212,0.07)"
          stroke="rgba(6,182,212,0.18)"
          strokeWidth="1"
        />
        <rect x="188" y="72" width="40" height="6" rx="2" fill="rgba(255,255,255,0.28)" />
        <rect x="188" y="84" width="56" height="10" rx="3" fill="rgba(255,255,255,0.72)" />
        <rect x="188" y="100" width="38" height="6" rx="2" fill="rgba(6,182,212,0.7)" />
        <polyline
          points="270,104 278,100 286,103 294,97 302,98 312,101"
          stroke="#06b6d4"
          strokeWidth="1.5"
          strokeOpacity="0.55"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="338"
          y="62"
          width="174"
          height="58"
          rx="10"
          fill="rgba(99,102,241,0.07)"
          stroke="rgba(99,102,241,0.2)"
          strokeWidth="1"
        />
        <rect x="348" y="72" width="30" height="6" rx="2" fill="rgba(255,255,255,0.28)" />
        <rect x="348" y="84" width="54" height="10" rx="3" fill="rgba(255,255,255,0.72)" />
        <rect x="348" y="100" width="48" height="6" rx="2" fill="rgba(99,102,241,0.7)" />
        <circle
          cx="487"
          cy="91"
          r="18"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="6"
        />
        <circle
          cx="487"
          cy="91"
          r="18"
          fill="none"
          stroke="#10b981"
          strokeWidth="6"
          strokeOpacity="0.8"
          strokeDasharray="72 41"
          strokeLinecap="round"
          style={{ transformOrigin: "487px 91px", transform: "rotate(-90deg)" }}
        />
        <circle
          cx="487"
          cy="91"
          r="18"
          fill="none"
          stroke="#6366f1"
          strokeWidth="6"
          strokeOpacity="0.65"
          strokeDasharray="28 85"
          strokeLinecap="round"
          style={{ transformOrigin: "487px 91px", transform: "rotate(100deg)" }}
        />

        <rect
          x="16"
          y="128"
          width="308"
          height="134"
          rx="10"
          fill="rgba(255,255,255,0.022)"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
        <rect x="26" y="138" width="56" height="8" rx="2.5" fill="rgba(255,255,255,0.38)" />
        <rect x="88" y="140" width="28" height="4" rx="1.5" fill="rgba(255,255,255,0.14)" />

        {[158, 178, 198, 218, 238, 258].map((y, i) => (
          <line
            key={i}
            x1="26"
            y1={y}
            x2="316"
            y2={y}
            stroke="rgba(255,255,255,0.055)"
            strokeWidth="1"
          />
        ))}

        {[
          ["3M", 160],
          ["2M", 200],
          ["1M", 240],
        ].map(([lbl, y]) => (
          <text
            key={String(lbl)}
            x="22"
            y={Number(y)}
            fontSize="7"
            fill="rgba(255,255,255,0.28)"
            textAnchor="end"
            fontFamily="system-ui"
          >
            {lbl}
          </text>
        ))}

        {["J", "F", "M", "A", "M", "J", "J", "A"].map((lbl, i) => (
          <text
            key={i}
            x={34 + i * 40}
            y="270"
            fontSize="7"
            fill="rgba(255,255,255,0.28)"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            {lbl}
          </text>
        ))}

        <path d={areaPath} fill="url(#il-area)" clipPath="url(#il-line-clip)" />

        <path
          d={linePath}
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          clipPath="url(#il-line-clip)"
        />

        {linePoints.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="3.5"
            fill="#10b981"
            stroke="#0d1f3c"
            strokeWidth="1.5"
          />
        ))}

        <rect
          x="278"
          y="126"
          width="50"
          height="22"
          rx="6"
          fill="rgba(16,185,129,0.18)"
          stroke="rgba(16,185,129,0.4)"
          strokeWidth="1"
        />
        <rect x="284" y="131" width="38" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="284" y="140" width="26" height="5" rx="1.5" fill="rgba(16,185,129,0.7)" />

        <rect
          x="332"
          y="128"
          width="180"
          height="134"
          rx="10"
          fill="rgba(255,255,255,0.022)"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
        <rect x="342" y="138" width="52" height="8" rx="2.5" fill="rgba(255,255,255,0.38)" />

        <line
          x1="340"
          y1="258"
          x2="506"
          y2="258"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {barGroups.map(({ x, heights }, gi) =>
          heights.map((h, bi) => {
            const gradIds = ["il-bar-a", "il-bar-b", "il-bar-c"]
            const xPos = x + bi * 10
            return (
              <rect
                key={`${gi}-${bi}`}
                x={xPos}
                y={258 - h}
                width={8}
                height={h}
                rx={2}
                fill={`url(#${gradIds[bi]})`}
              />
            )
          })
        )}

        <circle cx="343" cy="274" r="3" fill="#10b981" fillOpacity="0.8" />
        <rect x="349" y="271" width="18" height="5" rx="1.5" fill="rgba(255,255,255,0.28)" />
        <circle cx="374" cy="274" r="3" fill="#06b6d4" fillOpacity="0.8" />
        <rect x="380" y="271" width="22" height="5" rx="1.5" fill="rgba(255,255,255,0.28)" />
        <circle cx="409" cy="274" r="3" fill="#818cf8" fillOpacity="0.8" />
        <rect x="415" y="271" width="16" height="5" rx="1.5" fill="rgba(255,255,255,0.28)" />

        <rect
          x="16"
          y="270"
          width="308"
          height="88"
          rx="10"
          fill="rgba(255,255,255,0.022)"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
        <rect x="16" y="270" width="308" height="22" rx="10" fill="rgba(255,255,255,0.035)" />
        <rect x="16" y="280" width="308" height="12" fill="rgba(255,255,255,0.035)" />
        {[28, 90, 186, 260].map((x, i) => {
          const widths = [38, 30, 30, 28]
          return (
            <rect
              key={i}
              x={x}
              y="279"
              width={widths[i]}
              height="6"
              rx="2"
              fill="rgba(255,255,255,0.2)"
            />
          )
        })}

        {[
          {
            y: 297,
            statusColor: "#10b981",
            statusBg: "rgba(16,185,129,0.14)",
            border: "rgba(16,185,129,0.3)",
            wLabel: 32,
          },
          {
            y: 318,
            statusColor: "#f59e0b",
            statusBg: "rgba(245,158,11,0.12)",
            border: "rgba(245,158,11,0.3)",
            wLabel: 40,
          },
          {
            y: 339,
            statusColor: "#818cf8",
            statusBg: "rgba(99,102,241,0.12)",
            border: "rgba(99,102,241,0.28)",
            wLabel: 28,
          },
        ].map(({ y, statusColor, statusBg, border, wLabel }, i) => (
          <g key={i}>
            <line
              x1="22"
              y1={y - 1}
              x2="318"
              y2={y - 1}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
            <rect x="28" y={y + 2} width="40" height="7" rx="2.5" fill="rgba(255,255,255,0.42)" />
            <rect
              x="90"
              y={y + 2}
              width={50 + i * 8}
              height="7"
              rx="2.5"
              fill="rgba(255,255,255,0.28)"
            />
            <rect x="186" y={y + 2} width="38" height="7" rx="2.5" fill="rgba(255,255,255,0.42)" />
            <rect
              x="258"
              y={y}
              width={wLabel + 14}
              height="11"
              rx="5.5"
              fill={statusBg}
              stroke={border}
              strokeWidth="1"
            />
            <circle cx="265" cy={y + 5.5} r="2.5" fill={statusColor} fillOpacity="0.85" />
            <rect
              x="270"
              y={y + 2.5}
              width={wLabel}
              height="6"
              rx="2"
              fill={statusColor}
              fillOpacity="0.6"
            />
          </g>
        ))}

        <rect
          x="332"
          y="286"
          width="180"
          height="72"
          rx="10"
          fill="rgba(255,255,255,0.022)"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
        <rect x="342" y="294" width="54" height="7" rx="2.5" fill="rgba(255,255,255,0.32)" />

        {[
          { y: 308, flagFill: "#3b82f6", positive: true },
          { y: 323, flagFill: "#ef4444", positive: false },
          { y: 338, flagFill: "#f59e0b", positive: true },
        ].map(({ y, flagFill, positive }, i) => (
          <g key={i}>
            <circle cx="342" cy={y + 3.5} r="5" fill={flagFill} fillOpacity="0.75" />
            <rect x="351" y={y} width="52" height="7" rx="2.5" fill="rgba(255,255,255,0.38)" />
            <rect x="420" y={y} width="28" height="7" rx="2.5" fill="rgba(255,255,255,0.55)" />
            <rect
              x="454"
              y={y}
              width="32"
              height="7"
              rx="2.5"
              fill={
                positive ? "rgba(16,185,129,0.6)" : "rgba(248,113,113,0.6)"
              }
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
