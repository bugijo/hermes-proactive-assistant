import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useInitialChat } from "@/hooks/use-hermes-data";
import { hermesService } from "@/services/hermes-service";
import type { ChatMessage } from "@/types/hermes";
import { Send, Sparkles, Tag, Bell, Search, AppWindow, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { OperationFeedback } from "@/components/OperationFeedback";
import { useConnectionMode } from "@/hooks/use-connection-mode";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — Hermes Mobile" }] }),
  component: ChatPage,
});

const quickActions = [
  { icon: Tag, label: "Analisar promoção" },
  { icon: Bell, label: "Criar lembrete" },
  { icon: Search, label: "Pesquisar preço" },
  { icon: AppWindow, label: "Abrir app" },
  { icon: Monitor, label: "Falar com Hermes PC" },
];

function ChatPage() {
  const { data: initialChat } = useInitialChat();
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mode = useConnectionMode();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(initialChat), [initialChat]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const reply = await hermesService.sendChatMessage(t);
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: t };
      setMessages((current) => [...current, userMsg, reply]);
      setInput("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar a mensagem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Chat</h1>
      <p className="mb-4 text-sm text-muted-foreground">Converse com o Hermes.</p>
      <OperationFeedback busy={busy} error={error} />

      <div className="-mx-4 mb-3 overflow-x-auto px-4">
        <div className="flex gap-2">
          {quickActions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => void send(label)}
              disabled={busy || mode === "offline"}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-3 pb-4">
        {messages.map((m) => (
          <li
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2"}
          >
            {m.role === "hermes" && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="max-w-[80%]">
              <div
                className={
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
                  (m.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "glass-card rounded-bl-md")
                }
              >
                {m.text}
              </div>
              {m.card && (
                <div className="mt-2 glass-card rounded-2xl border-l-2 border-l-primary p-3">
                  <p className="text-xs font-semibold">{m.card.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{m.card.description}</p>
                </div>
              )}
            </div>
          </li>
        ))}
        <div ref={endRef} />
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="fixed inset-x-0 bottom-[68px] z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy || mode === "offline"}
            placeholder="Fale com o Hermes..."
            className="min-w-0 flex-1 rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || mode === "offline"}
            aria-label="Enviar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-primary glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </form>
    </MobileShell>
  );
}
