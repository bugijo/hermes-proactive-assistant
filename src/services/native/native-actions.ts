import { platformService } from "@/services/platform";
import { requireNativeConfirmation, type NativeActionKind } from "./action-guard";
import { hermesService } from "@/services/hermes-service";

export async function requestNativeAction(input: {
  kind: NativeActionKind;
  value: string;
  confirmed?: boolean;
}) {
  requireNativeConfirmation(input.kind, Boolean(input.confirmed));
  await hermesService.recordNativeAction({
    action: input.kind,
    payload: { value: input.value },
    confirmationStatus: input.confirmed ? "confirmed" : "draft",
  });
  if (input.kind === "open_app") return platformService.openApp(input.value);
  if (input.kind === "open_external") {
    await platformService.openExternal(input.value);
    return true;
  }
  if (input.kind === "share") return platformService.share({ text: input.value });
  return platformService.scheduleNotification({
    id: Date.now() % 2147483647,
    title: "Hermes Mobile",
    body: input.value,
  });
}
