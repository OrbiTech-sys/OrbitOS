"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { AlertTriangle, Check, FolderKanban, PackageMinus, Sparkles, TrendingUp, UserRound } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import type { StoryData } from "@/lib/demo/story-data";
import { cn } from "@/lib/utils";
import { CARD_LABEL, StoryCard } from "./cards";
import { CARD_ORDER, LAYOUTS, type CardId, type Variant } from "./layout";

const EASE = [0.22, 1, 0.36, 1] as const;
const smooth: Transition = { duration: 0.9, ease: EASE };

/** Pairs linked in the connected scene: ring around the four modules. */
const RING: [CardId, CardId][] = [
  ["crm", "sheet"],
  ["sheet", "invoice"],
  ["invoice", "inventory"],
  ["inventory", "crm"],
];
/** Disconnected "almost" links in the fragmented scene. */
const BROKEN: [CardId, CardId][] = [
  ["sheet", "crm"],
  ["crm", "invoice"],
  ["sheet", "inventory"],
  ["inventory", "notif"],
];

const FRAGMENT_TONE = {
  red: "border-rose-200 bg-rose-50 text-rose-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-white text-slate-600",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
} as const;

interface Props {
  scene: number;
  variant: Variant;
  data: StoryData;
  /** Skip repeating decorative motion (SVG pulses, floating fragments). */
  still: boolean;
}

