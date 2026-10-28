# Para quem continuar este projeto (ou abrir uma sessão nova)

## Contexto rápido
Produto: 2Lev Evolution, diagnóstico de marketing adaptativo para gerar e qualificar leads da 2Lev. A especificação funcional (MVP 1.0) é um documento da Sarah; os pontos principais estão no README e em `docs/ARQUITETURA.md`.
Sarah não é técnica: explicar em linguagem simples, sem pedir que ela cole chaves no chat.

## Estado
- Etapa 1 (banco, RLS, testes): pronta e **aplicada** no projeto Supabase `plfflvcgxvvfaehiqrkn` (região São Paulo, plano gratuito).
- Etapa 2 (página inicial, cadastro E01 a E13, API de rascunho): pronta e testada com banco em memória. **Falta** testar a gravação real no Supabase.
- Etapa 3 em diante: ver tabela no README.

## Identidade visual
Azul marinho, branco e dourado (pedido da Sarah). Os tons estão em `src/app/globals.css` e são provisórios: marinho `#0B1F3A`, dourado `#C9A24B`. Pedir os tons e a logo do manual da marca. Tema claro e escuro já existem.

## Decisões já tomadas
- Supabase gratuito para construir; passar ao plano Pro antes de divulgar ao público.
- Serviços só são sugeridos ao lead quando estiver claro e só os de entrada (`services.suggestion_mode`); anúncios, CRM, automação, funis e consultoria são sempre análise manual da Sarah.
- Sem nota geral única; níveis qualitativos por dimensão; sem percentuais sem validação.

## Decisões abertas (perguntar à Sarah)
Hospedagem (VPS com Easypanel ou Vercel); quem acessa o painel; retenção e exclusão de dados; envio do relatório por e-mail; aviso interno de lead Prioridade A; pergunta nova "Como você prefere começar?"; renomear o Ramo E do questionário para X01 a X03; gatilho da Q04 (sugestão: quando o lead indicar crescimento, dificuldade de conversão ou interesse em atrair mais contatos).

## Primeira coisa a fazer em uma sessão nova
Verificar se as chaves do Supabase chegaram ao ambiente (sem imprimir os valores) e rodar o cadastro contra o banco real. Se o ambiente só oferece "Adicionar segredo" (cabeçalhos para um site), a chamada ao Supabase recebe a chave injetada nos cabeçalhos; testar com uma chamada simples ao `/rest/v1/` do projeto antes de assumir que funciona com a biblioteca do aplicativo.
