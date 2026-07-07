import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { usePlatformStatus } from "@/hooks/use-platform-status";
import { useNativePreferences } from "@/hooks/use-native-preferences";
import { requestNativeAction } from "@/services/native/native-actions";
import type { NativePreferences } from "@/services/native/preferences-service";
import { Battery, Bell, Radio, Share2, Smartphone, Wifi } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/native")({
  head: () => ({ meta: [{ title: "Dispositivo e notificações — Hermes Mobile" }] }),
  component: NativeSettingsPage,
});

const toggles: Array<{ key: keyof NativePreferences; title: string; description: string }> = [
  {
    key: "batterySaver",
    title: "Modo economia de bateria",
    description: "Reduz sincronizações e evita trabalho desnecessário.",
  },
  {
    key: "limitMobileData",
    title: "Limitar ações em dados móveis",
    description: "Monitoramento e sincronização ficam restritos ao Wi-Fi.",
  },
  {
    key: "quietHoursEnabled",
    title: "Horários silenciosos",
    description: "Não agenda notificações durante o intervalo configurado.",
  },
  {
    key: "notificationsEnabled",
    title: "Notificações locais",
    description: "Avisa sobre sugestões, preços, tarefas e conexão do Hermes PC.",
  },
];

function NativeSettingsPage() {
  const { battery, network, device, native } = usePlatformStatus();
  const { preferences, update } = useNativePreferences();
  const [pending, setPending] = useState<keyof NativePreferences | null>(null);
  const [openApp, setOpenApp] = useState(false);
  const confirmPreference = () => {
    if (!pending) return;
    update(pending, !preferences[pending] as never);
    setPending(null);
  };

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Dispositivo e notificações</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Recursos leves, sem automação contínua em segundo plano.
      </p>

      <section className="glass-card mb-4 grid grid-cols-2 gap-3 rounded-3xl p-4 text-xs">
        <Status
          icon={<Battery className="h-4 w-4" />}
          label="Bateria"
          value={
            battery.level == null
              ? "Indisponível"
              : `${battery.level}%${battery.charging ? " · carregando" : ""}`
          }
        />
        <Status
          icon={<Wifi className="h-4 w-4" />}
          label="Rede"
          value={
            !network.connected
              ? "Offline"
              : network.connection === "wifi"
                ? "Wi-Fi"
                : network.connection === "cellular"
                  ? "Dados móveis"
                  : "Online"
          }
        />
        <Status
          icon={<Smartphone className="h-4 w-4" />}
          label="Dispositivo"
          value={device.model}
        />
        <Status
          icon={<Radio className="h-4 w-4" />}
          label="Plataforma"
          value={native ? "APK Android" : "Navegador/PWA"}
        />
      </section>

      <ul className="mb-4 space-y-2">
        {toggles.map((item) => {
          const enabled = Boolean(preferences[item.key]);
          return (
            <li
              key={item.key}
              className="glass-card flex items-center justify-between gap-3 rounded-2xl p-3.5"
            >
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={enabled}
                onClick={() => setPending(item.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full border border-border ${enabled ? "gradient-primary glow" : "bg-background/60"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <section className="glass-card mb-4 rounded-2xl p-4">
        <label className="text-xs font-semibold">Frequência de sincronização</label>
        <select
          value={preferences.syncFrequency}
          onChange={(event) =>
            update("syncFrequency", event.target.value as NativePreferences["syncFrequency"])
          }
          className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm"
        >
          <option value="manual">Manual</option>
          <option value="15m">A cada 15 min</option>
          <option value="30m">A cada 30 min</option>
          <option value="1h">A cada 1 hora</option>
          <option value="6h">A cada 6 horas</option>
        </select>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[11px] text-muted-foreground">
            Silêncio inicia
            <input
              type="time"
              value={preferences.quietStart}
              onChange={(event) => update("quietStart", event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background/60 px-2 py-2 text-sm"
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Silêncio termina
            <input
              type="time"
              value={preferences.quietEnd}
              onChange={(event) => update("quietEnd", event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background/60 px-2 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/10 p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Uso de rede</p>
        <p className="mt-1">
          Promoções e sincronização com PC respeitam “somente Wi-Fi”. Notificações já preparadas e
          preferências locais não precisam de dados móveis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            void requestNativeAction({
              kind: "local_notification",
              value: "Notificação local de teste do Hermes.",
            })
          }
          className="flex items-center justify-center gap-2 rounded-2xl gradient-primary px-3 py-3 text-xs font-semibold text-primary-foreground"
        >
          <Bell className="h-4 w-4" /> Testar aviso
        </button>
        <button
          onClick={() =>
            void requestNativeAction({
              kind: "share",
              value: "Hermes Mobile — assistente local com confirmação.",
            })
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-3 text-xs font-semibold"
        >
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      </div>
      <button
        onClick={() => setOpenApp(true)}
        className="mt-2 w-full rounded-2xl border border-border py-2.5 text-xs"
      >
        Abrir configurações do Android
      </button>

      <ConfirmActionDialog
        open={Boolean(pending)}
        title="Alterar preferência?"
        description="A mudança será salva localmente e aplicada sem iniciar loops em segundo plano."
        onCancel={() => setPending(null)}
        onConfirm={confirmPreference}
      />
      <ConfirmActionDialog
        open={openApp}
        title="Abrir outro aplicativo?"
        description="Confirme para abrir as configurações do Android. Nenhum toque ou comando será executado depois disso."
        onCancel={() => setOpenApp(false)}
        onConfirm={() => {
          setOpenApp(false);
          void requestNativeAction({
            kind: "open_app",
            value: "android.settings.SETTINGS",
            confirmed: true,
          });
        }}
      />
    </MobileShell>
  );
}

function Status({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-2">
      <div className="flex items-center gap-1.5 text-primary">
        {icon}
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 truncate font-semibold">{value}</p>
    </div>
  );
}