export function StoryCanvas({ scene, variant, data, still }: Props) {
  const L = LAYOUTS[variant];
  const tall = variant === "tall";
  const connected = scene >= 1;
  const center = (id: CardId, positions: Record<CardId, { x: number; y: number }>) => ({
    x: positions[id].x + L.card.w / 2,
    y: positions[id].y + L.card.h / 2,
  });

  const groupAnimate =
    scene === 2
      ? { x: L.group.x, y: L.group.y, scale: L.group.s, opacity: 1 }
      : scene === 3
        ? { x: L.group.x, y: L.group.y, scale: L.group.s, opacity: 0 }
        : { x: 0, y: 0, scale: 1, opacity: 1 };

  return (
    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: L.canvas.w, height: L.canvas.h }}>
      {/* Backdrop: loose dots in the fragmented scene */}
      <motion.div
        className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle,rgba(100,116,139,0.28)_1px,transparent_1.2px)] [background-size:22px_22px]"
        initial={false}
        animate={{ opacity: scene === 0 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* Workspace window (appears once things connect) */}
      <motion.div
        className="absolute rounded-[22px] border bg-gradient-to-b from-white to-slate-50 shadow-float"
        style={{ left: L.frame.x, top: L.frame.y, width: L.frame.w, height: L.frame.h }}
        initial={false}
        animate={{ opacity: connected ? 1 : 0, scale: connected ? 1 : 0.985 }}
        transition={{ duration: 0.8, ease: EASE, delay: connected ? 0.25 : 0 }}
      >
        <div className="flex h-10 items-center gap-2 border-b px-4">
          <LogoMark className="size-5" />
          <span className="text-[11px] font-semibold text-slate-800">{data.company}</span>
          <span className="ml-auto rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[9px] font-medium text-slate-500">
            Illustrative data · {data.asOf}
          </span>
        </div>
      </motion.div>

      {/* Cards + connectors move as one group so the AI scene can shrink them aside */}
      <motion.div
        className="absolute inset-0 origin-top-left"
        initial={false}
        animate={groupAnimate}
        transition={{ duration: 0.85, ease: EASE }}
      >
        <svg className="absolute inset-0" width={L.canvas.w} height={L.canvas.h} viewBox={`0 0 ${L.canvas.w} ${L.canvas.h}`} fill="none" aria-hidden="true">
          {/* Fragmented: broken links with an ✕ */}
          <g>
            {BROKEN.map(([a, b], i) => {
              const ca = center(a, L.scattered);
              const cb = center(b, L.scattered);
              const p1 = { x: ca.x + (cb.x - ca.x) * 0.36, y: ca.y + (cb.y - ca.y) * 0.36 };
              const p2 = { x: ca.x + (cb.x - ca.x) * 0.64, y: ca.y + (cb.y - ca.y) * 0.64 };
              const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
              return (
                <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: scene === 0 ? 1 : 0 }} transition={{ duration: 0.5, delay: scene === 0 ? 0.9 + i * 0.12 : 0 }}>
                  <line x1={ca.x} y1={ca.y} x2={p1.x} y2={p1.y} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 5" />
                  <line x1={p2.x} y1={p2.y} x2={cb.x} y2={cb.y} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 5" />
                  <circle cx={mid.x} cy={mid.y} r="8" fill="#fff" stroke="#fda4af" />
                  <path d={`M${mid.x - 3} ${mid.y - 3}l6 6m0 -6l-6 6`} stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" />
                </motion.g>
              );
            })}
          </g>

          {/* Connected: spokes from the hub and a ring between modules */}
          {CARD_ORDER.map((id, i) => {
            const c = center(id, L.hub);
            return (
              <motion.line
                key={`spoke-${id}`}
                x1={L.hubCenter.x}
                y1={L.hubCenter.y}
                x2={c.x}
                y2={c.y}
                stroke="#a5b4fc"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: connected ? 1 : 0, opacity: connected ? 1 : 0 }}
                transition={{ duration: 0.7, delay: connected ? 1.0 + i * 0.08 : 0 }}
              />
            );
          })}
          {RING.map(([a, b], i) => {
            const ca = center(a, L.hub);
            const cb = center(b, L.hub);
            return (
              <motion.line
                key={`ring-${a}-${b}`}
                x1={ca.x}
                y1={ca.y}
                x2={cb.x}
                y2={cb.y}
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: connected ? 1 : 0, opacity: connected ? 1 : 0 }}
                transition={{ duration: 0.8, delay: connected ? 1.3 + i * 0.18 : 0, ease: EASE }}
              />
            );
          })}
          {/* Data pulses travelling along the ring (short, not looping forever) */}
          {!still && scene === 1 && (
            <g>
              {RING.map(([a, b], i) => {
                const ca = center(a, L.hub);
                const cb = center(b, L.hub);
                return (
                  <circle key={`pulse-${i}`} r="3.5" fill="#4f46e5" opacity="0">
                    <animateMotion dur="1.3s" begin={`${2.1 + i * 0.25}s`} repeatCount="1" path={`M${ca.x} ${ca.y} L${cb.x} ${cb.y}`} fill="freeze" />
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.3s" begin={`${2.1 + i * 0.25}s`} repeatCount="1" />
                  </circle>
                );
              })}
            </g>
          )}
        </svg>

        {/* Hub node */}
        <motion.div
          className="absolute flex items-center justify-center rounded-full border border-indigo-200 bg-white shadow-elevated"
          style={{ left: L.hubCenter.x - (tall ? 24 : 32), top: L.hubCenter.y - (tall ? 24 : 32), width: tall ? 48 : 64, height: tall ? 48 : 64 }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: connected ? 1 : 0, scale: connected ? 1 : 0.4 }}
          transition={{ type: "spring", stiffness: 160, damping: 16, delay: connected ? 0.95 : 0 }}
        >
          <LogoMark className={tall ? "size-7" : "size-9"} />
        </motion.div>

        {/* Cards */}
        {CARD_ORDER.map((id, i) => {
          const from = L.scattered[id];
          const to = L.hub[id];
          const alert = id === "invoice" ? 0 : id === "inventory" ? 1 : id === "crm" ? 2 : null;
          return (
            <motion.div
              key={id}
              className="absolute top-0 left-0"
              style={{ width: L.card.w, height: L.card.h }}
              initial={{ x: from.x, y: from.y + 14, rotate: from.r ?? 0, opacity: 0 }}
              animate={
                connected
                  ? { x: to.x, y: to.y, rotate: 0, opacity: 1 }
                  : { x: from.x, y: from.y, rotate: from.r ?? 0, opacity: 1 }
              }
              transition={connected ? { ...smooth, delay: i * 0.07 } : { duration: 0.7, ease: EASE, delay: i * 0.1 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={connected ? "c" : "f"}
                  className="h-full w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <StoryCard id={id} mode={connected ? "connected" : "fragmented"} data={data} />
                </motion.div>
              </AnimatePresence>
              {alert !== null && (
                <motion.span
                  className={cn(
                    "pointer-events-none absolute -inset-1 rounded-[14px] ring-2",
                    id === "invoice" ? "ring-rose-400/70" : id === "inventory" ? "ring-amber-400/70" : "ring-indigo-400/70",
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: scene === 2 ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: scene === 2 ? 1.2 + alert * 0.8 : 0 }}
                />
              )}
              <motion.span
                className="absolute -bottom-5 left-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: scene === 1 ? 1 : 0 }}
                transition={{ duration: 0.3, delay: scene === 1 ? 1.4 + i * 0.1 : 0 }}
              >
                {CARD_LABEL[id]}
              </motion.span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Loose data fragments (fragmented scene only) */}
      <AnimatePresence>
        {scene === 0 &&
          L.fragments.map((f) => (
            <motion.span
              key={f.label}
              className={cn("absolute rounded-md border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap shadow-card", FRAGMENT_TONE[f.tone])}
              style={{ left: f.x, top: f.y }}
              initial={{ opacity: 0, y: 8 }}
              animate={still ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -5, 0] }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35 } }}
              transition={still ? { duration: 0.4 } : { opacity: { duration: 0.5, delay: f.delay }, y: { duration: 3.2, delay: f.delay, ease: "easeInOut", repeat: 1 } }}
            >
              {f.label}
            </motion.span>
          ))}
      </AnimatePresence>

      {/* AI copilot panel */}
      <AnimatePresence>
        {scene === 2 && <CopilotPanel key="copilot" variant={variant} data={data} />}
      </AnimatePresence>

      {/* Clarity: the resulting dashboard */}
      <AnimatePresence>{scene === 3 && <DashboardScene key="dash" variant={variant} data={data} />}</AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------- AI scene -------- */

function CopilotPanel({ variant, data }: { variant: Variant; data: StoryData }) {
  const L = LAYOUTS[variant];
  const tall = variant === "tall";
  const items = [
    {
      tone: "rose",
      icon: <AlertTriangle />,
      title: `${data.invoice.number} is ${data.invoice.daysOverdue} days overdue`,
      detail: `${data.invoice.customer} · ${data.invoice.amount}`,
      action: "Send reminder",
    },
    {
      tone: "amber",
      icon: <PackageMinus />,
      title: `${data.product.name} is below its threshold`,
      detail: `${data.product.stock} left · reorder level ${data.product.threshold}`,
      action: "Create reorder task",
    },
    {
      tone: "indigo",
      icon: <UserRound />,
      title: `${data.lead.company} needs a follow-up`,
      detail: `${data.lead.value} · ${data.lead.stage}`,
      action: "Schedule follow-up",
    },
  ] as const;
  const tones = {
    rose: { box: "bg-rose-50 text-rose-600", chip: "border-rose-200 text-rose-700 bg-rose-50" },
    amber: { box: "bg-amber-50 text-amber-600", chip: "border-amber-200 text-amber-700 bg-amber-50" },
    indigo: { box: "bg-indigo-50 text-indigo-600", chip: "border-indigo-200 text-indigo-700 bg-indigo-50" },
  } as const;

  return (
    <motion.div
      className="absolute flex flex-col rounded-2xl border bg-white shadow-float"
      style={{ left: L.copilot.x, top: L.copilot.y, width: L.copilot.w, height: L.copilot.h }}
      initial={{ opacity: 0, x: tall ? 0 : 28, y: tall ? 24 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
    >
      <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
        <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] leading-none font-semibold text-slate-900">OrbitOS Copilot</p>
          <p className="mt-1 text-[9px] leading-none text-slate-500">3 things need attention today</p>
        </div>
        <span className="ml-auto rounded-full border border-dashed border-slate-300 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">Demo assistant</span>
      </div>
      <div className={cn("flex flex-1 flex-col gap-2 p-3", tall && "gap-1.5 p-2.5")}>
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            className="flex flex-1 items-start gap-2.5 rounded-xl border bg-slate-50/70 p-2.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 1.2 + i * 0.8 }}
          >
            <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg [&_svg]:size-3.5", tones[it.tone].box)}>{it.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={cn("leading-snug font-semibold text-slate-900", tall ? "text-[10.5px]" : "text-[11.5px]")}>{it.title}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">{it.detail}</p>
              <motion.span
                className={cn("mt-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold", tones[it.tone].chip)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.6 + i * 0.8 }}
              >
                Suggested: {it.action}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------- Dashboard scene ----- */

function DashboardScene({ variant, data }: { variant: Variant; data: StoryData }) {
  const L = LAYOUTS[variant];
  const D = L.dash;
  const tall = variant === "tall";

  const { line, area, w, h } = useMemo(() => {
    const cw = D.chart.w - 28;
    const ch = D.chart.h - (tall ? 44 : 58);
    const max = Math.max(...data.trend);
    const min = Math.min(...data.trend) * 0.8;
    const pts = data.trend.map((v, i) => [
      (i / (data.trend.length - 1)) * cw,
      ch - ((v - min) / (max - min || 1)) * ch,
    ]);
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${cw} ${ch} L0 ${ch} Z`;
    return { line, area, w: cw, h: ch };
  }, [data.trend, D.chart.w, D.chart.h, tall]);

  const modules = ["CRM", "Sales", "Inventory", "Finance", "Projects"];

  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <motion.div
        className="absolute flex items-baseline gap-2"
        style={{ left: D.title.x, top: D.title.y }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
      >
        <p className="text-[13px] font-semibold text-slate-900">Business overview</p>
        <p className="text-[10px] text-slate-500">as of {data.asOf}</p>
      </motion.div>

      {data.kpis.map((k, i) => {
        const col = i % D.kpi.cols;
        const row = Math.floor(i / D.kpi.cols);
        return (
          <motion.div
            key={k.label}
            className="absolute rounded-xl border bg-white p-2.5 shadow-card"
            style={{
              left: D.kpi.x + col * (D.kpi.w + D.kpi.gap),
              top: D.kpi.y + row * (D.kpi.h + 12),
              width: D.kpi.w,
              height: D.kpi.h,
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1, duration: 0.5, ease: EASE }}
          >
            <p className="truncate text-[9.5px] font-medium text-slate-500">{k.label}</p>
            <p className={cn("mt-1 leading-none font-semibold tracking-tight text-slate-900", tall ? "text-[18px]" : "text-[22px]")}>{k.value}</p>
            <p className="mt-1 truncate text-[9.5px] text-slate-500">{k.hint}</p>
          </motion.div>
        );
      })}

      <motion.div
        className="absolute rounded-xl border bg-white p-3 shadow-card"
        style={{ left: D.chart.x, top: D.chart.y, width: D.chart.w, height: D.chart.h }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-800">Revenue trend</p>
          <span className="flex items-center gap-1 text-[9.5px] font-medium text-emerald-600">
            <TrendingUp className="size-3" /> last 8 months
          </span>
        </div>
        <svg className="mt-2" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="story-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1="0" x2={w} y1={h * t} y2={h * t} stroke="#e2e8f0" strokeDasharray="3 4" />
          ))}
          <motion.path d={area} fill="url(#story-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.6 }} />
          <motion.path
            d={line}
            stroke="#4f46e5"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1.1, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute rounded-xl border bg-white p-3 shadow-card"
        style={{ left: D.tasks.x, top: D.tasks.y, width: D.tasks.w, height: D.tasks.h }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
          <FolderKanban className="size-3.5 text-indigo-500" /> Today&apos;s tasks
        </div>
        <ul className="mt-2 space-y-1.5">
          {data.tasks.slice(0, tall ? 2 : 3).map((t, i) => (
            <motion.li
              key={t.title}
              className="flex items-start gap-1.5 text-[10px] leading-snug text-slate-600"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 + i * 0.18, duration: 0.4 }}
            >
              <motion.span
                className="mt-px flex size-3.5 shrink-0 items-center justify-center rounded border border-slate-300"
                animate={t.done || i === 0 ? { backgroundColor: "#4f46e5", borderColor: "#4f46e5" } : {}}
                transition={{ delay: 1.8 + i * 0.4 }}
              >
                {(t.done || i === 0) && <Check className="size-2.5 text-white" strokeWidth={3} />}
              </motion.span>
              <span className={cn(tall ? "line-clamp-1" : "line-clamp-2", t.done && "text-slate-400 line-through")}>{t.title}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="absolute"
        style={{ left: D.modules.x, top: D.modules.y, width: D.modules.w }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <div className="relative flex items-center justify-between">
          <motion.span
            className="absolute inset-x-2 top-1/2 h-px origin-left bg-indigo-300"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.4, duration: 0.9, ease: EASE }}
          />
          {modules.map((m, i) => (
            <motion.span
              key={m}
              className="relative z-10 flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-1 text-[9.5px] font-semibold text-indigo-700 shadow-card"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 + i * 0.1, duration: 0.35 }}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {m}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
