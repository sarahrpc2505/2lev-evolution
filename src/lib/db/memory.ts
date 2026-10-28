import { randomBytes, randomUUID } from "node:crypto";
import type { CompanyInput } from "../company-schema";
import type { DiagnosticStatus, DiagnosticsRepo, DraftDiagnostic } from "./repo";

// Só para testes e demonstração local. Nunca usado em produção (ver db/index.ts).
export class MemoryRepo implements DiagnosticsRepo {
  companies = new Map<string, CompanyInput>();
  diagnostics = new Map<string, { companyId: string; token: string; status: string }>();

  async createDraft(company: CompanyInput): Promise<DraftDiagnostic> {
    const companyId = randomUUID();
    const diagnosticId = randomUUID();
    const token = randomBytes(32).toString("hex");
    this.companies.set(companyId, company);
    this.diagnostics.set(diagnosticId, { companyId, token, status: "in_progress" });
    return { diagnosticId, token };
  }

  async getByToken(token: string): Promise<DiagnosticStatus | null> {
    for (const d of this.diagnostics.values()) {
      if (d.token === token) {
        return { status: d.status, companyName: this.companies.get(d.companyId)!.name };
      }
    }
    return null;
  }
}
