#  FLUXO DE AGENDAMENTOS - GESTAFORMS HUB

##  Workflow Oficial (Atualizado em 17/11/2025)

### Etapa 1: Médico da Unidade preenche formulário
- **Página:** /novo-agendamento
- **Ação:** Médico preenche todos os dados clínicos da paciente
- **Sistema:**
  - Calcula IG (Idade Gestacional)
  - Valida protocolo obstétrico
  - Sugere data ideal de agendamento
  - **Salva com status: "pendente"**
  - **NÃO define data de agendamento ainda**

### Etapa 2: Admin Médico aprova
- **Página:** /aprovacoes-agendamentos
- **Ação:** Admin médico revisa e aprova/rejeita
- **Ao aprovar:**
  - Define data final de agendamento
  - Adiciona observações (opcional)
  - **Muda status para: "aprovado"**
  - **Registra quem aprovou e quando**

### Etapa 3: Paciente visualiza
- **Página:** /meus-agendamentos
- **Vê:**
  - Status do agendamento
  - Data confirmada (se aprovado)
  - Orientações e protocolos

##  Permissões

- **Médico da Unidade**: Criar agendamentos (status pendente)
- **Admin Médico**: Aprovar/rejeitar agendamentos
- **Paciente**: Visualizar seus agendamentos

##  Status Possíveis

- \pendente\: Aguardando aprovação do admin médico
- \provado\: Aprovado e com data confirmada
- \ejeitado\: Rejeitado com justificativa
- \cancelado\: Cancelado posteriormente

##  Campos Importantes

### No formulário (médico):
- Dados clínicos completos
- DUM ou USG
- Diagnósticos maternos e fetais
- Indicação do procedimento

### Na aprovação (admin):
- **data_agendamento**: Data final confirmada
- **observacoes_aprovacao**: Observações do revisor
- **aprovado_por**: ID do admin que aprovou
- **aprovado_em**: Timestamp da aprovação

##  Regras de Negócio

1. **TODOS** os novos casos entram como "pendente"
2. **APENAS admin médico** pode aprovar
3. Data de agendamento **só é definida na aprovação**
4. Sistema **sugere** data ideal, mas admin decide
5. Rejeição **exige** justificativa

##  Histórico de Mudanças

- **17/11/2025**: Implementado fluxo de aprovação obrigatória
- Status inicial mudado de "aprovado" para "pendente"
- Data de agendamento removida do formulário inicial

---
**Importante:** Scripts de importação em massa são apenas para migração de dados históricos. Novos agendamentos DEVEM seguir o fluxo de aprovação.
