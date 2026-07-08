import { expect, test } from "bun:test";
import { securityPolicyPresentation } from "./security-policy";

test("controle sem enforcement não aparece como ativo", () => {
  expect(
    securityPolicyPresentation({
      id: "future",
      title: "Controle futuro",
      description: "Ainda sem enforcement",
      enabled: true,
      enforced: false,
    }),
  ).toEqual({ active: false, label: "Em preparação" });
});

test("política obrigatória é apresentada como ativa", () => {
  expect(
    securityPolicyPresentation({
      id: "sec1",
      title: "Confirmação",
      description: "Fail-closed",
      enabled: true,
      enforced: true,
    }),
  ).toEqual({ active: true, label: "Política obrigatória" });
});
