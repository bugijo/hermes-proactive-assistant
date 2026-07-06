import { useEffect, useState } from "react";
import {
  defaultNativePreferences,
  nativePreferencesService,
  type NativePreferences,
} from "@/services/native/preferences-service";

export function useNativePreferences() {
  const [preferences, setPreferences] = useState<NativePreferences>(defaultNativePreferences);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void nativePreferencesService.get().then((value) => {
      setPreferences(value);
      setLoaded(true);
    });
  }, []);
  const update = <K extends keyof NativePreferences>(key: K, value: NativePreferences[K]) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      void nativePreferencesService.set(next);
      return next;
    });
  };
  return { preferences, update, loaded };
}
