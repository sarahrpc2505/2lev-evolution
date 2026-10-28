-- Testes de segurança e de regras do banco. Qualquer falha encerra com erro.
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null

create schema t;
grant usage on schema t to anon, authenticated, service_role;
create table t.log (ok boolean, label text);
grant all on t.log to anon, authenticated, service_role;

-- Espera que o comando falhe com o SQLSTATE indicado.
create function t.expect_error(sql text, expected text, label text) returns void
language plpgsql as $$
begin
  execute sql;
  insert into t.log values (false, label || ' (deveria falhar e passou)');
exception when others then
  if sqlstate = expected then
    insert into t.log values (true, label);
  else
    insert into t.log values (false, label || ' (esperado ' || expected || ', veio ' || sqlstate || ': ' || sqlerrm || ')');
  end if;
end $$;

create function t.expect_true(cond boolean, label text) returns void
language plpgsql as $$
begin
  insert into t.log values (coalesce(cond, false), label);
end $$;
grant execute on all functions in schema t to anon, authenticated, service_role;

-- ------------------------------------------------------------ massa de teste (como servidor)
\set staff    '11111111-1111-1111-1111-111111111111'
\set analyst  '22222222-2222-2222-2222-222222222222'
\set outsider '33333333-3333-3333-3333-333333333333'

insert into auth.users (id, email) values
  (:'staff','staff@test'), (:'analyst','analyst@test'), (:'outsider','outsider@test');
insert into public.admin_users (user_id, name, role) values
  (:'staff','Admin','admin'), (:'analyst','Analista','analyst');
-- (as linhas acima foram inseridas pelo superusuário, como faria o servidor)

