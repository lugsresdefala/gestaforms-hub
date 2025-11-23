# Protocolo Integrado de Validação de Algoritmos e Workflows

Este documento adapta o protocolo proposto para o contexto do **Gestaforms Hub**, cobrindo validação de regras clínicas, fluxos de agendamento, auditoria e observabilidade contínua.

## 1. Objetivo

Garantir que algoritmos e workflows:

- reflitam fielmente os protocolos obstétricos e regras de negócio;
- não apresentem contradições, lacunas ou sobreposições;
- sejam rastreáveis e auditáveis em produção;
- mantenham consistência entre versões.

## 2. Arquitetura de Validação em Quatro Camadas

### Camada 1 — Modelagem Estrutural do Workflow

- Representar fluxos como grafos (nós = etapas; arestas = transições; condições = bloqueios/permissões).
- Validar: etapas obrigatórias presentes, ausência de ciclos indevidos, estados inalcançáveis e rotas alternativas completas.
- Cada etapa deve declarar entradas, pré-condições, pós-condições e erros esperados.

### Camada 2 — Validação de Regras e Pontos de Corte

- Descrever regras em DSL declarativa (YAML/JSON) com ID, descrição, intervalo/condição, ação e versão.
- Impor políticas numéricas: intervalos sem sobreposição, sem lacunas e fronteiras consistentes (ex.: [min, max)).
- Automatizar testes de limites e comparação entre regras documentais e implementadas.

### Camada 3 — Rastreabilidade e Auditoria

- Registrar execuções com `workflow_id`, `workflow_versao`, `regra_id`, entradas/saídas, usuário/sessão e caminho percorrido.
- Validar coerência de transições; transições inválidas geram alerta e incidente.
- Executar auditorias periódicas para identificar divergências, ações de fallback e regras obsoletas.

### Camada 4 — Testes e Observabilidade

- Testes unitários de regras (bordas inferior/superior e valores inesperados).
- Testes de fluxo end-to-end (entrada → cálculo → avaliação → ação).
- Testes baseados em propriedades para verificar invariantes.
- Regressão de regras: reprocessar casos históricos e comparar resultados.
- Expor métricas (tempo médio, frequência por caminho, violações, erros técnicos, acionamento por regra) via Prometheus/OpenTelemetry; dashboards no Grafana e análise de logs estruturados (ELK/Splunk).

## 3. Controle de Versão de Regras

- Cada regra deve registrar ID único, descrição, fórmula/condição, datas, responsável, referência documental e versão.
- Procedimento de conciliação documento ↔ código: extrair regras oficiais, extrair DSL implementada e comparar faltantes/excedentes/divergentes.
- Alterações exigem justificativa, parecer técnico, revisão e histórico de versões.

## 4. Checklist de Validação

- **Fluxo**: grafo modelado; transições validadas; sem ciclos indevidos; caminhos completos e alcançáveis.
- **Regras**: sem sobreposições; sem lacunas; IDs e versões presentes; correspondência 1:1 com documento institucional.
- **Execução**: logs estruturados; rastreabilidade completa; auditorias periódicas ativas.
- **Testes**: bordas numéricas; fluxo integral; propriedades gerais; regressão histórica.
- **Observabilidade**: métricas e alertas configurados; relatórios periódicos de consistência.

## 5. Como Aplicar no Gestaforms Hub

1. **Mapear fluxos críticos**: agendamentos, protocolos obstétricos, permissões e triagens.
2. **Formalizar regras**: consolidar critérios clínicos e institucionais em DSL única versionada.
3. **Automatizar testes**: criar suites de unidade (bordas) e E2E cobrindo caminhos típicos e exceções.
4. **Implementar rastreabilidade**: padronizar logs estruturados e painéis de métricas para cada regra/workflow.
5. **Rodar regressão contínua**: reprocessar casos reais a cada mudança de regra e publicar relatórios de divergências.

### Pontos de encaixe no código existente

- **Autorização e proteção de rotas**: `src/components/ProtectedRoute.tsx` e `src/lib/authHelpers.ts` já centralizam validação de roles; reutilizar para testar transições autorizadas entre telas.
- **Workflow de agendamentos**: `src/pages/Index.tsx` concentra criação/listagem de agendamentos, enquanto `src/pages/CalendarioCompleto.tsx` e `src/pages/OcupacaoMaternidades.tsx` calculam urgência a partir de datas; use esses cálculos como casos-base para testes de borda e detecção de lacunas.
- **Persistência e auditoria**: o schema Supabase em `src/integrations/supabase/types.ts` inclui `audit_logs`; alinhe o log estruturado proposto com essa tabela e aproveite as integrações já usadas em `src/contexts/AuthContext.tsx` para registrar eventos críticos.
- **Pipelines de dados**: scripts em `src/scripts` (ex.: `updateIGFromCSV.ts`) já processam dados em lote; adicione testes de propriedade e regressão nesse nível para garantir consistência entre versões de regras.

### Achados no código atual e sugestões

- **Porta de entrada de acesso sem rastreio estruturado**: o componente `ProtectedRoute` controla o acesso por role e exibe toast em caso de bloqueio, porém não registra tentativas negadas em nenhum log centralizado. Conectar essas negações à tabela `audit_logs` garante trilha de auditoria para decisões de autorização e alimenta a camada de observabilidade proposta.
- **Sessões e roles recuperados sem auditoria**: o `AuthContext` obtém sessão, roles e executa login/logout com feedback via toast, mas não grava eventos de autenticação/autorização. Instrumentar sucesso/falha de login, atribuição de roles e logout na `audit_logs` fecha o ciclo de rastreabilidade para transições de usuário.
- **Logs já consumíveis, mas sem standard de formato**: a página `LogsAuditoria` já lista/exporta registros de `audit_logs`, então padronizar o formato dos eventos enviados (campos de regra/workflow, versão, entradas/saídas) permitirá análises automáticas de coerência e volume por regra.
- **Ausência de suíte de testes automatizados**: o `package.json` não define script de testes nem dependências de framework de teste, indicando que o protocolo ainda não está amarrado a verificações contínuas. Adotar Vitest (unitário), Playwright ou Cypress (E2E) e rodar em CI cobre as camadas 2 e 4 do protocolo.
- **Cálculos de IG sem regressão**: o script `updateIGFromCSV.ts` já extrai idade gestacional de textos livres e atualiza registros em lote; criar testes baseados em propriedades para `extrairIG` e cenários de regressão usando amostras de CSV evita variações silenciosas entre versões de regra.

Seguir estas etapas cria um ciclo contínuo de qualidade, garantindo integridade algorítmica e conformidade com os protocolos oficiais.
