"use client";

export default function FireBackground({ variant = "full" }: { variant?: "full" | "subtle" }) {
  const opacity = variant === "subtle" ? "opacity-30" : "opacity-50";
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background" aria-hidden="true">
      <div
        className={`absolute inset-0 ${opacity} dark:hidden`}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className={`absolute inset-0 ${opacity} hidden dark:block`}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(241,245,249,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(241,245,249,0.08) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-sky-400/10 dark:bg-sky-400/15 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-slate-300/30 dark:bg-slate-950/40 rounded-full blur-[100px]" />
    </div>
  );
}
