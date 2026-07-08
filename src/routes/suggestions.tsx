import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useSuggestions } from "@/hooks/use-hermes-data";
import type { Suggestion } from "@/types/hermes";
import { Check, X, Clock, Info, Tag, Bell, MessageSquare, ListTodo } from "lucide-react";
import { useState } from "react";
import { hermesService } from "@/services/hermes-service";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { OperationFeedback } from "@/components/OperationFeedback";
import { useConnectionMode } from "@/hooks/use-connection-mode";

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
  const { data: suggestions } = useSuggestions();
  const [handled, setHandled] = useState<Record<string, "approved" | "ignored" | "later">>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const mode = useConnectionMode();

  const handle = async (id: string, state: "approved" | "ignored" | "later") => {
    setBusyId(id);
    setError("");
    try {
      await hermesService.updateSuggestion(id, state);
      setHandled((current) => ({ ...current, [id]: state }));
      setConfirmId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar a sugestão.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Sugestões</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        O Hermes reuniu ideias para você — nada acontece sem sua aprovação.
      </p>
      <OperationFeedback busy={Boolean(busyId)} error={error} />

      <ul className="space-y-3">
        {suggestions.map((s) => {
          const state = handled[s.id] ?? (s.state && s.state !== "pending" ? s.state : undefined);
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
                  <ActionBtn
                    onClick={() => setConfirmId(s.id)}
                    icon={<Check className="h-4 w-4" />}
                    label="Aprovar"
                    primary
                    disabled={mode === "offline" || Boolean(busyId)}
                  />
                  <ActionBtn
                    onClick={() => void handle(s.id, "ignored")}
                    icon={<X className="h-4 w-4" />}
                    label="Ignorar"
                    disabled={mode === "offline" || Boolean(busyId)}
                  />
                  <ActionBtn
                    onClick={() => void handle(s.id, "later")}
                    icon={<Clock className="h-4 w-4" />}
                    label="Depois"
                    disabled={mode === "offline" || Boolean(busyId)}
                  />
                  <ActionBtn icon={<Info className="h-4 w-4" />} label="Detalhes" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmActionDialog
        open={Boolean(confirmId)}
        title="Aprovar esta sugestão?"
        description="A aprovação será registrada como confirmada, mas nenhuma ação externa será executada nesta fase."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) void handle(confirmId, "approved");
        }}
      />
    </MobileShell>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  primary,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-semibold transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 " +
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
