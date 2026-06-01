export function AuthPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at 18% 18%, #0a1628 0%, #050a14 55%, #020610 100%)",
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          left: "-15%",
          top: "-10%",
          width: "clamp(380px, 42vw, 680px)",
          height: "clamp(380px, 42vw, 680px)",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)",
          opacity: 0.85,
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          right: "-12%",
          bottom: "-18%",
          width: "clamp(480px, 52vw, 780px)",
          height: "clamp(480px, 52vw, 780px)",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          opacity: 0.75,
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          left: "36%",
          top: "28%",
          width: "clamp(280px, 28vw, 460px)",
          height: "clamp(280px, 28vw, 460px)",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
          opacity: 0.55,
        }}
      />

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
