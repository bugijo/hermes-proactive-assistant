import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useOffers } from "@/hooks/use-hermes-data";
import type { OfferStatus } from "@/types/hermes";
import { ExternalLink, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { hermesService } from "@/services/hermes-service";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { OperationFeedback } from "@/components/OperationFeedback";
import { useConnectionMode } from "@/hooks/use-connection-mode";

export const Route = createFileRoute("/promotions")({
  head: () => ({ meta: [{ title: "Promoções — Hermes Mobile" }] }),
  component: PromotionsPage,
});

const statusStyles: Record<OfferStatus, string> = {
  "Comprar agora": "bg-[color:var(--success)]/20 text-[color:var(--success)]",
  Esperar: "bg-[color:var(--warning)]/20 text-[color:var(--warning)]",
  Ruim: "bg-destructive/20 text-destructive",
  Suspeita: "bg-purple/25 text-purple",
};

function PromotionsPage() {
  const { data } = useOffers();
  const [category, setCategory] = useState<string>("Todos");
  const [items, setItems] = useState(data.offers);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mode = useConnectionMode();
  useEffect(() => setItems(data.offers), [data.offers]);
  const filtered = category === "Todos" ? items : items.filter((o) => o.category === category);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const item = await hermesService.addPromotion({
        name: name.trim(),
        category: category === "Todos" ? "Outros" : category,
        target: Number(target) || 0,
      });
      setItems((current) => [item, ...current]);
      setName("");
      setTarget("");
      setShowForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar a promoção.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!removeId) return;
    setBusy(true);
    setError("");
    try {
      await hermesService.removePromotion(removeId);
      setItems((current) => current.filter((item) => item.id !== removeId));
      setRemoveId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível remover a promoção.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Promoções</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Monitoramento inteligente de ofertas — nota do Hermes baseada em preço, loja e histórico.
      </p>
      <OperationFeedback busy={busy} error={error} />

      <button
        onClick={() => setShowForm((value) => !value)}
        disabled={busy || mode === "offline"}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 py-2.5 text-xs font-semibold"
      >
        <Plus className="h-4 w-4" /> Adicionar item monitorado
      </button>
      {showForm && (
        <div className="glass-card mb-4 space-y-2 rounded-2xl p-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do produto"
            className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none"
          />
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            inputMode="decimal"
            placeholder="Preço alvo"
            className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => void add()}
            disabled={busy || mode === "offline"}
            className="w-full rounded-xl gradient-primary py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvar monitoramento
          </button>
        </div>
      )}

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {["Todos", ...data.categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (c === category
                  ? "gradient-primary border-transparent text-primary-foreground"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.map((o) => (
          <li key={o.id} className="glass-card rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {o.category}
                </p>
                <p className="truncate text-sm font-semibold">{o.name}</p>
              </div>
              <span
                className={
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                  statusStyles[o.status]
                }
              >
                {o.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <PriceCell label="Atual" value={`R$ ${o.price}`} highlight />
              <PriceCell label="Alvo" value={`R$ ${o.target}`} />
              <div className="rounded-xl border border-border bg-background/40 px-2 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nota</p>
                <p className="flex items-center justify-center gap-1 text-sm font-bold text-primary">
                  <Star className="h-3 w-3 fill-primary" /> {o.score.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={o.url}
                className="flex items-center justify-center gap-1.5 rounded-xl gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground glow active:scale-95"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir link
              </a>
              <button
                onClick={() => setRemoveId(o.id)}
                disabled={busy || mode === "offline"}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 py-2 text-xs font-semibold hover:bg-background/70 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmActionDialog
        open={Boolean(removeId)}
        title="Remover item monitorado?"
        description="O item sairá da lista local. Nenhuma compra ou ação externa será realizada."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => void remove()}
      />
    </MobileShell>
  );
}

function PriceCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={"text-sm font-bold " + (highlight ? "text-gradient" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
