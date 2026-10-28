import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CompanyInput } from "../company-schema";
import type { DiagnosticStatus, DiagnosticsRepo, DraftDiagnostic } from "./repo";

// Usa a chave service_role, que ignora o RLS. Só roda no servidor.
export class SupabaseRepo implements DiagnosticsRepo {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  async createDraft(company: CompanyInput, questionnaireVersion: string): Promise<DraftDiagnostic> {
    const { data: c, error: ce } = await this.client
      .from("companies").insert(company).select("id").single();
    if (ce || !c) throw new Error(`companies: ${ce?.message ?? "sem retorno"}`);

    const { data: d, error: de } = await this.client
      .from("diagnostics")
      .insert({ company_id: c.id, questionnaire_version: questionnaireVersion })
      .select("id, public_token").single();
    if (de || !d) {
      // Sem transação entre as duas gravações: desfaz a empresa para não deixar registro órfão.
      await this.client.from("companies").delete().eq("id", c.id);
      throw new Error(`diagnostics: ${de?.message ?? "sem retorno"}`);
    }
    return { diagnosticId: d.id, token: d.public_token };
  }

  async getByToken(token: string): Promise<DiagnosticStatus | null> {
    const { data, error } = await this.client
      .from("diagnostics").select("status, companies(name)").eq("public_token", token).maybeSingle();
    if (error) throw new Error(`diagnostics: ${error.message}`);
    if (!data) return null;
    const companies = data.companies as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(companies) ? companies[0]?.name : companies?.name;
    return { status: data.status, companyName: name ?? "" };
  }
}
