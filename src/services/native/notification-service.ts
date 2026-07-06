import type { HermesSnapshot } from "@/types/hermes";
import { platformService, type LocalNotificationRequest } from "@/services/platform";
import { isQuietTime, type NativePreferences } from "./preferences-service";

const notificationId = (value: string) =>
  Math.abs([...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 17));

export function buildNotificationPlan(
  snapshot: HermesSnapshot,
  previousPcConnected?: boolean,
): LocalNotificationRequest[] {
  const plan: LocalNotificationRequest[] = [];
  const suggestion = snapshot.suggestions.find(
    (item) => item.state == null || item.state === "pending",
  );
  if (suggestion)
    plan.push({
      id: notificationId(`suggestion:${suggestion.id}`),
      title: "Nova sugestão importante",
      body: suggestion.title,
      extra: { route: "/suggestions" },
    });
  const offer = snapshot.offers.find((item) => item.price <= item.target);
  if (offer)
    plan.push({
      id: notificationId(`offer:${offer.id}:${offer.price}`),
      title: "Preço-alvo atingido",
      body: `${offer.name} chegou a R$ ${offer.price}.`,
      extra: { route: "/promotions" },
    });
  const task = snapshot.tasks?.find((item) => item.status === "pendente");
  if (task)
    plan.push({
      id: notificationId(`task:${task.id}`),
      title: "Tarefa pendente",
      body: task.title,
      extra: { route: "/" },
    });
  if (previousPcConnected !== undefined && previousPcConnected !== snapshot.pc.connected) {
    plan.push({
      id: notificationId(`pc:${snapshot.pc.connected}:${Date.now()}`),
      title: snapshot.pc.connected ? "Hermes PC conectado" : "Hermes PC desconectado",
      body: snapshot.pc.connected
        ? "O computador autorizado está disponível."
        : "A conexão com o computador foi encerrada.",
      extra: { route: "/pc" },
    });
  }
  return plan;
}

export async function syncLocalNotifications(
  snapshot: HermesSnapshot,
  preferences: NativePreferences,
) {
  if (!preferences.notificationsEnabled || isQuietTime(preferences)) return 0;
  const network = await platformService.getNetwork();
  if (preferences.limitMobileData && network.connection === "cellular") return 0;
  let count = 0;
  for (const item of buildNotificationPlan(snapshot)) {
    const key = `hermes.notification.${item.id}`;
    if ((await platformService.preferenceGet(key)) === "sent") continue;
    if (await platformService.scheduleNotification(item)) {
      await platformService.preferenceSet(key, "sent");
      count++;
    }
  }
  return count;
}
