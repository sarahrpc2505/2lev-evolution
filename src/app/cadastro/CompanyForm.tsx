"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { companySchema } from "@/lib/company-schema";
import {
  BUSINESS_MODELS, CHANNELS, EMPLOYEES_RANGES, MAIN_GOALS, MARKETING_SPEND_RANGES,
  NONE_STRUCTURED, REVENUE_RANGES, SECTORS, STATES, type Option,
} from "@/lib/options";

type Form = {
  name: string; business_model: string; sector: string; sector_other: string;
  city: string; state: string; website: string; instagram: string; other_channels: string;
  employees_range: string; revenue_range: string; marketing_spend_range: string;
  channels: string[]; main_goal: string;
};

const EMPTY: Form = {
  name: "", business_model: "", sector: "", sector_other: "", city: "", state: "",
  website: "", instagram: "", other_channels: "", employees_range: "", revenue_range: "",
  marketing_spend_range: "", channels: [], main_goal: "",
};
const STORAGE_KEY = "evolution.company.draft";

function Radios(props: {
  name: string; legend: string; help?: string; options: Option[]; value: string;
  onChange: (v: string) => void; error?: string;
}) {
  const { name, legend, help, options, value, onChange, error } = props;
  return (
    <fieldset aria-describedby={error ? `${name}-err` : undefined}>
      <legend>{legend}</legend>
      {help && <p className="help">{help}</p>}
      <div className="opts">
        {options.map((o) => (
          <label className="opt" key={o.value}>
            <input type="radio" name={name} value={o.value} checked={value === o.value}
              onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="err" id={`${name}-err`} role="alert">{error}</p>}
    </fieldset>
  );
}

export default function CompanyForm() {
  const router = useRouter();
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState("");

  // Recupera o que já foi preenchido, para não perder as respostas ao recarregar.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setF({ ...EMPTY, ...JSON.parse(saved) });
    } catch { /* sem armazenamento: segue em branco */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch { /* ignora */ }
  }, [f]);

  // Ao corrigir um campo, o aviso dele some na hora.
  const clearError = (k: string) =>
    setErrors((e) => { if (!(k in e)) return e; const { [k]: _gone, ...rest } = e; return rest; });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((p) => ({ ...p, [k]: v })); clearError(k); };

  const toggleChannel = (value: string) => {
    clearError("channels");
    setF((p) => {
      const has = p.channels.includes(value);
      if (has) return { ...p, channels: p.channels.filter((c) => c !== value) };
      // "Não utilizamos canais estruturados" é exclusivo.
      if (value === NONE_STRUCTURED) return { ...p, channels: [NONE_STRUCTURED] };
      return { ...p, channels: [...p.channels.filter((c) => c !== NONE_STRUCTURED), value] };
    });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);
    const parsed = companySchema.safeParse(f);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setBanner("Revise os campos destacados para continuar.");
      document.getElementById(Object.keys(next)[0])?.focus?.();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: f, hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignora */ }
        router.push(`/diagnostico/${data.token}`);
        return;
      }
      if (res.status === 400 && data.fields) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.fields as Record<string, string[]>)) next[k] = v[0];
        setErrors(next);
      }
      setBanner(data.error ?? "Não foi possível continuar. Suas respostas foram mantidas; tente novamente.");
    } catch {
      setBanner("Sem conexão no momento. Suas respostas foram mantidas; tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k];
  const text = (id: keyof Form, label: string, opts?: { help?: string; required?: boolean; placeholder?: string }) => (
    <div className="field">
      <label htmlFor={id}>{label}{opts?.required ? "" : " (opcional)"}</label>
      {opts?.help && <p className="help">{opts.help}</p>}
      <input id={id} type="text" value={f[id] as string} placeholder={opts?.placeholder}
        autoComplete="off" onChange={(e) => set(id, e.target.value as never)}
        aria-invalid={!!err(id)} aria-describedby={err(id) ? `${id}-err` : undefined} />
      {err(id) && <p className="err" id={`${id}-err`} role="alert">{err(id)}</p>}
    </div>
  );

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      {banner && <p className="alert" role="alert">{banner}</p>}

      {text("name", "Nome da empresa", { required: true })}

      <Radios name="business_model" legend="Qual é o modelo de negócio da sua empresa?" options={BUSINESS_MODELS}
        value={f.business_model} onChange={(v) => set("business_model", v)} error={err("business_model")} />

      <div className="field">
        <label htmlFor="sector">Em qual setor sua empresa atua?</label>
        <select id="sector" value={f.sector} onChange={(e) => set("sector", e.target.value)}
          aria-invalid={!!err("sector")} aria-describedby={err("sector") ? "sector-err" : undefined}>
          <option value="">Selecione</option>
          {SECTORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {err("sector") && <p className="err" id="sector-err" role="alert">{err("sector")}</p>}
      </div>
      {f.sector === "other" && text("sector_other", "Descreva o setor", { required: true })}

      <div className="row">
        {text("city", "Cidade", { required: true })}
        <div className="field">
          <label htmlFor="state">Estado</label>
          <select id="state" value={f.state} onChange={(e) => set("state", e.target.value)}
            aria-invalid={!!err("state")} aria-describedby={err("state") ? "state-err" : undefined}>
            <option value="">UF</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {err("state") && <p className="err" id="state-err" role="alert">{err("state")}</p>}
        </div>
      </div>

      {text("website", "Site", { placeholder: "exemplo.com.br" })}
      {text("instagram", "Instagram", { placeholder: "@seuperfil" })}
      {text("other_channels", "Outros canais digitais", { help: "Links ou nomes, separados por vírgula." })}

      <Radios name="employees_range" legend="Quantas pessoas trabalham na empresa?" options={EMPLOYEES_RANGES}
        value={f.employees_range} onChange={(v) => set("employees_range", v)} error={err("employees_range")} />

      <div className="field">
        <label htmlFor="revenue_range">Faturamento mensal aproximado (opcional)</label>
        <select id="revenue_range" value={f.revenue_range} onChange={(e) => set("revenue_range", e.target.value)}>
          <option value="">Selecione</option>
          {REVENUE_RANGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="help">Pode pular. O diagnóstico funciona do mesmo jeito sem essa informação.</p>
      </div>

      <Radios name="marketing_spend_range" legend="Quanto sua empresa investe por mês em marketing?"
        help="Considere o investimento total em marketing, incluindo serviços contratados, produção de conteúdo e divulgação paga."
        options={MARKETING_SPEND_RANGES} value={f.marketing_spend_range}
        onChange={(v) => set("marketing_spend_range", v)} error={err("marketing_spend_range")} />

      <fieldset aria-describedby={err("channels") ? "channels-err" : undefined}>
        <legend>Quais canais sua empresa utiliza para atrair ou se relacionar com clientes?</legend>
        <p className="help">Marque todos que se aplicam.</p>
        <div className="opts" id="channels">
          {CHANNELS.map((o) => (
            <label className="opt" key={o.value}>
              <input type="checkbox" checked={f.channels.includes(o.value)} onChange={() => toggleChannel(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {err("channels") && <p className="err" id="channels-err" role="alert">{err("channels")}</p>}
      </fieldset>

      <Radios name="main_goal" legend="O que sua empresa mais precisa neste momento?" options={MAIN_GOALS}
        value={f.main_goal} onChange={(v) => set("main_goal", v)} error={err("main_goal")} />

      {/* Campo-isca contra robôs: invisível para pessoas. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="hp">Não preencha este campo</label>
        <input id="hp" type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Salvando..." : "Continuar"}</button>
      </div>
    </form>
  );
}
