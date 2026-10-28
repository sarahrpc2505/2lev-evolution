import type { CompanyInput } from "../company-schema";

export type DraftDiagnostic = { diagnosticId: string; token: string };
export type DiagnosticStatus = { status: string; companyName: string };

// Camada de acesso a dados. A aplicação só conversa com esta interface,
// o que permite trocar de provedor de banco sem mexer nas regras.
export interface DiagnosticsRepo {
  createDraft(company: CompanyInput, questionnaireVersion: string): Promise<DraftDiagnostic>;
  getByToken(token: string): Promise<DiagnosticStatus | null>;
}
