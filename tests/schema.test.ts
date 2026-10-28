import { describe, expect, it } from "vitest";
import { companySchema } from "@/lib/company-schema";

const valid = {
  name: "Clínica Exemplo", business_model: "services", sector: "health_aesthetics",
  city: "Salvador", state: "BA", employees_range: "2_5", marketing_spend_range: "none",
  channels: ["referrals"], main_goal: "steady_inflow",
};

describe("cadastro da empresa", () => {
  it("aceita o mínimo obrigatório e trata opcionais vazios como nulos", () => {
    const r = companySchema.safeParse({ ...valid, website: "", instagram: "", revenue_range: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.website).toBeNull();
      expect(r.data.instagram).toBeNull();
      expect(r.data.revenue_range).toBeNull();
    }
  });

  it("modelo de negócio e setor são campos independentes", () => {
    const r = companySchema.safeParse({ ...valid, business_model: "products_online", sector: "retail" });
    expect(r.success && r.data.business_model === "products_online" && r.data.sector === "retail").toBe(true);
  });

  it("recusa a opção 'ambos' para o modelo de negócio na v1", () => {
    expect(companySchema.safeParse({ ...valid, business_model: "both" }).success).toBe(false);
  });

  it("investimento em marketing é obrigatório e não aceita 'prefiro não informar'", () => {
    const { marketing_spend_range: _omit, ...semInvest } = valid;
    expect(companySchema.safeParse(semInvest).success).toBe(false);
    expect(companySchema.safeParse({ ...valid, marketing_spend_range: "prefer_not_say" }).success).toBe(false);
    expect(companySchema.safeParse({ ...valid, marketing_spend_range: "" }).success).toBe(false);
  });

  it("'não investimos atualmente' é uma resposta válida", () => {
    expect(companySchema.safeParse({ ...valid, marketing_spend_range: "none" }).success).toBe(true);
  });

  it("faturamento aceita 'prefiro não informar' e pode ficar em branco", () => {
    expect(companySchema.safeParse({ ...valid, revenue_range: "prefer_not_say" }).success).toBe(true);
    expect(companySchema.safeParse({ ...valid }).success).toBe(true);
  });

  it("setor 'outros' exige descrição; nos demais a descrição é descartada", () => {
    expect(companySchema.safeParse({ ...valid, sector: "other" }).success).toBe(false);
    const ok = companySchema.safeParse({ ...valid, sector: "other", sector_other: "Pet shop" });
    expect(ok.success && ok.data.sector_other === "Pet shop").toBe(true);
    const descartado = companySchema.safeParse({ ...valid, sector: "retail", sector_other: "qualquer" });
    expect(descartado.success && descartado.data.sector_other === null).toBe(true);
  });

  it("'sem canais estruturados' é exclusivo", () => {
    expect(companySchema.safeParse({ ...valid, channels: ["none_structured"] }).success).toBe(true);
    expect(companySchema.safeParse({ ...valid, channels: ["none_structured", "instagram"] }).success).toBe(false);
    expect(companySchema.safeParse({ ...valid, channels: [] }).success).toBe(false);
  });

  it("normaliza o site e valida o Instagram", () => {
    const r = companySchema.safeParse({ ...valid, website: "exemplo.com.br", instagram: "@clinica.exemplo" });
    expect(r.success && r.data.website === "https://exemplo.com.br").toBe(true);
    expect(companySchema.safeParse({ ...valid, website: "isso nao e site" }).success).toBe(false);
    expect(companySchema.safeParse({ ...valid, instagram: "@@@ inválido!!" }).success).toBe(false);
  });

  it("estado precisa ser uma UF válida", () => {
    expect(companySchema.safeParse({ ...valid, state: "XX" }).success).toBe(false);
  });
});
