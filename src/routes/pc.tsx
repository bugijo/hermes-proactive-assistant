import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { hermesPc } from "@/lib/mock-data";
import { Monitor, RefreshCw, Brain, Folder, Terminal, HardDrive } from "lucide-react";

export const Route = createFileRoute("/pc")({
  head: () => ({ meta: [{ title: "Hermes PC — Hermes Mobile" }] }),
  component: PcPage,
});

const iconMap = {
  brain: Brain,
  folder: Folder,
  terminal: Terminal,
  "hard-drive": HardDrive,
} as const;

function PcPage() {
  const { connected, ip, lastSync, tasks, modules } = hermesPc;

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Hermes PC</h1>
      <p className="mb-4 text-sm text-muted-foreground">Conexão com o seu computador.</p>

      <section className="glass-card mb-4 rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary glow">
            <Monitor className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={
                  "inline-block h-2 w-2 rounded-full " +
                  (connected
                    ? "bg-[color:var(--success)] shadow-[0_0_10px_var(--success)]"
                    : "bg-muted-foreground")
                }
              />
              <p className="text-sm font-semibold">{connected ? "Conectado" : "Desconectado"}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ip} · última sync {lastSync}
            </p>
          </div>
        </div>

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3 text-sm font-semibold text-primary-foreground glow active:scale-[0.98]">
          <RefreshCw className="h-4 w-4" /> Sincronizar agora
        </button>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Módulos</h2>
        <div className="grid grid-cols-2 gap-3">
          {modules.map((m) => {
            const Icon = iconMap[m.icon];
            return (
              <div key={m.id} className="glass-card rounded-2xl p-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">{m.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Tarefas enviadas ao PC</h2>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="glass-card flex items-center justify-between gap-3 rounded-2xl p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.time}</p>
              </div>
              <span
                className={
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (t.status === "Concluída"
                    ? "bg-[color:var(--success)]/20 text-[color:var(--success)]"
                    : t.status === "Em execução"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground")
                }
              >
                {t.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </MobileShell>
  );
}
