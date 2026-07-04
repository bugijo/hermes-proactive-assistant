import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useSecuritySettings } from "@/hooks/use-hermes-data";
import { PauseCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Segurança — Hermes Mobile" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const { data: securitySettings } = useSecuritySettings();
  const [items, setItems] = useState(securitySettings);
  const [paused, setPaused] = useState(false);

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Segurança</h1>
      <p className="mb-4 text-sm text-muted-foreground">Regras que o Hermes segue à risca.</p>

      <div className="glass-card mb-5 flex items-center gap-3 rounded-3xl p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Suas preferências são aplicadas em toda ação do Hermes. Ele nunca envia, compra ou apaga
          sem sua confirmação.
        </p>
      </div>

      <ul className="mb-6 space-y-2">
        {items.map((s, i) => (
          <li
            key={s.id}
            className="glass-card flex items-center justify-between gap-3 rounded-2xl p-3.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={s.enabled}
              onClick={() =>
                setItems((cur) => cur.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))
              }
              className={
                "relative h-7 w-12 shrink-0 rounded-full border border-border transition-colors " +
                (s.enabled ? "gradient-primary glow" : "bg-background/60")
              }
            >
              <span
                className={
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " +
                  (s.enabled ? "left-[calc(100%-1.375rem)]" : "left-0.5")
                }
              />
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setPaused((p) => !p)}
        className={
          "flex w-full items-center justify-center gap-2 rounded-3xl py-4 text-base font-semibold transition-colors " +
          (paused
            ? "bg-[color:var(--success)] text-[color:var(--success-foreground)]"
            : "bg-destructive text-destructive-foreground")
        }
      >
        <PauseCircle className="h-5 w-5" />
        {paused ? "Retomar Hermes" : "Pausar Hermes"}
      </button>
    </MobileShell>
  );
}
