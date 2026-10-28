import { companySchema } from "@/lib/company-schema";
import { ConfigError, QUESTIONNAIRE_VERSION, getRepo } from "@/lib/db";
import { z } from "zod";

const MAX_BODY_BYTES = 20_000;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Cria o cadastro da empresa e um rascunho de diagnóstico. Devolve o token do rascunho.
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "Requisição grande demais." }, 413);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  // Campo-isca: pessoas não o veem; robôs costumam preenchê-lo. Responde como se tivesse dado certo.
  if (typeof body.hp === "string" && body.hp.trim() !== "") {
    return json({ token: "0".repeat(64) }, 201);
  }

  const parsed = companySchema.safeParse(body.company);
  if (!parsed.success) {
    return json({ error: "Dados inválidos.", fields: z.flattenError(parsed.error).fieldErrors }, 400);
  }

  try {
    const repo = await getRepo();
    const { token } = await repo.createDraft(parsed.data, QUESTIONNAIRE_VERSION);
    return json({ token }, 201);
  } catch (e) {
    if (e instanceof ConfigError) return json({ error: "Serviço indisponível no momento." }, 503);
    // Não registra o conteúdo da requisição: contém dados de empresas.
    console.error("Falha ao criar diagnóstico:", e instanceof Error ? e.message : "erro desconhecido");
    return json({ error: "Não foi possível salvar. Tente novamente." }, 500);
  }
}
