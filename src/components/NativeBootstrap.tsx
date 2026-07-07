import { useNativeNotificationSync } from "@/hooks/use-native-notification-sync";

export function NativeBootstrap() {
  useNativeNotificationSync();
  return null;
}
