import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { usePcStatus } from "@/hooks/use-hermes-data";
import { useAuthorizedDevices } from "@/hooks/use-hermes-data";
import {
  Monitor,
  RefreshCw,
  Brain,
  Folder,
  Terminal,
  HardDrive,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { hermesService } from "@/services/hermes-service";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import type { AuthorizedDevice, PairingToken } from "@/types/hermes";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/pc")({
  head: () => ({ meta: [{ title: "Hermes PC — Hermes Mobile" }] }),
  component: PcPage,
});

const iconMap = {
  brain: Brain,
  folder: Folder,
  terminal: Terminal,
  "hard-drive": HardDrive,
} as const;

function PcPage() {
  const { data: hermesPc } = usePcStatus();
  const { data: loadedDevices } = useAuthorizedDevices();
  const { connected, ip, lastSync, tasks, modules } = hermesPc;
  const [devices, setDevices] = useState(loadedDevices);
  const [pairing, setPairing] = useState<PairingToken | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [pairingError, setPairingError] = useState("");
  const [pending, setPending] = useState<{
    device: AuthorizedDevice;
    action: "approve" | "revoke";
  } | null>(null);
  useEffect(() => setDevices(loadedDevices), [loadedDevices]);
  const createPairing = async () => {
    setPairingError("");
    try {
      const item = await hermesService.createPairingToken();
      setPairing(item);
      setQrImage(await QRCode.toDataURL(item.qrPayload, { width: 220, margin: 1 }));
    } catch (error) {
      setPairingError(
        error instanceof Error ? error.message : "Pareamento indisponível no modo demo.",
      );
    }
  };
  const applyDeviceAction = async () => {
    if (!pending) return;
    if (pending.action === "approve") {
      await hermesService.approveDevice(pending.device.id);
      setDevices((current) =>
        current.map((item) =>
          item.id === pending.device.id
            ? { ...item, status: "offline", approvalStatus: "approved" }
            : item,
        ),
      );
    } else {
      await hermesService.revokeDevice(pending.device.id);
      setDevices((current) =>
        current.map((item) =>
          item.id === pending.device.id ? { ...item, status: "revoked", revoked: true } : item,
        ),
      );
    }
    setPending(null);
  };

  return (
    <MobileShell>
      <h1 className="mb-1 text-2xl font-bold">Hermes PC</h1>
      <p className="mb-4 text-sm text-muted-foreground">Conexão com o seu computador.</p>

      <button
        onClick={() => void createPairing()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 py-3 text-sm font-semibold"
      >
        <Plus className="h-4 w-4 text-primary" /> Adicionar Hermes PC
      </button>
      {pairingError && (
        <p className="mb-4 rounded-xl bg-destructive/15 px-3 py-2 text-xs text-destructive">
          {pairingError}
        </p>
      )}
      {pairing && (
        <section className="glass-card mb-4 rounded-3xl p-4 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Código temporário: {pairing.code}</h2>
          </div>
          {qrImage && (
            <img
              src={qrImage}
              alt="QR Code temporário de pareamento"
              className="mx-auto w-48 rounded-xl bg-white p-2"
            />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Expira em {new Date(pairing.expiresAt).toLocaleTimeString("pt-BR")}. O computador ainda
            precisará de aprovação manual.
          </p>
        </section>
      )}

      <section className="glass-card mb-4 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <ScanLine className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Escanear QR do Hermes PC</p>
            <p className="text-xs text-muted-foreground">
              Tela preparatória: a câmera será integrada quando o Hermes PC estiver disponível.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Computadores autorizados
        </h2>
        <ul className="space-y-2">
          {devices.map((device) => (
            <li key={device.id} className="glass-card rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{device.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {device.status === "pending_approval"
                      ? "Aguardando aprovação"
                      : device.status === "connected" || device.connected
                        ? "Conectado"
                        : device.status === "revoked" || device.revoked
                          ? "Revogado"
                          : "Offline"}
                  </p>
                </div>
                {device.status === "pending_approval" && (
                  <button
                    onClick={() => setPending({ device, action: "approve" })}
                    className="rounded-xl bg-primary/15 p-2 text-primary"
                    aria-label="Aprovar computador"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </button>
                )}
                {!device.revoked && (
                  <button
                    onClick={() => setPending({ device, action: "revoke" })}
                    className="rounded-xl bg-destructive/15 p-2 text-destructive"
                    aria-label="Revogar computador"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">
          A identidade usa token temporário e chave pública; o IP local nunca é tratado como prova
          de confiança.
        </p>
      </section>

      <section className="glass-card mb-4 rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary glow">
            <Monitor className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={
                  "inline-block h-2 w-2 rounded-full " +
                  (connected
                    ? "bg-[color:var(--success)] shadow-[0_0_10px_var(--success)]"
                    : "bg-muted-foreground")
                }
              />
              <p className="text-sm font-semibold">{connected ? "Conectado" : "Desconectado"}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ip} · última sync {lastSync}
            </p>
          </div>
        </div>

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3 text-sm font-semibold text-primary-foreground glow active:scale-[0.98]">
          <RefreshCw className="h-4 w-4" /> Sincronizar agora
        </button>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Módulos</h2>
        <div className="grid grid-cols-2 gap-3">
          {modules.map((m) => {
            const Icon = iconMap[m.icon];
            return (
              <div key={m.id} className="glass-card rounded-2xl p-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">{m.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Tarefas enviadas ao PC</h2>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="glass-card flex items-center justify-between gap-3 rounded-2xl p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.time}</p>
              </div>
              <span
                className={
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (t.status === "Concluída"
                    ? "bg-[color:var(--success)]/20 text-[color:var(--success)]"
                    : t.status === "Em execução"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground")
                }
              >
                {t.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ConfirmActionDialog
        open={Boolean(pending)}
        title={
          pending?.action === "approve" ? "Aprovar este computador?" : "Revogar este computador?"
        }
        description={
          pending?.action === "approve"
            ? "A aprovação autoriza apenas o pareamento. Comandos remotos continuam indisponíveis."
            : "A revogação invalida a confiança local e não pode executar ações no computador."
        }
        onCancel={() => setPending(null)}
        onConfirm={() => void applyDeviceAction()}
      />
    </MobileShell>
  );
}
