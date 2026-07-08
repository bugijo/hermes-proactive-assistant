import { useEffect, useState } from "react";
import {
  defaultNativePreferences,
  nativePreferencesService,
  type NativePreferences,
} from "@/services/native/preferences-service";

export function useNativePreferences() {
  const [preferences, setPreferences] = useState<NativePreferences>(defaultNativePreferences);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void nativePreferencesService.get().then((value) => {
      setPreferences(value);
      setLoaded(true);
    });
  }, []);
  const update = async <K extends keyof NativePreferences>(key: K, value: NativePreferences[K]) => {
    const next = { ...preferences, [key]: value };
    setSaving(true);
    setError("");
    try {
      await nativePreferencesService.set(next);
      setPreferences(next);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar a preferência.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { preferences, update, loaded, saving, error };
}
