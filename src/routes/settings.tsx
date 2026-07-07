import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronRight, ShieldCheck, Smartphone, Monitor, Info, Bell } from "lucide-react";
import { authApi } from "@/services/hermes-service";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Hermes Mobile" }] }),
  component: SettingsPage,
});

const items = [
  {
    to: "/security",
    icon: ShieldCheck,
    title: "Segurança",
    desc: "Regras de confirmação e privacidade",
  },
  {
    to: "/device",
    icon: Smartphone,
    title: "Controle do celular",
    desc: "Permissões do Hermes no Android",
  },
  { to: "/pc", icon: Monitor, title: "Hermes PC", desc: "Sincronização com o desktop" },
  {
    to: "/native",
    icon: Bell,
    title: "Dispositivo e notificações",
    desc: "Bateria, rede e preferências nativas",
  },
] as const;

function SettingsPage() {
  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Configurações</h1>
      <p className="mb-5 text-sm text-muted-foreground">Ajuste como o Hermes se comporta.</p>

      <ul className="mb-6 space-y-2">
        {items.map(({ to, icon: Icon, title, desc }) => (
          <li key={to}>
            <Link
              to={to}
              className="glass-card flex items-center gap-3 rounded-2xl p-3.5 transition-transform active:scale-[0.99]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="glass-card flex items-start gap-3 rounded-2xl p-4">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">Hermes Mobile</p>
          <p className="text-xs text-muted-foreground">
            Versão 0.2.0 · API local com fallback demo.
          </p>
        </div>
      </div>
      {authApi.hasSession() && (
        <button
          onClick={() => void authApi.logout().then(() => window.location.reload())}
          className="mt-3 w-full rounded-2xl border border-border py-2.5 text-xs text-muted-foreground"
        >
          Encerrar sessão local
        </button>
      )}
    </MobileShell>
  );
}
