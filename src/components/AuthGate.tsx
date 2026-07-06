import {
  authApi,
  saveSession,
  type AuthStatus,
  type ConnectionMode,
} from "@/services/hermes-service";
import { Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [mode, setMode] = useState<ConnectionMode>(authApi.isConfigured() ? "online" : "offline");
  const [authenticated, setAuthenticated] = useState(authApi.hasSession());

  useEffect(() => {
    const connection = (event: Event) => setMode((event as CustomEvent<ConnectionMode>).detail);
    const unauthorized = () => setAuthenticated(false);
    window.addEventListener("hermes:connection", connection);
    window.addEventListener("hermes:unauthorized", unauthorized);
    if (!authApi.isConfigured()) setStatus({ hasUser: false, authenticationRequired: false });
    else {
      void authApi.restoreSession().then(setAuthenticated);
      authApi
        .status()
        .then(setStatus)
        .catch(() => {
          setMode("offline");
          setStatus({ hasUser: false, authenticationRequired: false });
        });
    }
    return () => {
      window.removeEventListener("hermes:connection", connection);
      window.removeEventListener("hermes:unauthorized", unauthorized);
    };
  }, []);

  if (!status)
    return (
      <CenteredCard>
        <p className="text-sm text-muted-foreground">Conectando ao Hermes local…</p>
      </CenteredCard>
    );
  if (mode === "online" && status.authenticationRequired && !authenticated) {
    return (
      <AuthForm
        setup={!status.hasUser}
        onAuthenticated={(session) => {
          saveSession(session);
          setAuthenticated(true);
        }}
      />
    );
  }
  return (
    <>
      {mode === "offline" && (
        <div className="fixed right-3 top-3 z-50 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] text-muted-foreground shadow">
          Modo offline/demo
        </div>
      )}
      {children}
    </>
  );
}

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
      <div className="glass-card w-full rounded-3xl p-6">{children}</div>
    </div>
  );
}

function AuthForm({
  setup,
  onAuthenticated,
}: {
  setup: boolean;
  onAuthenticated: (session: Awaited<ReturnType<typeof authApi.login>>) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAuthenticated(
        setup
          ? await authApi.register({ name, email, password })
          : await authApi.login({ email, password }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <CenteredCard>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold">
            {setup ? "Configurar Hermes Mobile" : "Entrar no Hermes"}
          </h1>
          <p className="text-xs text-muted-foreground">Autenticação local neste dispositivo</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {setup && (
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary"
          />
        )}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <input
          required
          minLength={10}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha (mínimo 10 caracteres)"
          className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary"
        />
        {error && (
          <p className="rounded-xl bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-primary-foreground glow disabled:opacity-60"
        >
          {busy ? "Aguarde…" : setup ? "Criar primeiro usuário" : "Entrar"}
        </button>
      </form>
    </CenteredCard>
  );
}
