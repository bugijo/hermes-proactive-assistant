import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useSecuritySettings } from "@/hooks/use-hermes-data";
import { PauseCircle, ShieldCheck } from "lucide-react";
import { securityPolicyPresentation } from "@/services/security-policy";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Segurança — Hermes Mobile" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const { data: securitySettings } = useSecuritySettings();

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Segurança</h1>
      <p className="mb-4 text-sm text-muted-foreground">Regras que o Hermes segue à risca.</p>

      <div className="glass-card mb-5 flex items-center gap-3 rounded-3xl p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Políticas obrigatórias são aplicadas pela API e não podem ser desligadas pela interface.
          Recursos ainda sem enforcement aparecem como “em preparação”.
        </p>
      </div>

      <ul className="mb-6 space-y-2">
        {securitySettings.map((s) => {
          const policy = securityPolicyPresentation(s);
          return (
            <li
              key={s.id}
              className="glass-card flex items-center justify-between gap-3 rounded-2xl p-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              </div>
              <span
                className={
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                  (policy.active
                    ? "bg-[color:var(--success)]/20 text-[color:var(--success)]"
                    : "bg-muted text-muted-foreground")
                }
              >
                {policy.label}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-3xl border border-border bg-muted/50 py-4 text-base font-semibold text-muted-foreground"
      >
        <PauseCircle className="h-5 w-5" />
        Pausar Hermes · em preparação
      </button>
    </MobileShell>
  );
}
