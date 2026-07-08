import { z } from "zod";
import { ApiError, readJson } from "./http";

const shortText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} é obrigatório.`).max(max, `${label} é muito longo.`);
const confirmationStatus = z.enum(["draft", "pending_confirmation", "confirmed"]);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário deve usar HH:MM.");
const identifier = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9._:-]+$/, "Identificador inválido.");
const boundedPayload = z
  .unknown()
  .refine((value) => JSON.stringify(value ?? null).length <= 4096, "Payload muito grande.");

const nonEmptyPartial = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");

export const schemas = {
  register: z
    .object({
      name: shortText("Nome", 100),
      email: z
        .string()
        .trim()
        .email("E-mail inválido.")
        .max(254)
        .transform((v) => v.toLowerCase()),
      password: z.string().min(10, "A senha deve ter pelo menos 10 caracteres.").max(128),
    })
    .strict(),
  login: z
    .object({
      email: z
        .string()
        .trim()
        .email("E-mail inválido.")
        .max(254)
        .transform((v) => v.toLowerCase()),
      password: z.string().min(1, "Senha é obrigatória.").max(128),
    })
    .strict(),
  suggestionCreate: z
    .object({
      type: z.enum(["promo", "reminder", "message", "task"]),
      title: shortText("Título", 200),
      description: shortText("Descrição", 2000),
      time: shortText("Horário", 80).optional(),
    })
    .strict(),
  suggestionUpdate: nonEmptyPartial({
    state: z.enum(["pending", "approved", "ignored", "later"]).optional(),
    confirmationStatus: confirmationStatus.optional(),
  }).superRefine((value, context) => {
    if (value.state === "approved" && value.confirmationStatus !== "confirmed")
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmationStatus"],
        message: "Aprovação exige confirmação explícita.",
      });
  }),
  promotionCreate: z
    .object({
      category: shortText("Categoria", 80),
      name: shortText("Nome", 200),
      price: z.number().finite().nonnegative().optional(),
      target: z.number().finite().nonnegative().optional(),
      score: z.number().finite().min(0).max(10).optional(),
      status: z.enum(["Comprar agora", "Esperar", "Ruim", "Suspeita"]).optional(),
      url: z.union([z.literal("#"), z.string().url("URL inválida.").max(2048)]).optional(),
    })
    .strict(),
  promotionUpdate: nonEmptyPartial({
    category: shortText("Categoria", 80).optional(),
    name: shortText("Nome", 200).optional(),
    price: z.number().finite().nonnegative().optional(),
    target: z.number().finite().nonnegative().optional(),
    score: z.number().finite().min(0).max(10).optional(),
    status: z.enum(["Comprar agora", "Esperar", "Ruim", "Suspeita"]).optional(),
    url: z.union([z.literal("#"), z.string().url("URL inválida.").max(2048)]).optional(),
    confirmationStatus: confirmationStatus.optional(),
  }),
  automationCreate: z
    .object({
      name: shortText("Nome", 200),
      description: shortText("Descrição", 2000),
      enabled: z.boolean().optional(),
      frequency: shortText("Frequência", 80).optional(),
      impact: z.enum(["baixo", "médio", "alto"]).optional(),
      permissions: z.array(shortText("Permissão", 80)).max(20).optional(),
    })
    .strict(),
  automationUpdate: nonEmptyPartial({
    name: shortText("Nome", 200).optional(),
    description: shortText("Descrição", 2000).optional(),
    enabled: z.boolean().optional(),
    frequency: shortText("Frequência", 80).optional(),
    impact: z.enum(["baixo", "médio", "alto"]).optional(),
    permissions: z.array(shortText("Permissão", 80)).max(20).optional(),
    confirmationStatus: confirmationStatus.optional(),
  }).superRefine((value, context) => {
    if (value.enabled !== undefined && value.confirmationStatus !== "confirmed")
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmationStatus"],
        message: "Alterar automação exige confirmação explícita.",
      });
  }),
  permissionCreate: z
    .object({
      title: shortText("Título", 160),
      description: z.string().trim().max(1000).optional(),
      granted: z.boolean().optional(),
    })
    .strict(),
  permissionUpdate: nonEmptyPartial({
    granted: z.boolean().optional(),
    confirmationStatus: confirmationStatus.optional(),
  }).superRefine((value, context) => {
    if (value.granted !== undefined && value.confirmationStatus !== "confirmed")
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmationStatus"],
        message: "Alterar permissão exige confirmação explícita.",
      });
  }),
  securityUpdate: z
    .object({ enabled: z.boolean(), confirmationStatus: confirmationStatus.optional() })
    .strict(),
  chatCreate: z
    .object({
      text: shortText("Mensagem", 4000),
      sessionId: identifier.optional(),
      confirmationStatus: confirmationStatus.optional(),
    })
    .strict(),
  chatUpdate: nonEmptyPartial({
    text: shortText("Mensagem", 4000).optional(),
    confirmationStatus: confirmationStatus.optional(),
  }),
  pairingTokenCreate: z
    .object({ ttlSeconds: z.number().int().min(1).max(300).optional() })
    .strict(),
  pairingClaim: z
    .object({
      code: z.string().regex(/^[A-F0-9]{8}$/, "Código de pareamento inválido."),
      token: z.string().min(40).max(128).startsWith("pair_"),
      deviceName: shortText("Nome do dispositivo", 100),
      publicKey: shortText("Chave pública", 2048),
    })
    .strict(),
  preferences: nonEmptyPartial({
    batterySaver: z.boolean().optional(),
    limitMobileData: z.boolean().optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietStart: time.optional(),
    quietEnd: time.optional(),
    syncFrequency: z.enum(["manual", "15m", "30m", "1h", "6h"]).optional(),
    notificationsEnabled: z.boolean().optional(),
  }),
  notificationCreate: z
    .object({
      title: shortText("Título", 160),
      description: shortText("Descrição", 1000),
      type: shortText("Tipo", 80).optional(),
      scheduledFor: z.string().datetime({ offset: true }).optional(),
    })
    .strict(),
  taskCreate: z
    .object({
      title: shortText("Título", 200),
      description: z.string().trim().max(2000).optional(),
      priority: z.enum(["baixa", "média", "alta"]).optional(),
      category: shortText("Categoria", 80).optional(),
      reminderAt: z.string().datetime({ offset: true }).optional(),
    })
    .strict(),
  taskUpdate: nonEmptyPartial({
    title: shortText("Título", 200).optional(),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["baixa", "média", "alta"]).optional(),
    category: shortText("Categoria", 80).optional(),
    reminderAt: z.string().datetime({ offset: true }).optional(),
    status: z.enum(["pendente", "em andamento", "concluída", "cancelada"]).optional(),
  }),
  nativeAction: z
    .object({
      action: z.enum([
        "open_app",
        "open_external",
        "share",
        "local_notification",
        "send_message",
        "purchase",
        "delete_file",
        "remote_command",
        "control_screen",
      ]),
      payload: boundedPayload.optional(),
      confirmationStatus: confirmationStatus.optional(),
    })
    .strict(),
  clientNote: z
    .object({
      message: shortText("Mensagem", 1000),
      context: z
        .record(z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]))
        .refine((value) => Object.keys(value).length <= 20, "Contexto muito grande.")
        .optional(),
    })
    .strict(),
  confirmedDelete: z.object({ confirmationStatus: z.literal("confirmed") }).strict(),
};

export async function validatedJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  const payload = await readJson<unknown>(request);
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  throw new ApiError(400, "INVALID_PAYLOAD", "Payload inválido.", {
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export type ValidationSchemas = typeof schemas;
