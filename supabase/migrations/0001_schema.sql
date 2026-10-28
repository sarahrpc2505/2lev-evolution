-- 2Lev Evolution: esquema inicial (MVP 1.0)
-- Identificadores em inglês (snake_case); comentários em português.
-- Segurança (grants e RLS) fica em 0002_security.sql.

-- ---------------------------------------------------------------- utilitários
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ------------------------------------------------------------------ empresas
-- Cadastro E01..E13. Modelo de negócio e setor são campos separados.
create table public.companies (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null check (length(btrim(name)) > 0),
  business_model        text not null check (business_model in
                          ('services','products_online','products_physical')),
  sector                text not null check (sector in
                          ('health_aesthetics','industry','retail','technology','food',
                           'agribusiness','real_estate_construction','professional_services','other')),
  sector_other          text,
  city                  text not null check (length(btrim(city)) > 0),
  state                 text not null check (state ~ '^[A-Z]{2}$'),
  website               text,
  instagram             text,
  other_channels        text,
  employees_range       text not null check (employees_range in
                          ('solo','2_5','6_10','11_20','21_50','over_50')),
  -- Faturamento é opcional e as faixas são configuráveis (sem check de valores).
  revenue_range         text,
  -- Obrigatório, sem "prefiro não informar"; 'none' é resposta válida.
  marketing_spend_range text not null check (marketing_spend_range in
                          ('none','up_500','501_1500','1501_3000','3001_5000','5001_10000','over_10000')),
  channels              text[] not null,
  main_goal             text not null check (main_goal in
                          ('more_contacts_short_term','steady_inflow','brand_differentiation',
                           'organize_and_measure','improve_service_and_closing','prepare_to_grow')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint sector_other_required check (sector <> 'other' or length(btrim(coalesce(sector_other,''))) > 0),
  constraint channels_valid check (
    channels <@ array['referrals','instagram','facebook','google_search','paid_ads','website_blog',
                      'whatsapp','email','tiktok','linkedin','youtube','sales_prospecting','other',
                      'none_structured']
    and cardinality(channels) >= 1
    -- "Não utilizamos canais de forma estruturada" é exclusivo.
    and (not ('none_structured' = any(channels)) or cardinality(channels) = 1)
  )
);
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ contatos
-- Uma empresa pode ter vários contatos. E-mail e telefone não identificam a empresa.
create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id),
  name        text not null check (length(btrim(name)) > 0),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone_e164  text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  role        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index contacts_company_idx on public.contacts (company_id);
-- Índice não único: serve para sinalizar possíveis duplicidades, nunca para mesclar sozinho.
create index contacts_email_idx on public.contacts (lower(email));
create index contacts_phone_idx on public.contacts (phone_e164);
create trigger contacts_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------- consentimentos
-- Histórico por finalidade. Aceitar o diagnóstico não implica consentir com marketing.
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid not null references public.contacts(id),
  purpose        text not null check (purpose in ('diagnostic_processing','marketing_communications')),
  granted        boolean not null,
  notice_version text not null,
  ip_hash        text,
  user_agent     text,
  created_at     timestamptz not null default now()
);
create index consents_contact_idx on public.consents (contact_id, purpose, created_at desc);

-- --------------------------------------------------------------- diagnósticos
create table public.diagnostics (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id),
  contact_id            uuid references public.contacts(id),
  questionnaire_version text not null,
  -- Link do relatório e retomada do rascunho: identificador longo e imprevisível (>= 244 bits).
  public_token          text not null unique
                          default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  status                text not null default 'in_progress' check (status in
                          ('in_progress','awaiting_contact','completed','abandoned')),
  answers               jsonb not null default '{}'::jsonb,
  question_order        jsonb not null default '[]'::jsonb,
  path                  jsonb not null default '[]'::jsonb,
  dimensions            jsonb not null default '{}'::jsonb,
  report                jsonb,
  report_version        text,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index diagnostics_company_idx on public.diagnostics (company_id);
create index diagnostics_status_idx on public.diagnostics (status, started_at desc);
create trigger diagnostics_updated_at before update on public.diagnostics
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------- leads
-- Maturidade (diagnostics.dimensions), prioridade estratégica e classificação comercial
-- são resultados separados.
create table public.leads (
  id                       uuid primary key default gen_random_uuid(),
  company_id               uuid not null references public.companies(id),
  contact_id               uuid not null references public.contacts(id),
  diagnostic_id            uuid references public.diagnostics(id),
  preliminary_class        text check (preliminary_class in ('A','B','C')),
  commercial_class         text check (commercial_class in ('A','B','C')),
  class_justification      text,
  commercial_status        text not null default 'new' check (commercial_status in
                             ('new','in_review','priority_set','contacted','meeting_scheduled',
                              'proposal_sent','converted','lost','nurturing')),
  strategic_priority       text,
  next_action              text,
  next_action_due          date,
  owner_id                 uuid references auth.users(id),
  -- Origem (preparada para a V2; no MVP a origem principal é o diagnóstico).
  source_channel           text not null default 'diagnostic',
  source_platform          text,
  external_contact_id      text,
  external_conversation_id text,
  first_seen_at            timestamptz not null default now(),
  last_interaction_at      timestamptz not null default now(),
  consent_status           text not null default 'diagnostic_only' check (consent_status in
                             ('diagnostic_only','marketing_granted','marketing_revoked')),
  lead_origin_details      jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index leads_company_idx on public.leads (company_id);
create index leads_status_idx on public.leads (commercial_status, created_at desc);
create index leads_class_idx on public.leads (commercial_class);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- Observações internas (várias por lead, com autoria).
create table public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id),
  author_id  uuid references auth.users(id),
  body       text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

-- Análise estratégica manual (§14.4).
create table public.lead_analyses (
  id                     uuid primary key default gen_random_uuid(),
  lead_id                uuid not null references public.leads(id),
  confirmed_bottleneck   text,
  opportunity            text,
  recommended_solution   text,
  justification          text,
  execution_sequence     text,
  next_commercial_action text,
  analyzed_at            date,
  analyst_id             uuid references auth.users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index lead_analyses_lead_idx on public.lead_analyses (lead_id);
create trigger lead_analyses_updated_at before update on public.lead_analyses
  for each row execute function public.set_updated_at();

-- Histórico de alterações relevantes (preenchido por trigger, ver 0002).
create table public.lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id),
  actor_id   uuid,
  field      text not null,
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);
create index lead_events_lead_idx on public.lead_events (lead_id, created_at desc);

-- ------------------------------------------------------------ catálogo de serviços
-- suggestion_mode:
--   auto_if_clear: pode aparecer como sugestão ao lead, só quando a regra deixar claro;
--   manual_only:   nunca é sugerido automaticamente; vira "ponto a investigar" e checklist interno.
create table public.services (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  name                   text not null,
  description            text,
  category               text not null check (category in ('entry','recurring','complementary')),
  dimensions             text[] not null default '{}' check (dimensions <@ array['A','B','C','D']),
  problems_solved        text,
  required_conditions    text,
  suitable_profile       text,
  delivery_type          text,
  complementary_slugs    text[] not null default '{}',
  next_steps             text,
  availability           text not null default 'available' check (availability in ('available','unavailable')),
  suggestion_mode        text not null default 'manual_only' check (suggestion_mode in ('auto_if_clear','manual_only')),
  research_checklist     text[] not null default '{}',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- equipe (painel)
create table public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null default 'analyst' check (role in ('admin','analyst')),
  created_at timestamptz not null default now()
);
