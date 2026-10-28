# Arquitetura e decisões

## Princípios
- Questionário e relatório determinísticos (regras explícitas, sem IA generativa no fluxo do MVP).
- O visitante nunca fala direto com o banco. Toda escrita pública passa por rotas do servidor, que validam os dados e usam a chave `service_role`.
- Maturidade, prioridade estratégica e classificação comercial são resultados separados e armazenados em campos distintos.
- Serviços só são sugeridos ao lead quando a regra deixa claro (ver "Política de sugestão").

## Stack escolhida
| Camada | Escolha | Motivo |
|---|---|---|
| Banco, login e RLS | Supabase (Postgres), região São Paulo | RLS nativo, backup gerenciado no plano pago, saída fácil (Postgres padrão) |
| Aplicação | Next.js com TypeScript | Uma base de código para página pública, relatório e painel |
| Motor de regras | Módulo TypeScript puro, separado da interface | Testável sem navegador |
| Hospedagem | A decidir (VPS com Easypanel ou Vercel) | Não bloqueia a construção |

## Modelo de segurança
- `anon` (visitante): **sem nenhum grant** em tabela. Testado.
- `authenticated`: só enxerga dados se existir linha em `admin_users` (`is_staff()`); não tem DELETE; o UPDATE em `leads` é limitado por coluna (classificação, status, prioridade, próxima ação e responsável). Origem, vínculos e identificadores são imutáveis para a equipe.
- Catálogo de serviços: só `role = 'admin'` cria ou altera.
- Gestão da equipe (`admin_users`) só pelo servidor ou pelo SQL Editor.
- Mudanças de classificação, status, prioridade, próxima ação e responsável geram histórico automático (`lead_events`), com o autor.
- Link do relatório e retomada de rascunho: `diagnostics.public_token` (244 bits), lido só pelo servidor.

## Política de sugestão de serviços
`services.suggestion_mode`:
- `auto_if_clear`: pode aparecer ao lead como "para começar com pouco", só se a regra deixar claro (investimento baixo, lacuna evidente de base ou presença e nenhum sinal de que exige análise maior). Hoje: serviços de entrada (Google Meu Negócio, página, identidade, plano de 90 dias, geradores).
- `manual_only`: nunca sugerido automaticamente. Vira "ponto a investigar" no relatório e checklist de pesquisa no painel (`research_checklist`). Hoje: anúncios, CRM, automação, funis, estruturação comercial, consultoria, planejamento e complementares.
O valor de investimento nunca classifica maturidade nem prioridade; só decide se a opção de entrada pode ser mostrada.

## Aplicar no Supabase (pendente)
1. No painel do projeto, abrir **SQL Editor**.
2. Colar e executar, nesta ordem: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_security.sql`, `supabase/seed.sql`.
3. Em **Authentication > Users**, criar o usuário da Sarah. Depois, no SQL Editor:
   ```sql
   insert into public.admin_users (user_id, name, role)
   values ('<ID do usuário em Authentication>', 'Sarah', 'admin');
   ```
4. Conferir em **Table Editor** que todas as tabelas mostram RLS ativo.

## Custos (confirmar nas páginas oficiais antes de contratar)
- Supabase: Free (US$ 0) para construir e testar; Pro (cerca de US$ 25 por mês por organização) antes de divulgar, por causa da pausa por inatividade e dos backups.
- Hospedagem: VPS existente (sem custo extra) ou Vercel Pro (cerca de US$ 20 por usuário por mês; o plano Hobby não permite uso comercial).
- E-mail do relatório (opcional): Resend tem plano gratuito limitado.
- Revisão jurídica do aviso de privacidade e da política de retenção: custo externo a orçar.

## Pendências de decisão
- Hospedagem (VPS ou Vercel).
- Quem terá acesso ao painel e com qual papel.
- Política de retenção e exclusão de dados (hoje ninguém da equipe apaga; exclusão só pelo servidor).
- Envio do relatório por e-mail.
- Aviso interno quando chegar lead Prioridade A, e por qual canal.
- Pergunta nova "Como você prefere começar?" (fora da especificação).
- IDs do Ramo E do questionário colidem com E01 a E13 do cadastro; sugestão: X01 a X03.
- Gatilho exato da pergunta Q04 e posição das perguntas Q05 e Q06.
- Texto e revisão do aviso de privacidade.
