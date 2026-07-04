import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { suggestions, type Suggestion } from "@/lib/mock-data";
import { Check, X, Clock, Info, Tag, Bell, MessageSquare, ListTodo } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/suggestions")({
  head: () => ({ meta: [{ title: "Sugestões — Hermes Mobile" }] }),
  component: SuggestionsPage,
});

const iconMap: Record<Suggestion["type"], React.ReactNode> = {
  promo: <Tag className="h-5 w-5" />,
  reminder: <Bell className="h-5 w-5" />,
  message: <MessageSquare className="h-5 w-5" />,
  task: <ListTodo className="h-5 w-5" />,
};

const labelMap: Record<Suggestion["type"], string> = {
  promo: "Promoção",
  reminder: "Lembrete",
  message: "Mensagem",
  task: "Tarefa",
};

function SuggestionsPage() {
  const [handled, setHandled] = useState<Record<string, "approved" | "ignored" | "later">>({});

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Sugestões</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        O Hermes reuniu ideias para você — nada acontece sem sua aprovação.
      </p>

      <ul className="space-y-3">
        {suggestions.map((s) => {
          const state = handled[s.id];
          return (
            <li key={s.id} className="glass-card rounded-3xl p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  {iconMap[s.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                      {labelMap[s.type]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{s.time}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>

              {state ? (
                <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                  {state === "approved" && "Aprovado — Hermes seguirá em frente."}
                  {state === "ignored" && "Ignorado."}
                  {state === "later" && "Vou te lembrar mais tarde."}
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <ActionBtn onClick={() => setHandled((h) => ({ ...h, [s.id]: "approved" }))} icon={<Check className="h-4 w-4" />} label="Aprovar" primary />
                  <ActionBtn onClick={() => setHandled((h) => ({ ...h, [s.id]: "ignored" }))} icon={<X className="h-4 w-4" />} label="Ignorar" />
                  <ActionBtn onClick={() => setHandled((h) => ({ ...h, [s.id]: "later" }))} icon={<Clock className="h-4 w-4" />} label="Depois" />
                  <ActionBtn icon={<Info className="h-4 w-4" />} label="Detalhes" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </MobileShell>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-semibold transition-transform active:scale-95 " +
        (primary
          ? "border-transparent gradient-primary text-primary-foreground glow"
          : "border-border bg-background/40 text-foreground hover:bg-background/70")
      }
    >
      {icon}
      {label}
    </button>
  );
}
