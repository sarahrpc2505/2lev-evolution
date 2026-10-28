# 2Lev Evolution

Diagnóstico de marketing adaptativo, captação e qualificação de leads da 2Lev.
Especificação funcional: "2Lev Evolution, MVP 1.0" (documento da Sarah). Este repositório começa pela base de dados e segurança.

## Estado atual
| Etapa | Situação |
|---|---|
| 1. Base: esquema do banco, RLS e testes de acesso | Pronta, testada localmente (66 verificações) |
| 2. Aplicação web: página inicial e cadastro da empresa | A fazer |
| 3. Motor adaptativo (Q01 a Q06, ramos A a E) | A fazer |
| 4. Diagnóstico e relatório | A fazer |
| 5. Painel administrativo | A fazer |
| 6. Testes dos 10 perfis, segurança e celular | A fazer |

Ainda **não foi aplicado** ao projeto Supabase. Ver `docs/ARQUITETURA.md`, seção "Aplicar no Supabase".

## Estrutura
```
supabase/migrations/   0001_schema.sql, 0002_security.sql  (fonte da verdade do banco)
supabase/seed.sql      catálogo de serviços (configuração, sem preços)
supabase/tests/        run.sh sobe um Postgres temporário e roda os testes de segurança
docs/ARQUITETURA.md    decisões, modelo de segurança, custos e pendências
.env.example           nomes das variáveis (valores nunca são versionados)
```

## Rodar os testes do banco
Precisa do PostgreSQL 15 ou superior instalado (só os binários; o script cria um servidor temporário).
```
supabase/tests/run.sh
```
Os testes simulam os papéis do Supabase (`anon`, `authenticated`, `service_role`) e provam, entre outras coisas, que o visitante anônimo não lê nem escreve em nenhuma tabela e que a equipe não altera a origem do lead.

## Segredos
Nunca versionar `.env`. A chave `SUPABASE_SERVICE_ROLE_KEY` ignora o RLS e só pode existir no servidor.
