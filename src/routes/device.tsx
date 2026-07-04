import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { devicePermissions } from "@/lib/mock-data";
import { ShieldCheck, Check, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/device")({
  head: () => ({ meta: [{ title: "Controle do celular — Hermes Mobile" }] }),
  component: DevicePage,
});

function DevicePage() {
  const [perms, setPerms] = useState(devicePermissions);

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Controle do celular</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Permissões que o Hermes usará no seu Android. Você controla tudo.
      </p>

      <div className="glass-card mb-5 rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary glow">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">O Hermes sempre pedirá confirmação</span> antes de enviar, comprar ou apagar algo.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {perms.map((p, i) => (
          <li key={p.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <button
                onClick={() =>
                  setPerms((cur) => cur.map((x, j) => (j === i ? { ...x, granted: !x.granted } : x)))
                }
                className={
                  "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors " +
                  (p.granted
                    ? "bg-[color:var(--success)]/20 text-[color:var(--success)]"
                    : "bg-muted text-muted-foreground")
                }
              >
                {p.granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {p.granted ? "Concedida" : "Negada"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
