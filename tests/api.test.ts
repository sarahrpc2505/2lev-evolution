import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/diagnostics/route";
import { setRepoForTests } from "@/lib/db";
import { MemoryRepo } from "@/lib/db/memory";

const valid = {
  name: "Clínica Exemplo", business_model: "services", sector: "health_aesthetics",
  city: "Salvador", state: "BA", employees_range: "2_5", marketing_spend_range: "none",
  channels: ["referrals"], main_goal: "steady_inflow",
};
const req = (body: unknown) =>
  new Request("http://localhost/api/diagnostics", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

describe("POST /api/diagnostics", () => {
  let repo: MemoryRepo;
  beforeEach(() => { repo = new MemoryRepo(); setRepoForTests(repo); });
  afterEach(() => { setRepoForTests(undefined); vi.restoreAllMocks(); });

  it("cria o rascunho e devolve um token longo", async () => {
    const res = await POST(req({ company: valid }));
    expect(res.status).toBe(201);
    const { token } = await res.json();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(repo.companies.size).toBe(1);
    expect(await repo.getByToken(token)).toMatchObject({ status: "in_progress", companyName: "Clínica Exemplo" });
  });

  it("recusa dados inválidos com os campos com problema", async () => {
    const res = await POST(req({ company: { ...valid, marketing_spend_range: "prefer_not_say" } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields.marketing_spend_range).toBeTruthy();
    expect(repo.companies.size).toBe(0);
  });

  it("recusa JSON inválido e corpo grande demais", async () => {
    expect((await POST(req("não é json"))).status).toBe(400);
    expect((await POST(req("x".repeat(30_000)))).status).toBe(413);
  });

  it("campo-isca preenchido não grava nada", async () => {
    const res = await POST(req({ company: valid, hp: "robô" }));
    expect(res.status).toBe(201);
    expect(repo.companies.size).toBe(0);
  });

  it("sem banco configurado responde 503 sem vazar detalhes", async () => {
    setRepoForTests(undefined);
    vi.stubEnv("SUPABASE_URL", ""); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", ""); vi.stubEnv("DATA_BACKEND", "");
    const res = await POST(req({ company: valid }));
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toMatch(/supabase/i);
    vi.unstubAllEnvs();
  });

  it("falha do banco responde 500 genérico", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    repo.createDraft = async () => { throw new Error("detalhe interno"); };
    const res = await POST(req({ company: valid }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("detalhe interno");
  });
});
