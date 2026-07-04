import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { automations, type BatteryImpact } from "@/lib/mock-data";
import { useState } from "react";
import { Battery, Clock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/automations")({
  head: () => ({ meta: [{ title: "Automações — Hermes Mobile" }] }),
  component: AutomationsPage,
});

const impactStyles: Record<BatteryImpact, string> = {
  baixo: "text-[color:var(--success)]",
  médio: "text-[color:var(--warning)]",
  alto: "text-destructive",
};

function AutomationsPage() {
  const [state, setState] = useState(Object.fromEntries(automations.map((a) => [a.id, a.enabled])));

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Automações</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Ative apenas o que você quer que o Hermes faça em segundo plano.
      </p>

      <ul className="space-y-3">
        {automations.map((a) => {
          const on = state[a.id];
          return (
            <li key={a.id} className="glass-card rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                </div>
                <Toggle
                  on={on}
                  onChange={() => setState((s) => ({ ...s, [a.id]: !s[a.id] }))}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <MetaCell icon={<Clock className="h-3.5 w-3.5" />} label={a.frequency} />
                <MetaCell
                  icon={<Battery className={"h-3.5 w-3.5 " + impactStyles[a.impact]} />}
                  label={`Bateria: ${a.impact}`}
                />
                <MetaCell icon={<ShieldCheck className="h-3.5 w-3.5" />} label={`${a.permissions.length} perm.`} />
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.permissions.map((p) => (
                  <span key={p} className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {p}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </MobileShell>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={
        "relative h-7 w-12 shrink-0 rounded-full border border-border transition-colors " +
        (on ? "gradient-primary glow" : "bg-background/60")
      }
    >
      <span
        className={
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " +
          (on ? "left-[calc(100%-1.375rem)]" : "left-0.5")
        }
      />
    </button>
  );
}

function MetaCell({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}
