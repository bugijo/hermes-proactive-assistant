import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Lightbulb, Tag, Zap, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/suggestions", label: "Sugestões", icon: Lightbulb },
  { to: "/promotions", label: "Promoções", icon: Tag },
  { to: "/automations", label: "Automações", icon: Zap },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all",
                    active && "gradient-primary text-primary-foreground glow",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
