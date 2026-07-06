import { useEffect } from "react";
import { useHermesSnapshot } from "@/hooks/use-hermes-data";
import { nativePreferencesService } from "@/services/native/preferences-service";
import { syncLocalNotifications } from "@/services/native/notification-service";

export function useNativeNotificationSync() {
  const { data } = useHermesSnapshot();
  useEffect(() => {
    void nativePreferencesService
      .get()
      .then((preferences) => syncLocalNotifications(data, preferences));
  }, [data]);
}
