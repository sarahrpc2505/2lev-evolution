import type { DiagnosticsRepo } from "./repo";
import { MemoryRepo } from "./memory";

export const QUESTIONNAIRE_VERSION = "v1-draft";

let repo: DiagnosticsRepo | undefined;
// No modo de demonstração, rota e página rodam em módulos separados: o repositório em memória
// precisa viver em globalThis para ser o mesmo nos dois.
const globalForMemory = globalThis as unknown as { __memoryRepo?: MemoryRepo };

export class ConfigError extends Error {}

export async function getRepo(): Promise<DiagnosticsRepo> {
  if (repo) return repo;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const { SupabaseRepo } = await import("./supabase");
    repo = new SupabaseRepo(url, key);
  } else if (process.env.DATA_BACKEND === "memory" && process.env.NODE_ENV !== "production") {
    // Demonstração local sem banco. Os dados somem ao reiniciar.
    repo = globalForMemory.__memoryRepo ??= new MemoryRepo();
  } else {
    throw new ConfigError("Banco de dados não configurado.");
  }
  return repo;
}

export function setRepoForTests(r: DiagnosticsRepo | undefined) { repo = r; }
