export type NativeActionKind = "open_app" | "open_external" | "share" | "local_notification";

export const sensitiveNativeActions = new Set<NativeActionKind>(["open_app"]);

export function requireNativeConfirmation(kind: NativeActionKind, confirmed: boolean) {
  if (sensitiveNativeActions.has(kind) && !confirmed) {
    throw new Error("CONFIRMATION_REQUIRED");
  }
}
