import { expect, test } from "bun:test";
import { buildNotificationPlan } from "./notification-service";
import { hermesSnapshot } from "../mock-hermes-data";

test("prepara notificações sem loop contínuo", () => {
  const plan = buildNotificationPlan(hermesSnapshot, false);
  expect(plan.some((item) => item.title === "Nova sugestão importante")).toBe(true);
  expect(plan.some((item) => item.title === "Preço-alvo atingido")).toBe(true);
  expect(plan.some((item) => item.title === "Tarefa pendente")).toBe(true);
  expect(plan.some((item) => item.title === "Hermes PC conectado")).toBe(true);
});
