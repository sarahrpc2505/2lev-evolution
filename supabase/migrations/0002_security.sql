-- 2Lev Evolution: segurança (grants, RLS, auditoria)
-- Princípio: o visitante (anon) não tem acesso a NENHUMA tabela. Toda escrita pública passa
-- pelo servidor do aplicativo, que usa a chave service_role (ignora RLS) e valida os dados.
-- A equipe acessa o painel autenticada (role authenticated + linha em admin_users).

-- --------------------------------------------------------------- funções de papel
create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin')
$$;

revoke all on function public.is_staff(), public.is_admin() from public, anon;
grant execute on function public.is_staff(), public.is_admin() to authenticated;

-- Auditoria: registra mudanças de classificação, status e prioridade, com o autor.
create function public.log_lead_changes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  f text;
  o text;
  n text;
begin
  foreach f in array array['commercial_class','commercial_status','strategic_priority','next_action','owner_id'] loop
    execute format('select ($1).%I::text, ($2).%I::text', f, f) into o, n using old, new;
    if o is distinct from n then
      insert into public.lead_events (lead_id, actor_id, field, old_value, new_value)
      values (new.id, auth.uid(), f, o, n);
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.log_lead_changes() from public, anon, authenticated;

create trigger leads_audit after update on public.leads
  for each row execute function public.log_lead_changes();

-- -------------------------------------------------------------------- grants
-- Remove o acesso padrão (no Supabase, anon e authenticated recebem tudo por padrão).
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Equipe autenticada: só o necessário, sem DELETE (retenção e exclusão serão definidas à parte).
grant select on public.companies, public.contacts, public.consents, public.diagnostics,
                public.leads, public.lead_events, public.lead_notes, public.lead_analyses,
                public.services, public.admin_users to authenticated;
grant insert on public.lead_notes, public.lead_analyses, public.services to authenticated;
-- UPDATE por coluna: a equipe não consegue alterar origem, vínculos nem identificadores.
grant update (preliminary_class, commercial_class, class_justification, commercial_status,
              strategic_priority, next_action, next_action_due, owner_id)
  on public.leads to authenticated;
grant update on public.lead_analyses, public.services to authenticated;

-- ------------------------------------------------------------------------- RLS
alter table public.companies     enable row level security;
alter table public.contacts      enable row level security;
alter table public.consents      enable row level security;
alter table public.diagnostics   enable row level security;
alter table public.leads         enable row level security;
alter table public.lead_notes    enable row level security;
alter table public.lead_analyses enable row level security;
alter table public.lead_events   enable row level security;
alter table public.services      enable row level security;
alter table public.admin_users   enable row level security;

create policy staff_read on public.companies     for select to authenticated using (public.is_staff());
create policy staff_read on public.contacts      for select to authenticated using (public.is_staff());
create policy staff_read on public.consents      for select to authenticated using (public.is_staff());
create policy staff_read on public.diagnostics   for select to authenticated using (public.is_staff());
create policy staff_read on public.lead_events   for select to authenticated using (public.is_staff());
create policy staff_read on public.services      for select to authenticated using (public.is_staff());

create policy staff_read   on public.leads for select to authenticated using (public.is_staff());
create policy staff_update on public.leads for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy staff_read   on public.lead_notes for select to authenticated using (public.is_staff());
create policy staff_insert on public.lead_notes for insert to authenticated
  with check (public.is_staff() and author_id = auth.uid());

create policy staff_read   on public.lead_analyses for select to authenticated using (public.is_staff());
create policy staff_insert on public.lead_analyses for insert to authenticated
  with check (public.is_staff() and analyst_id = auth.uid());
create policy staff_update on public.lead_analyses for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Catálogo: só administradores alteram.
create policy admin_insert on public.services for insert to authenticated with check (public.is_admin());
create policy admin_update on public.services for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Cada pessoa vê apenas a própria linha; gestão da equipe é feita pelo servidor.
create policy self_read on public.admin_users for select to authenticated using (user_id = auth.uid());
