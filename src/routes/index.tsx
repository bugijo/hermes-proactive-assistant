import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { hermesStatus, suggestions, userName } from "@/services/mock-hermes-data";
import {
  BatteryMedium,
  Wifi,
  Signal,
  Mic,
  Bell,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Monitor,
  Smartphone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Hermes Mobile" },
      {
        name: "description",
        content: "Painel principal do Hermes Mobile, seu assistente pessoal proativo.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = hermesStatus;
  return (
    <MobileShell>
      <section className="mb-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Bem-vindo</p>
        <h1 className="mt-1 text-3xl font-bold">
          Olá, <span className="text-gradient">{userName}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">O que vamos resolver hoje?</p>
      </section>

      {/* Status card */}
      <section className="glass-card mb-4 rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary glow animate-pulse-ring">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Status do Hermes</p>
            <p className="truncate text-lg font-semibold">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[color:var(--success)] shadow-[0_0_10px_var(--success)]" />
              {s.state}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {s.pending} ações pendentes · pronto para ajudar
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatusChip
            icon={<BatteryMedium className="h-4 w-4" />}
            label="Bateria"
            value={`${s.battery}%`}
          />
          <StatusChip
            icon={
              s.connection === "Wi-Fi" ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <Signal className="h-4 w-4" />
              )
            }
            label="Conexão"
            value={s.connection}
          />
        </div>
      </section>

      {/* Primary actions */}
      <section className="mb-6 grid grid-cols-1 gap-3">
        <Link
          to="/chat"
          className="group flex items-center gap-4 rounded-3xl gradient-primary p-5 glow transition-transform active:scale-[0.98]"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black/25 backdrop-blur-sm animate-float">
            <Mic className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1 text-primary-foreground">
            <p className="text-sm/tight opacity-90">Interaja agora</p>
            <p className="text-lg font-semibold">Falar com Hermes</p>
          </div>
          <ChevronRight className="h-5 w-5 text-primary-foreground/80" />
        </Link>

        <Link
          to="/suggestions"
          className="glass-card flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98]"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/20 text-accent">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Ações pendentes</p>
            <p className="text-xs text-muted-foreground">{s.pending} coisas esperando por você</p>
          </div>
          <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent">
            {s.pending}
          </span>
        </Link>
      </section>

      {/* Suggestions preview */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Últimas sugestões</h2>
          <Link to="/suggestions" className="text-xs font-medium text-primary">
            Ver todas
          </Link>
        </div>
        <ul className="space-y-2">
          {suggestions.slice(0, 3).map((s) => (
            <li key={s.id} className="glass-card rounded-2xl p-3">
              <p className="line-clamp-1 text-sm font-semibold">{s.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {s.time}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick tiles */}
      <section className="mb-4 grid grid-cols-3 gap-2">
        <QuickTile to="/device" icon={<Smartphone className="h-5 w-5" />} label="Controle" />
        <QuickTile to="/pc" icon={<Monitor className="h-5 w-5" />} label="Hermes PC" />
        <QuickTile to="/security" icon={<ShieldCheck className="h-5 w-5" />} label="Segurança" />
      </section>
    </MobileShell>
  );
}

function StatusChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-background/40 px-3 py-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function QuickTile({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="glass-card flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-transform active:scale-95"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
