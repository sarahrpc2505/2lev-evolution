import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_MODELS, CHANNELS, EMPLOYEES_RANGES, MAIN_GOALS, MARKETING_SPEND_RANGES, SECTORS,
} from "@/lib/options";

// Garante que as opções da tela são exatamente as aceitas pelo banco.
const sql = readFileSync(path.resolve(__dirname, "../supabase/migrations/0001_schema.sql"), "utf8");

function dbValues(column: string): string[] {
  const re = new RegExp(`${column}\\s+text[^\\n]*check \\(${column} in\\s*\\(([^)]*)\\)`, "s");
  const m = sql.match(re);
  if (!m) throw new Error(`coluna ${column} não encontrada no esquema`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
}
const ui = (o: { value: string }[]) => o.map((x) => x.value).sort();

describe("opções da tela x banco", () => {
  it("modelo de negócio", () => expect(ui(BUSINESS_MODELS)).toEqual(dbValues("business_model")));
  it("setor", () => expect(ui(SECTORS)).toEqual(dbValues("sector")));
  it("funcionários", () => expect(ui(EMPLOYEES_RANGES)).toEqual(dbValues("employees_range")));
  it("investimento em marketing", () => expect(ui(MARKETING_SPEND_RANGES)).toEqual(dbValues("marketing_spend_range")));
  it("objetivo", () => expect(ui(MAIN_GOALS)).toEqual(dbValues("main_goal")));
  it("canais", () => {
    const m = sql.match(/channels <@ array\[([^\]]*)\]/s)!;
    const dbChannels = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
    expect(ui(CHANNELS)).toEqual(dbChannels);
  });
});
