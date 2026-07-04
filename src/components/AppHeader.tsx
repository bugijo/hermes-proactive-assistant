import { Link } from "@tanstack/react-router";
import { Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  showSettings?: boolean;
}

export function AppHeader({ title, subtitle, showSettings = true }: Props) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {title ?? "Hermes Mobile"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {subtitle ?? "Seu assistente pessoal proativo."}
            </p>
          </div>
        </div>
        {showSettings && (
          <Link
            to="/settings"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Configurações"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>
    </header>
  );
}
