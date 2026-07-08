import type { SecuritySetting } from "@/types/hermes";

export function securityPolicyPresentation(setting: SecuritySetting) {
  const enforced = setting.enforced === true;
  return {
    active: enforced && setting.enabled,
    label: enforced ? "Política obrigatória" : "Em preparação",
  };
}
