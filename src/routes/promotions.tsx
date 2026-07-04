import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useOffers } from "@/hooks/use-hermes-data";
import type { OfferStatus } from "@/types/hermes";
import { ExternalLink, Bell, Star } from "lucide-react";
import { useState } from "react";

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
  const filtered =
    category === "Todos" ? data.offers : data.offers.filter((o) => o.category === category);

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Promoções</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Monitoramento inteligente de ofertas — nota do Hermes baseada em preço, loja e histórico.
      </p>

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
              <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 py-2 text-xs font-semibold hover:bg-background/70 active:scale-95">
                <Bell className="h-3.5 w-3.5" /> Monitorar
              </button>
            </div>
          </li>
        ))}
      </ul>
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
