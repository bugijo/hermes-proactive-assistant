import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

interface Props {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  hideNav?: boolean;
}

export function MobileShell({ children, title, subtitle, hideNav }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28">
      <AppHeader title={title} subtitle={subtitle} />
      <main className="flex-1 animate-fade-in-up">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