set role service_role;
insert into public.companies (id,name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
values ('aaaaaaaa-0000-0000-0000-000000000001','Empresa Teste','services','professional_services','Salvador','BA','2_5','none','{referrals}','steady_inflow');
insert into public.contacts (id,company_id,name,email,phone_e164)
values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Pessoa Teste','teste@exemplo.com','+5571999999999');
insert into public.diagnostics (id,company_id,contact_id,questionnaire_version)
values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','v1');
insert into public.leads (id,company_id,contact_id,diagnostic_id)
values ('dddddddd-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001');
select t.expect_true((select count(*) from public.leads) = 1, 'service_role grava e lê leads');
select t.expect_true((select length(public_token) from public.diagnostics) >= 64, 'token do diagnóstico tem 64+ caracteres');
reset role;

-- ------------------------------------------------------------ visitante anônimo: nada
set role anon;
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    perform t.expect_error(format('select 1 from public.%I limit 1', r.tablename), '42501', 'anon não lê ' || r.tablename);
    perform t.expect_error(format('insert into public.%I default values', r.tablename), '42501', 'anon não insere em ' || r.tablename);
    perform t.expect_error(format('delete from public.%I', r.tablename), '42501', 'anon não apaga em ' || r.tablename);
  end loop;
end $$;
select t.expect_error('select public.is_staff()', '42501', 'anon não executa is_staff()');
reset role;

-- --------------------------------------------- autenticada, mas fora da equipe: não vê nada
set role authenticated;
select set_config('request.jwt.claim.sub', :'outsider', false);
select t.expect_true((select count(*) from public.leads) = 0, 'usuário fora da equipe vê 0 leads');
select t.expect_true((select count(*) from public.contacts) = 0, 'usuário fora da equipe vê 0 contatos');
select t.expect_true((select count(*) from public.diagnostics) = 0, 'usuário fora da equipe vê 0 diagnósticos');
select t.expect_error($q$insert into public.lead_notes (lead_id,author_id,body) values ('dddddddd-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','x')$q$,
  '42501', 'usuário fora da equipe não cria nota');
update public.leads set commercial_status = 'converted';
reset role;
select t.expect_true((select commercial_status from public.leads) = 'new', 'usuário fora da equipe não altera status');

-- ------------------------------------------------------------------- equipe (analista)
set role authenticated;
select set_config('request.jwt.claim.sub', :'analyst', false);
select t.expect_true((select count(*) from public.leads) = 1, 'analista vê o lead');
select t.expect_true((select count(*) from public.contacts) = 1, 'analista vê o contato');
update public.leads set commercial_class = 'A', class_justification = 'teste', commercial_status = 'in_review';
select t.expect_true((select commercial_class from public.leads) = 'A', 'analista altera a classificação');
insert into public.lead_notes (lead_id,author_id,body)
  values ('dddddddd-0000-0000-0000-000000000001', :'analyst', 'nota interna');
select t.expect_true((select count(*) from public.lead_notes) = 1, 'analista registra nota');
select t.expect_error($q$insert into public.lead_notes (lead_id,author_id,body) values ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','falsa autoria')$q$,
  '42501', 'analista não registra nota em nome de outra pessoa');
select t.expect_error($q$update public.leads set source_channel = 'whatsapp'$q$, '42501', 'analista não altera a origem do lead');
select t.expect_error($q$update public.leads set company_id = gen_random_uuid()$q$, '42501', 'analista não troca a empresa do lead');
select t.expect_error($q$delete from public.leads$q$, '42501', 'analista não apaga leads');
select t.expect_error($q$update public.companies set name = 'x'$q$, '42501', 'analista não altera dados da empresa');
select t.expect_error($q$insert into public.services (slug,name,category) values ('x','x','entry')$q$, '42501', 'analista não cria serviço');
select t.expect_error($q$insert into public.admin_users (user_id,name) values (gen_random_uuid(),'x')$q$, '42501', 'ninguém cria equipe pelo painel');
select t.expect_true((select count(*) from public.admin_users) = 1, 'cada pessoa vê só a própria linha de equipe');
reset role;
select t.expect_true((select count(*) from public.lead_events where field = 'commercial_class' and new_value = 'A' and actor_id = :'analyst') = 1,
  'histórico registra a mudança de classificação com o autor');
select t.expect_true((select count(*) from public.lead_events where field = 'commercial_status') = 1,
  'histórico registra a mudança de status uma única vez');

-- ------------------------------------------------------------------- equipe (admin)
set role authenticated;
select set_config('request.jwt.claim.sub', :'staff', false);
insert into public.services (slug,name,category,suggestion_mode) values ('novo','Novo serviço','entry','manual_only');
select t.expect_true((select count(*) from public.services where slug = 'novo') = 1, 'admin cria serviço no catálogo');
reset role;

-- ------------------------------------------------------------------ regras de dados
set role service_role;
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','services','retail','Rio','RJ','solo','prefer_not_say','{referrals}','steady_inflow')$q$, '23514', 'investimento "prefiro não informar" é recusado');
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','services','retail','Rio','RJ','solo',null,'{referrals}','steady_inflow')$q$, '23502', 'investimento é obrigatório');
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','services','retail','Rio','RJ','solo','none','{referrals,none_structured}','steady_inflow')$q$, '23514', '"sem canais estruturados" é exclusivo');
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','services','retail','Rio','RJ','solo','none','{}','steady_inflow')$q$, '23514', 'ao menos um canal é obrigatório');
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','both','retail','Rio','RJ','solo','none','{referrals}','steady_inflow')$q$, '23514', 'modelo "ambos" não existe na v1');
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','services','other','Rio','RJ','solo','none','{referrals}','steady_inflow')$q$, '23514', 'setor "outros" exige descrição');
select t.expect_error($q$insert into public.companies (name,business_model,sector,city,state,employees_range,marketing_spend_range,channels,main_goal)
  values ('x','services','retail','Rio','Rio','solo','none','{referrals}','steady_inflow')$q$, '23514', 'estado precisa ter a sigla de 2 letras');
insert into public.companies (name,business_model,sector,city,state,employees_range,revenue_range,marketing_spend_range,channels,main_goal)
  values ('Sem faturamento','products_online','retail','Rio','RJ','solo',null,'none','{none_structured}','prepare_to_grow');
select t.expect_true(true, 'faturamento é opcional e "não investimos" é válido');
select t.expect_error($q$insert into public.contacts (company_id,name,email,phone_e164)
  values ('aaaaaaaa-0000-0000-0000-000000000001','x','sem-arroba','+5571999999999')$q$, '23514', 'e-mail inválido é recusado');
select t.expect_error($q$insert into public.contacts (company_id,name,email,phone_e164)
  values ('aaaaaaaa-0000-0000-0000-000000000001','x','a@b.co','71999999999')$q$, '23514', 'telefone sem formato internacional é recusado');
select t.expect_error($q$insert into public.consents (contact_id,purpose,granted,notice_version)
  values ('bbbbbbbb-0000-0000-0000-000000000001','outra',true,'v1')$q$, '23514', 'finalidade de consentimento inválida é recusada');
select t.expect_true((select count(*) from public.services where suggestion_mode = 'manual_only' and category = 'recurring') = 6,
  'serviços recorrentes nunca são sugeridos automaticamente');
select t.expect_true((select count(*) from public.services where suggestion_mode = 'auto_if_clear' and category <> 'entry') = 0,
  'só serviços de entrada podem ser sugeridos automaticamente');
reset role;

-- ------------------------------------------------------------------------ resultado
\o
do $$
declare falhas int; total int; r record;
begin
  select count(*) filter (where not ok), count(*) into falhas, total from t.log;
  for r in select label from t.log where not ok loop
    raise warning 'FALHA: %', r.label;
  end loop;
  raise notice '% verificações, % falhas', total, falhas;
  if falhas > 0 then raise exception 'testes de segurança falharam'; end if;
end $$;
