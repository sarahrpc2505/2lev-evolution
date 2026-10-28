import { z } from "zod";
import {
  BUSINESS_MODELS, CHANNELS, EMPLOYEES_RANGES, MAIN_GOALS, MARKETING_SPEND_RANGES,
  NONE_STRUCTURED, REVENUE_RANGES, SECTORS, STATES, values,
} from "./options";

const text = (label: string, max = 200) =>
  z.string().trim().min(1, `Informe ${label}.`).max(max, `${label} está longo demais.`);
const optionalText = (max = 300) =>
  z.string().trim().max(max, "Texto longo demais.").optional().transform((v) => (v ? v : null));

// Site: aceita "meusite.com.br" sem protocolo e normaliza para https://.
const optionalUrl = z
  .string().trim().max(300).optional()
  .transform((v) => (v ? v : null))
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      return u.hostname.includes(".");
    } catch { return false; }
  }, "Endereço de site inválido.")
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v));

// Instagram: aceita @perfil, perfil ou URL.
const optionalInstagram = z
  .string().trim().max(200).optional()
  .transform((v) => (v ? v : null))
  .refine((v) => !v || /^(@?[A-Za-z0-9._]{1,30}|https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._\/?=&-]+)$/i.test(v),
    "Informe o @ do perfil ou o link do Instagram.");

export const companySchema = z
  .object({
    name: text("o nome da empresa", 150),
    business_model: z.enum(values(BUSINESS_MODELS), { error: "Escolha o modelo de negócio." }),
    sector: z.enum(values(SECTORS), { error: "Escolha o setor de atuação." }),
    sector_other: optionalText(150),
    city: text("a cidade", 100),
    state: z.enum(STATES, { error: "Escolha o estado." }),
    website: optionalUrl,
    instagram: optionalInstagram,
    other_channels: optionalText(500),
    employees_range: z.enum(values(EMPLOYEES_RANGES), { error: "Escolha o número de funcionários." }),
    // Opcional: vazio vira null e não impede a conclusão.
    revenue_range: z.union([z.enum(values(REVENUE_RANGES)), z.literal("")]).optional()
      .transform((v) => (v ? v : null)),
    // Obrigatório e sem "prefiro não informar".
    marketing_spend_range: z.enum(values(MARKETING_SPEND_RANGES), {
      error: "Escolha quanto a empresa investe por mês em marketing.",
    }),
    channels: z.array(z.enum(values(CHANNELS)), { error: "Escolha ao menos um canal." })
      .min(1, "Escolha ao menos um canal."),
    main_goal: z.enum(values(MAIN_GOALS), { error: "Escolha o principal objetivo." }),
  })
  .superRefine((v, ctx) => {
    if (v.sector === "other" && !v.sector_other) {
      ctx.addIssue({ code: "custom", path: ["sector_other"], message: "Descreva o setor." });
    }
    if (v.channels.includes(NONE_STRUCTURED) && v.channels.length > 1) {
      ctx.addIssue({
        code: "custom", path: ["channels"],
        message: "“Não utilizamos canais de forma estruturada” não pode ser combinada com outros canais.",
      });
    }
  })
  // Setor só vale como "outros" quando for "outros".
  .transform((v) => ({ ...v, sector_other: v.sector === "other" ? v.sector_other : null }));

export type CompanyInput = z.output<typeof companySchema>;
